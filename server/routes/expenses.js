const express = require('express');
const router = express.Router();
const { query, get, run } = require('../database/db');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const { logAudit } = require('../middleware/auditMiddleware');

// Get all expenses
router.get('/', verifyToken, async (req, res) => {
  try {
    const { category, status, date_from, date_to } = req.query;

    let sql = `
      SELECT e.*, e.expense_number as voucher_number, e.title as description,
             e.notes as attachment_url, a.name as account_name, a.code as account_code,
             u2.name as approver_name
      FROM expenses e
      JOIN accounts a ON e.account_id = a.id
      LEFT JOIN users u2 ON e.approved_by = u2.id
      WHERE 1=1
    `;
    let params = [];

    if (category) {
      sql += ` AND e.category = ?`;
      params.push(category);
    }
    if (status) {
      sql += ` AND e.status = ?`;
      params.push(status);
    }
    if (date_from) {
      sql += ` AND e.date >= ?`;
      params.push(date_from);
    }
    if (date_to) {
      sql += ` AND e.date <= ?`;
      params.push(date_to);
    }

    sql += ` ORDER BY e.date DESC, e.id DESC`;
    const expenses = await query(sql, params);

    res.json({ success: true, data: expenses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new expense
router.post('/', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    const { date, category, account_id, amount, description, attachment_url } = req.body;

    if (!date || !category || !account_id || !amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Tanggal, Kategori, Akun, dan Nominal > 0 wajib diisi' });
    }

    // Check account balance for BR-010 (Pengeluaran tidak boleh disimpan jika saldo kas tidak mencukupi)
    const mainCashAccount = await get(`SELECT balance FROM accounts WHERE code = '101.01'`);
    if (mainCashAccount && mainCashAccount.balance < amount) {
      return res.status(400).json({
        success: false,
        error: `BR-010: Saldo Kas Utama (Rp ${mainCashAccount.balance.toLocaleString('id-ID')}) tidak mencukupi untuk pengeluaran sebesar Rp ${amount.toLocaleString('id-ID')}`
      });
    }

    const voucherNum = `VCH/${date.replace(/-/g, '')}/${Math.floor(1000 + Math.random() * 9000)}`;

    // Auto-approve if created by Superadmin or Admin, else Pending approval
    const isAutoApproved = ['superadmin', 'admin'].includes(req.user.role);
    const status = isAutoApproved ? 'Approved' : 'Pending';

    const result = await run(
      `INSERT INTO expenses (expense_number, account_id, category, title, amount, recipient, date, status, notes, approved_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [voucherNum, account_id, category, description || category, amount, null, date, status, attachment_url || '', isAutoApproved ? req.user.id : null]
    );

    // Deduct cash balance if approved
    if (status === 'Approved') {
      await run(`UPDATE accounts SET balance = balance - ? WHERE code = '101.01'`, [amount]);
      await run(`UPDATE accounts SET balance = balance + ? WHERE id = ?`, [amount, account_id]);
    }

    await logAudit(
      req.user.id,
      req.user.name,
      req.user.role,
      'CREATE_EXPENSE',
      'PENGELUARAN',
      `Mencatat Pengeluaran (${voucherNum}) Rp ${amount} - Kategori: ${category} (Status: ${status})`,
      req
    );

    res.json({
      success: true,
      id: result.id,
      voucher_number: voucherNum,
      status,
      message: `Pengeluaran berhasil dicatat (${status}).`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Approve/Reject Expense Voucher
router.put('/:id/approve', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    const expense = await get(`SELECT * FROM expenses WHERE id = ?`, [id]);
    if (!expense) return res.status(404).json({ success: false, error: 'Pengeluaran tidak ditemukan' });

    if (expense.status !== 'Pending') {
      return res.status(400).json({ success: false, error: `Pengeluaran sudah berstatus ${expense.status}` });
    }

    if (action === 'approve') {
      // Check cash balance BR-010
      const mainCash = await get(`SELECT balance FROM accounts WHERE code = '101.01'`);
      if (mainCash && mainCash.balance < expense.amount) {
        return res.status(400).json({ success: false, error: 'Saldo Kas Utama tidak mencukupi untuk menyetujui pengeluaran ini.' });
      }

      await run(`UPDATE expenses SET status = 'Approved', approved_by = ? WHERE id = ?`, [req.user.id, id]);
      await run(`UPDATE accounts SET balance = balance - ? WHERE code = '101.01'`, [expense.amount]);
      await run(`UPDATE accounts SET balance = balance + ? WHERE id = ?`, [expense.amount, expense.account_id]);

      await logAudit(req.user.id, req.user.name, req.user.role, 'APPROVE_EXPENSE', 'PENGELUARAN', `Persetujuan voucher ${expense.expense_number} Rp ${expense.amount}`, req);

      res.json({ success: true, message: 'Pengeluaran disetujui.' });
    } else {
      await run(`UPDATE expenses SET status = 'Rejected', approved_by = ? WHERE id = ?`, [req.user.id, id]);
      await logAudit(req.user.id, req.user.name, req.user.role, 'REJECT_EXPENSE', 'PENGELUARAN', `Penolakan voucher ${expense.expense_number}`, req);

      res.json({ success: true, message: 'Pengeluaran ditolak.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
