const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/auth');
const {
  applyLoan, getMyLoans, getLoan,
  getAllLoans, approveLoan, rejectLoan, payInstallment,
} = require('../controllers/loanController');

router.post('/', authorize('customer'), applyLoan);
router.get('/my', authorize('customer'), getMyLoans);
router.get('/all', authorize('officer', 'admin'), getAllLoans);
router.get('/:id', getLoan);
router.put('/:id/approve', authorize('officer', 'admin'), approveLoan);
router.put('/:id/reject', authorize('officer', 'admin'), rejectLoan);
router.put('/:id/repay/:installmentId', payInstallment);

module.exports = router;
