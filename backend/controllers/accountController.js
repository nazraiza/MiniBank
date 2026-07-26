const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const Branch = require('../models/Branch');
const { sendAccountApprovedEmail, sendAccountRejectedEmail } = require('../utils/email');
const audit = require('../utils/audit');
const generateStatement = require('../utils/pdfStatement');

// @POST /api/accounts — customer opens account
exports.openAccount = async (req, res, next) => {
  try {
    const { type, initialDeposit, branchId } = req.body;
    if (!type || !initialDeposit || !branchId) {
      return res.status(400).json({ message: 'Type, initial deposit, and branch are required' });
    }
    if (initialDeposit < 500) {
      return res.status(400).json({ message: 'Minimum initial deposit is BDT 500' });
    }
    const branch = await Branch.findById(branchId);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });

    const account = await Account.create({
      customer: req.user._id,
      branch: branchId,
      type,
      initialDeposit,
      balance: 0, // credited on approval
    });

    await audit(req.user._id, 'OPEN_ACCOUNT_REQUEST', 'Account', account._id, `Type: ${type}`, req);
    res.status(201).json({ success: true, account });
  } catch (err) { next(err); }
};

// @GET /api/accounts — customer sees own accounts
exports.getMyAccounts = async (req, res, next) => {
  try {
    const accounts = await Account.find({ customer: req.user._id })
      .populate('branch', 'name city branchCode');
    res.json({ success: true, accounts });
  } catch (err) { next(err); }
};

// @GET /api/accounts/:id — get single account (owner or officer/admin)
exports.getAccount = async (req, res, next) => {
  try {
    const account = await Account.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('branch', 'name city');

    if (!account) return res.status(404).json({ message: 'Account not found' });

    // Customers can only see their own
    if (req.user.role === 'customer' && account.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json({ success: true, account });
  } catch (err) { next(err); }
};

// @GET /api/accounts/pending — officer/admin sees pending requests
exports.getPendingAccounts = async (req, res, next) => {
  try {
    const accounts = await Account.find({ status: 'pending' })
      .populate('customer', 'name email phone nidNumber')
      .populate('branch', 'name city')
      .sort('-createdAt');
    res.json({ success: true, accounts });
  } catch (err) { next(err); }
};

// @GET /api/accounts/all — officer/admin sees all accounts
exports.getAllAccounts = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;

    let accounts = await Account.find(filter)
      .populate('customer', 'name email phone')
      .populate('branch', 'name city')
      .sort('-createdAt');

    if (search) {
      accounts = accounts.filter(a =>
        a.accountNumber.includes(search) ||
        a.customer?.name.toLowerCase().includes(search.toLowerCase()) ||
        a.customer?.email.toLowerCase().includes(search.toLowerCase())
      );
    }
    res.json({ success: true, accounts });
  } catch (err) { next(err); }
};

// @PUT /api/accounts/:id/approve — officer approves
exports.approveAccount = async (req, res, next) => {
  try {
    const account = await Account.findById(req.params.id).populate('customer');
    if (!account) return res.status(404).json({ message: 'Account not found' });
    if (account.status !== 'pending') return res.status(400).json({ message: 'Account is not pending' });

    account.status = 'active';
    account.balance = account.initialDeposit;
    account.approvedBy = req.user._id;
    account.approvedAt = new Date();
    await account.save();

    // Record the initial deposit transaction
    await Transaction.create({
      account: account._id,
      type: 'deposit',
      amount: account.initialDeposit,
      balanceAfter: account.initialDeposit,
      note: 'Initial deposit on account opening',
      processedBy: req.user._id,
    });

    sendAccountApprovedEmail(account.customer, account);
    await audit(req.user._id, 'APPROVE_ACCOUNT', 'Account', account._id, `Account: ${account.accountNumber}`, req);
    res.json({ success: true, message: 'Account approved', account });
  } catch (err) { next(err); }
};

// @PUT /api/accounts/:id/reject — officer rejects
exports.rejectAccount = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const account = await Account.findById(req.params.id).populate('customer');
    if (!account) return res.status(404).json({ message: 'Account not found' });
    if (account.status !== 'pending') return res.status(400).json({ message: 'Account is not pending' });

    account.status = 'closed';
    account.rejectedReason = reason || 'No reason provided';
    await account.save();

    sendAccountRejectedEmail(account.customer, account.rejectedReason);
    await audit(req.user._id, 'REJECT_ACCOUNT', 'Account', account._id, reason, req);
    res.json({ success: true, message: 'Account rejected' });
  } catch (err) { next(err); }
};

// @PUT /api/accounts/:id/freeze — admin freezes
exports.freezeAccount = async (req, res, next) => {
  try {
    const account = await Account.findByIdAndUpdate(
      req.params.id,
      { status: req.body.freeze ? 'frozen' : 'active' },
      { new: true }
    );
    if (!account) return res.status(404).json({ message: 'Account not found' });
    await audit(req.user._id, req.body.freeze ? 'FREEZE_ACCOUNT' : 'UNFREEZE_ACCOUNT', 'Account', account._id, '', req);
    res.json({ success: true, account });
  } catch (err) { next(err); }
};

// @GET /api/accounts/:id/statement — download PDF
exports.downloadStatement = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const account = await Account.findById(req.params.id).populate('customer', 'name email');
    if (!account) return res.status(404).json({ message: 'Account not found' });

    if (req.user.role === 'customer' && account.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const filter = { account: account._id };
    if (from) filter.createdAt = { $gte: new Date(from) };
    if (to) filter.createdAt = { ...filter.createdAt, $lte: new Date(to) };

    const transactions = await Transaction.find(filter).sort('createdAt');
    generateStatement(res, account, account.customer, transactions, from, to);
  } catch (err) { next(err); }
};
