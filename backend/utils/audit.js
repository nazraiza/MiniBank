const AuditLog = require('../models/AuditLog');

const log = async (userId, action, entityType = null, entityId = null, details = '', req = null) => {
  try {
    await AuditLog.create({
      user: userId,
      action,
      entityType,
      entityId,
      details,
      ipAddress: req ? (req.ip || req.connection?.remoteAddress) : null,
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

module.exports = log;
