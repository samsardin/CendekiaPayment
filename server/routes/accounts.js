const express = require('express');
const router = express.Router();
const { query, get, run } = require('../database/db');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const { logAudit } = require('../middleware/auditMiddleware');

// GET /api/accounts - Get all accounts
router.get('/', verifyToken, async (req, res) => {
  try {
    const accounts = await query(`SELECT * FROM accounts ORDER BY code ASC`);
    res.json({ success: true, data: accounts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/accounts/balances - Cash & Bank Balances summary
router.get('/balances', verifyToken, async (req, res) => {
  try {
    const cashAccounts = await query(`SELECT * FROM accounts WHERE type IN ('Kas', 'Bank') ORDER BY code ASC`);
    const totalCash = cashAccounts.reduce((acc, curr) => acc + (parseFloat(curr.balance) || 0), 0);

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

// POST /api/accounts - Create Account
router.post('/', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    const { code, name, type, parent_id, balance } = req.body;
    if (!code || !name || !type) {
      return res.status(400).json({ success: false, error: 'Kode akun, nama akun, dan tipe akun wajib diisi' });
    }

    const existing = await get(`SELECT id FROM accounts WHERE code = ?`, [code]);
    if (existing) {
      return res.status(400).json({ success: false, error: `Kode akun "${code}" sudah digunakan. Silakan gunakan kode akun lain.` });
    }

    const result = await run(
      `INSERT INTO accounts (code, name, type, parent_id, balance) VALUES (?, ?, ?, ?, ?)`,
      [code.trim(), name.trim(), type, parent_id || null, parseFloat(balance) || 0.0]
    );

    await logAudit(
      req.user.id,
      req.user.name,
      req.user.role,
      'CREATE_ACCOUNT',
      'AKUN_KEUANGAN',
      `Menambahkan akun keuangan baru: ${code} - ${name} (${type}) dengan saldo awal Rp ${parseFloat(balance || 0).toLocaleString('id-ID')}`,
      req
    );

    res.json({ success: true, message: 'Akun keuangan berhasil ditambahkan!', id: result.id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/accounts/:id - Update Account
router.put('/:id', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, type, balance, parent_id } = req.body;

    const current = await get(`SELECT * FROM accounts WHERE id = ?`, [id]);
    if (!current) {
      return res.status(404).json({ success: false, error: 'Akun keuangan tidak ditemukan' });
    }

    if (code && code.trim() !== current.code) {
      const existing = await get(`SELECT id FROM accounts WHERE code = ? AND id != ?`, [code.trim(), id]);
      if (existing) {
        return res.status(400).json({ success: false, error: `Kode akun "${code}" sudah digunakan akun lain.` });
      }
    }

    const updatedCode = code ? code.trim() : current.code;
    const updatedName = name ? name.trim() : current.name;
    const updatedType = type || current.type;
    const updatedBalance = balance !== undefined && balance !== null && balance !== '' ? parseFloat(balance) : parseFloat(current.balance);

    await run(
      `UPDATE accounts 
       SET code = ?, name = ?, type = ?, parent_id = ?, balance = ? 
       WHERE id = ?`,
      [updatedCode, updatedName, updatedType, parent_id || null, updatedBalance, id]
    );

    await logAudit(
      req.user.id,
      req.user.name,
      req.user.role,
      'UPDATE_ACCOUNT',
      'AKUN_KEUANGAN',
      `Memperbarui akun keuangan: ${updatedCode} - ${updatedName} (Saldo: Rp ${updatedBalance.toLocaleString('id-ID')})`,
      req
    );

    res.json({ success: true, message: 'Data akun keuangan berhasil diperbarui!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/accounts/:id - Delete Account
router.delete('/:id', verifyToken, authorizeRoles('superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const current = await get(`SELECT * FROM accounts WHERE id = ?`, [id]);
    if (!current) {
      return res.status(404).json({ success: false, error: 'Akun keuangan tidak ditemukan' });
    }

    // Check if account is used in payment_posts
    const usedInPosts = await get(`SELECT id, name FROM payment_posts WHERE account_id = ? LIMIT 1`, [id]);
    if (usedInPosts) {
      return res.status(400).json({
        success: false,
        error: `Akun "${current.name}" tidak dapat dihapus karena masih terhubung dengan pos pembayaran "${usedInPosts.name}". Ubah relasi pos terlebih dahulu.`
      });
    }

    // Check if account is used in expenses
    const usedInExpenses = await get(`SELECT id FROM expenses WHERE account_id = ? LIMIT 1`, [id]);
    if (usedInExpenses) {
      return res.status(400).json({
        success: false,
        error: `Akun "${current.name}" tidak dapat dihapus karena sudah memiliki riwayat pengeluaran kas.`
      });
    }

    await run(`DELETE FROM accounts WHERE id = ?`, [id]);

    await logAudit(
      req.user.id,
      req.user.name,
      req.user.role,
      'DELETE_ACCOUNT',
      'AKUN_KEUANGAN',
      `Menghapus akun keuangan: ${current.code} - ${current.name}`,
      req
    );

    res.json({ success: true, message: 'Akun keuangan berhasil dihapus!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
