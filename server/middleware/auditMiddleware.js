const { run } = require('../database/db');

const logAudit = async (userId, userName, userRole, action, moduleName, details, req = null) => {
  try {
    const ipAddress = req?.headers ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1') : '127.0.0.1';
    await run(
      `INSERT INTO audit_logs (user_id, user_name, user_role, action, module, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId || null, userName || 'System', userRole || 'system', action, moduleName, typeof details === 'object' ? JSON.stringify(details) : details, ipAddress]
    );
  } catch (err) {
    console.error('Audit log error:', err);
  }
};

module.exports = { logAudit };
