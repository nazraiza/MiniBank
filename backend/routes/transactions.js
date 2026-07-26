const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/auth');
const {
  deposit, withdraw, transfer,
  getTransactions, getAllTransactions,
} = require('../controllers/transactionController');

router.post('/deposit', deposit);
router.post('/withdraw', withdraw);
router.post('/transfer', authorize('customer'), transfer);
router.get('/all', authorize('officer', 'admin'), getAllTransactions);
router.get('/:accountId', getTransactions);

module.exports = router;
