const express = require('express');
const router = express.Router();
const { query, get, run } = require('../database/db');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// Get all accounts
router.get('/', verifyToken, async (req, res) => {
  try {
    const accounts = await query(`SELECT * FROM accounts ORDER BY code ASC`);
    res.json({ success: true, data: accounts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Cash & Bank Balances summary
router.get('/balances', verifyToken, async (req, res) => {
  try {
    const cashAccounts = await query(`SELECT * FROM accounts WHERE type IN ('Kas', 'Bank') ORDER BY code ASC`);
    const totalCash = cashAccounts.reduce((acc, curr) => acc + curr.balance, 0);

    const consolidatedAccounts = await query(`SELECT * FROM accounts WHERE type = 'Gabungan' ORDER BY code ASC`);

    res.json({
      success: true,
      totalCash,
      cashAccounts,
      consolidatedAccounts
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create Account
router.post('/', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    const { code, name, type, parent_id, balance } = req.body;
    const existing = await get(`SELECT id FROM accounts WHERE code = ?`, [code]);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Kode akun sudah digunakan' });
    }

    const result = await run(
      `INSERT INTO accounts (code, name, type, parent_id, balance) VALUES (?, ?, ?, ?, ?)`,
      [code, name, type, parent_id || null, balance || 0.0]
    );

    res.json({ success: true, id: result.id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
