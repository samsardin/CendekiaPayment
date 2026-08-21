const express = require('express');
const router = express.Router();
const { query } = require('../database/db');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    const logs = await query(`SELECT * FROM audit_logs ORDER BY id DESC LIMIT 150`);
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
