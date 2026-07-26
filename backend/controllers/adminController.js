const User = require('../models/User');
const Branch = require('../models/Branch');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const Loan = require('../models/Loan');
const AuditLog = require('../models/AuditLog');
const SystemConfig = require('../models/SystemConfig');
const audit = require('../utils/audit');

// ─── DASHBOARD ──────────────────────────────────────────────────────
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [totalCustomers, totalAccounts, pendingAccounts, pendingLoans,
      totalTransactionsToday, activeLoans] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      Account.countDocuments({ status: 'active' }),
      Account.countDocuments({ status: 'pending' }),
      Loan.countDocuments({ status: 'pending' }),
      Transaction.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      Loan.countDocuments({ status: 'approved' }),
    ]);

    // Last 7 days transaction volumes
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const start = new Date(date.setHours(0, 0, 0, 0));
      const end = new Date(date.setHours(23, 59, 59, 999));
      const count = await Transaction.countDocuments({ createdAt: { $gte: start, $lte: end } });
      last7Days.push({ date: start.toISOString().split('T')[0], count });
    }

    res.json({
      success: true,
      stats: { totalCustomers, totalAccounts, pendingAccounts, pendingLoans, totalTransactionsToday, activeLoans },
      chart: last7Days,
    });
  } catch (err) { next(err); }
};

// ─── USER MANAGEMENT ────────────────────────────────────────────────
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, status, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .populate('branch', 'name city')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, users, total, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

exports.createOfficer = async (req, res, next) => {
  try {
    const { name, email, password, phone, branchId, employeeId } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email, password required' });

    const user = await User.create({
      name, email, password, phone, role: 'officer',
      branch: branchId, employeeId, status: 'active',
    });

    await audit(req.user._id, 'CREATE_OFFICER', 'User', user._id, `Officer: ${name}`, req);
    res.status(201).json({ success: true, user });
  } catch (err) { next(err); }
};

exports.updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    await audit(req.user._id, `SET_USER_${status.toUpperCase()}`, 'User', user._id, '', req);
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { name, phone, address, branchId, employeeId } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, phone, address, branch: branchId, employeeId },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

// ─── BRANCH MANAGEMENT ──────────────────────────────────────────────
exports.getBranches = async (req, res, next) => {
  try {
    const branches = await Branch.find().sort('name');
    res.json({ success: true, branches });
  } catch (err) { next(err); }
};

exports.createBranch = async (req, res, next) => {
  try {
    const { name, address, city, phone, managerName, branchCode } = req.body;
    const branch = await Branch.create({ name, address, city, phone, managerName, branchCode });
    await audit(req.user._id, 'CREATE_BRANCH', 'Branch', branch._id, `Branch: ${name}`, req);
    res.status(201).json({ success: true, branch });
  } catch (err) { next(err); }
};

exports.updateBranch = async (req, res, next) => {
  try {
    const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!branch) return res.status(404).json({ message: 'Branch not found' });
    await audit(req.user._id, 'UPDATE_BRANCH', 'Branch', branch._id, '', req);
    res.json({ success: true, branch });
  } catch (err) { next(err); }
};

// ─── SYSTEM CONFIG ───────────────────────────────────────────────────
exports.getConfig = async (req, res, next) => {
  try {
    const configs = await SystemConfig.find();
    res.json({ success: true, configs });
  } catch (err) { next(err); }
};

exports.setConfig = async (req, res, next) => {
  try {
    const { key, value, description } = req.body;
    const config = await SystemConfig.findOneAndUpdate(
      { key },
      { value, description, updatedBy: req.user._id },
      { upsert: true, new: true }
    );
    await audit(req.user._id, 'UPDATE_CONFIG', 'SystemConfig', config._id, `${key}=${value}`, req);
    res.json({ success: true, config });
  } catch (err) { next(err); }
};

// ─── AUDIT LOGS ──────────────────────────────────────────────────────
exports.getAuditLogs = async (req, res, next) => {
  try {
    const { from, to, action, page = 1, limit = 30 } = req.query;
    const filter = {};
    if (action) filter.action = { $regex: action, $options: 'i' };
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .populate('user', 'name email role')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, logs, total, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// ─── REPORTS ─────────────────────────────────────────────────────────
exports.getReports = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);
    const createdAt = Object.keys(dateFilter).length ? dateFilter : undefined;

    const [totalDeposits, totalWithdrawals, totalTransfers, newAccounts, newLoans, loanDisbursed] =
      await Promise.all([
        Transaction.aggregate([
          { $match: { type: 'deposit', ...(createdAt ? { createdAt } : {}) } },
          { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ]),
        Transaction.aggregate([
          { $match: { type: 'withdrawal', ...(createdAt ? { createdAt } : {}) } },
          { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ]),
        Transaction.aggregate([
          { $match: { type: 'transfer_out', ...(createdAt ? { createdAt } : {}) } },
          { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ]),
        Account.countDocuments(createdAt ? { createdAt } : {}),
        Loan.countDocuments(createdAt ? { createdAt } : {}),
        Loan.aggregate([
          { $match: { status: 'approved', ...(createdAt ? { decisionAt: createdAt } : {}) } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
      ]);

    res.json({
      success: true,
      report: {
        deposits: { total: totalDeposits[0]?.total || 0, count: totalDeposits[0]?.count || 0 },
        withdrawals: { total: totalWithdrawals[0]?.total || 0, count: totalWithdrawals[0]?.count || 0 },
        transfers: { total: totalTransfers[0]?.total || 0, count: totalTransfers[0]?.count || 0 },
        newAccounts,
        newLoans,
        loanDisbursed: loanDisbursed[0]?.total || 0,
      },
    });
  } catch (err) { next(err); }
};
