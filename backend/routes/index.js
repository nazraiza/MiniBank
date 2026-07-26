const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Auth
const auth = require('./auth');
router.use('/auth', auth);

// Accounts
const accounts = require('./accounts');
router.use('/accounts', protect, accounts);

// Transactions
const transactions = require('./transactions');
router.use('/transactions', protect, transactions);

// Loans
const loans = require('./loans');
router.use('/loans', protect, loans);

// Admin
const admin = require('./admin');
router.use('/admin', protect, authorize('admin'), admin);

module.exports = router;
