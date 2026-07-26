const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/auth');
const {
  openAccount, getMyAccounts, getAccount,
  getPendingAccounts, getAllAccounts,
  approveAccount, rejectAccount, freezeAccount, downloadStatement,
} = require('../controllers/accountController');

router.post('/', authorize('customer'), openAccount);
router.get('/my', authorize('customer'), getMyAccounts);
router.get('/pending', authorize('officer', 'admin'), getPendingAccounts);
router.get('/all', authorize('officer', 'admin'), getAllAccounts);
router.get('/:id', getAccount);
router.put('/:id/approve', authorize('officer', 'admin'), approveAccount);
router.put('/:id/reject', authorize('officer', 'admin'), rejectAccount);
router.put('/:id/freeze', authorize('admin'), freezeAccount);
router.get('/:id/statement', downloadStatement);

module.exports = router;
