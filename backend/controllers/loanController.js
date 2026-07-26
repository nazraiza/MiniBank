const mongoose = require('mongoose');
const Loan = require('../models/Loan');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const { sendLoanApprovedEmail, sendLoanRejectedEmail } = require('../utils/email');
const audit = require('../utils/audit');

// @POST /api/loans — customer applies
exports.applyLoan = async (req, res, next) => {
  try {
    const { accountId, amount, purpose, tenureMonths } = req.body;
    if (!accountId || !amount || !purpose || !tenureMonths) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (amount < 1000) return res.status(400).json({ message: 'Minimum loan amount is BDT 1,000' });

    const account = await Account.findById(accountId);
    if (!account || account.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Invalid account' });
    }
    if (account.status !== 'active') return res.status(400).json({ message: 'Account must be active' });

    // Check no existing pending loan
    const existing = await Loan.findOne({ customer: req.user._id, status: 'pending' });
    if (existing) return res.status(400).json({ message: 'You already have a pending loan application' });

    const loan = await Loan.create({
      customer: req.user._id,
      account: accountId,
      amount,
      purpose,
      tenureMonths,
    });

    await audit(req.user._id, 'APPLY_LOAN', 'Loan', loan._id, `BDT ${amount} for ${purpose}`, req);
    res.status(201).json({ success: true, loan });
  } catch (err) { next(err); }
};

// @GET /api/loans/my — customer sees own loans
exports.getMyLoans = async (req, res, next) => {
  try {
    const loans = await Loan.find({ customer: req.user._id })
      .populate('account', 'accountNumber')
      .populate('processedBy', 'name')
      .sort('-createdAt');
    res.json({ success: true, loans });
  } catch (err) { next(err); }
};

// @GET /api/loans/:id
exports.getLoan = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('account', 'accountNumber type')
      .populate('processedBy', 'name');
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    if (req.user.role === 'customer' && loan.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json({ success: true, loan });
  } catch (err) { next(err); }
};

// @GET /api/loans — officer/admin sees all
exports.getAllLoans = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const total = await Loan.countDocuments(filter);
    const loans = await Loan.find(filter)
      .populate('customer', 'name email phone')
      .populate('account', 'accountNumber')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, loans, total, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// @PUT /api/loans/:id/approve — officer approves
exports.approveLoan = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { interestRate } = req.body;
    if (!interestRate || interestRate < 0) {
      return res.status(400).json({ message: 'Valid interest rate required' });
    }

    const loan = await Loan.findById(req.params.id).populate('customer');
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    if (loan.status !== 'pending') return res.status(400).json({ message: 'Loan is not pending' });

    const account = await Account.findById(loan.account);
    if (!account || account.status !== 'active') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Customer account is not active' });
    }

    loan.status = 'approved';
    loan.interestRate = Number(interestRate);
    loan.processedBy = req.user._id;
    loan.decisionAt = new Date();
    loan.generateSchedule();

    // Credit loan to account
    account.balance += loan.amount;
    await account.save({ session });

    await Transaction.create([{
      account: account._id,
      type: 'deposit',
      amount: loan.amount,
      balanceAfter: account.balance,
      note: `Loan disbursement — Ref: ${loan.loanRef}`,
      processedBy: req.user._id,
    }], { session });

    await loan.save({ session });
    await session.commitTransaction();

    sendLoanApprovedEmail(loan.customer, loan);
    await audit(req.user._id, 'APPROVE_LOAN', 'Loan', loan._id, `BDT ${loan.amount} at ${interestRate}%`, req);

    res.json({ success: true, message: 'Loan approved and amount disbursed', loan });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

// @PUT /api/loans/:id/reject — officer rejects
exports.rejectLoan = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const loan = await Loan.findById(req.params.id).populate('customer');
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    if (loan.status !== 'pending') return res.status(400).json({ message: 'Loan is not pending' });

    loan.status = 'rejected';
    loan.rejectedReason = reason || 'Application did not meet requirements';
    loan.processedBy = req.user._id;
    loan.decisionAt = new Date();
    await loan.save();

    sendLoanRejectedEmail(loan.customer, loan.rejectedReason);
    await audit(req.user._id, 'REJECT_LOAN', 'Loan', loan._id, reason, req);
    res.json({ success: true, message: 'Loan rejected' });
  } catch (err) { next(err); }
};

// @PUT /api/loans/:id/repay/:installmentId — mark installment paid
exports.payInstallment = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    if (loan.customer.toString() !== req.user._id.toString() && req.user.role === 'customer') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const installment = loan.repaymentSchedule.id(req.params.installmentId);
    if (!installment) return res.status(404).json({ message: 'Installment not found' });
    if (installment.paid) return res.status(400).json({ message: 'Installment already paid' });

    const account = await Account.findById(loan.account);
    if (account.balance < installment.amount) {
      return res.status(400).json({ message: 'Insufficient balance to pay installment' });
    }

    account.balance -= installment.amount;
    await account.save();

    await Transaction.create({
      account: account._id,
      type: 'withdrawal',
      amount: installment.amount,
      balanceAfter: account.balance,
      note: `Loan repayment — ${loan.loanRef} installment #${installment.installmentNumber}`,
    });

    installment.paid = true;
    installment.paidAt = new Date();
    installment.paidAmount = installment.amount;

    // Check if all paid → close loan
    const allPaid = loan.repaymentSchedule.every(i => i.paid);
    if (allPaid) loan.status = 'closed';

    await loan.save();
    await audit(req.user._id, 'PAY_INSTALLMENT', 'Loan', loan._id,
      `Installment #${installment.installmentNumber} BDT ${installment.amount}`, req);

    res.json({ success: true, loan });
  } catch (err) { next(err); }
};
