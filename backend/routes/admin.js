const express = require('express');
const router = express.Router();
const {
  getDashboardStats, getAllUsers, createOfficer, updateUserStatus, updateUser,
  getBranches, createBranch, updateBranch,
  getConfig, setConfig, getAuditLogs, getReports,
} = require('../controllers/adminController');

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.post('/users/officer', createOfficer);
router.put('/users/:id', updateUser);
router.put('/users/:id/status', updateUserStatus);
router.get('/branches', getBranches);
router.post('/branches', createBranch);
router.put('/branches/:id', updateBranch);
router.get('/config', getConfig);
router.post('/config', setConfig);
router.get('/audit-logs', getAuditLogs);
router.get('/reports', getReports);

module.exports = router;
