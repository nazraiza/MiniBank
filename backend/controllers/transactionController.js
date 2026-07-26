const mongoose = require('mongoose');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { sendTransactionEmail } = require('../utils/email');
const audit = require('../utils/audit');

// Helper — get active account owned by current user
const getActiveCustomerAccount = async (accountId, userId) => {
  const account = await Account.findById(accountId);
  if (!account) throw { statusCode: 404, message: 'Account not found' };
  if (account.customer.toString() !== userId.toString()) throw { statusCode: 403, message: 'Not authorized' };
  if (account.status !== 'active') throw { statusCode: 400, message: `Account is ${account.status}` };
  return account;
};

// @POST /api/transactions/deposit
exports.deposit = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { accountId, amount, note } = req.body;
    if (!amount || amount < 1) return res.status(400).json({ message: 'Invalid amount' });

    const account = req.user.role === 'customer'
      ? await getActiveCustomerAccount(accountId, req.user._id)
      : await Account.findById(accountId);

    if (!account || account.status !== 'active') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Account not found or not active' });
    }

    account.balance += Number(amount);
    await account.save({ session });

    const txn = await Transaction.create([{
      account: account._id,
      type: 'deposit',
      amount: Number(amount),
      balanceAfter: account.balance,
      note: note || 'Cash deposit',
      processedBy: req.user.role !== 'customer' ? req.user._id : undefined,
    }], { session });

    await session.commitTransaction();

    // Send email async (don't await)
    const customer = await User.findById(account.customer);
    if (customer) sendTransactionEmail(customer, txn[0], account.accountNumber);
    await audit(req.user._id, 'DEPOSIT', 'Transaction', txn[0]._id, `BDT ${amount} to ${account.accountNumber}`, req);

    res.status(201).json({ success: true, transaction: txn[0], balance: account.balance });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

// @POST /api/transactions/withdraw
exports.withdraw = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { accountId, amount, note } = req.body;
    if (!amount || amount < 1) return res.status(400).json({ message: 'Invalid amount' });

    const account = req.user.role === 'customer'
      ? await getActiveCustomerAccount(accountId, req.user._id)
      : await Account.findById(accountId);

    if (!account || account.status !== 'active') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Account not found or not active' });
    }
    if (account.balance < Number(amount)) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    account.balance -= Number(amount);
    await account.save({ session });

    const txn = await Transaction.create([{
      account: account._id,
      type: 'withdrawal',
      amount: Number(amount),
      balanceAfter: account.balance,
      note: note || 'Cash withdrawal',
      processedBy: req.user.role !== 'customer' ? req.user._id : undefined,
    }], { session });

    await session.commitTransaction();

    const customer = await User.findById(account.customer);
    if (customer) sendTransactionEmail(customer, txn[0], account.accountNumber);
    await audit(req.user._id, 'WITHDRAWAL', 'Transaction', txn[0]._id, `BDT ${amount} from ${account.accountNumber}`, req);

    res.status(201).json({ success: true, transaction: txn[0], balance: account.balance });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

// @POST /api/transactions/transfer
exports.transfer = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { senderAccountId, recipientAccountNumber, amount, note } = req.body;
    if (!amount || amount < 1) return res.status(400).json({ message: 'Invalid amount' });
    if (!recipientAccountNumber) return res.status(400).json({ message: 'Recipient account number required' });

    const sender = await getActiveCustomerAccount(senderAccountId, req.user._id);
    const recipient = await Account.findOne({ accountNumber: recipientAccountNumber, status: 'active' });

    if (!recipient) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Recipient account not found or not active' });
    }
    if (sender._id.toString() === recipient._id.toString()) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Cannot transfer to the same account' });
    }
    if (sender.balance < Number(amount)) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    sender.balance -= Number(amount);
    recipient.balance += Number(amount);
    await sender.save({ session });
    await recipient.save({ session });

    const [senderTxn, recipientTxn] = await Transaction.create([
      {
        account: sender._id,
        type: 'transfer_out',
        amount: Number(amount),
        balanceAfter: sender.balance,
        referenceAccount: recipient._id,
        note: note || `Transfer to ${recipient.accountNumber}`,
      },
      {
        account: recipient._id,
        type: 'transfer_in',
        amount: Number(amount),
        balanceAfter: recipient.balance,
        referenceAccount: sender._id,
        note: note || `Transfer from ${sender.accountNumber}`,
      },
    ], { session });

    await session.commitTransaction();

    // Notify both parties
    const senderUser = await User.findById(sender.customer);
    const recipientUser = await User.findById(recipient.customer);
    if (senderUser) sendTransactionEmail(senderUser, senderTxn, sender.accountNumber);
    if (recipientUser) sendTransactionEmail(recipientUser, recipientTxn, recipient.accountNumber);

    await audit(req.user._id, 'TRANSFER', 'Transaction', senderTxn._id,
      `BDT ${amount} from ${sender.accountNumber} to ${recipient.accountNumber}`, req);

    res.status(201).json({
      success: true,
      transaction: senderTxn,
      newBalance: sender.balance,
      recipient: { accountNumber: recipient.accountNumber },
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

// @GET /api/transactions/:accountId — get transaction history
exports.getTransactions = async (req, res, next) => {
  try {
    const account = await Account.findById(req.params.accountId);
    if (!account) return res.status(404).json({ message: 'Account not found' });

    if (req.user.role === 'customer' && account.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { type, from, to, page = 1, limit = 20 } = req.query;
    const filter = { account: account._id };
    if (type) filter.type = type;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('referenceAccount', 'accountNumber');

    res.json({ success: true, transactions, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// @GET /api/transactions/all — officer/admin
exports.getAllTransactions = async (req, res, next) => {
  try {
    const { from, to, type, page = 1, limit = 30 } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('account', 'accountNumber type')
      .populate('processedBy', 'name');

    res.json({ success: true, transactions, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};
