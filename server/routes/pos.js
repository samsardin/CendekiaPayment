const express = require('express');
const router = express.Router();
const { query, get, run } = require('../database/db');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const { logAudit } = require('../middleware/auditMiddleware');

// Get all payment posts
router.get('/', verifyToken, async (req, res) => {
  try {
    const { unit_id } = req.query;
    let sql = `
      SELECT pp.*, u.name as unit_name, u.code as unit_code, a.name as account_name, a.code as account_code
      FROM payment_posts pp
      LEFT JOIN units u ON pp.unit_id = u.id
      LEFT JOIN accounts a ON pp.account_id = a.id
      WHERE 1=1
    `;
    let params = [];
    if (unit_id) {
      sql += ` AND (pp.unit_id = ? OR pp.unit_id IS NULL)`;
      params.push(unit_id);
    }
    sql += ` ORDER BY pp.sort_order ASC, pp.id ASC`;

    const data = await query(sql, params);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create payment post
router.post('/', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    const { unit_id, code, name, type, default_amount, sort_order, account_id } = req.body;

    if (!code || !name || !type) {
      return res.status(400).json({ success: false, error: 'Kode pos, nama pos, dan tipe pembayaran wajib diisi' });
    }

    const existing = await get(`SELECT id FROM payment_posts WHERE code = ?`, [code.trim()]);
    if (existing) {
      return res.status(400).json({ success: false, error: `Kode pos "${code}" sudah digunakan. Silakan gunakan kode lain.` });
    }

    const result = await run(
      `INSERT INTO payment_posts (unit_id, code, name, type, default_amount, is_active, sort_order, account_id)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
      [unit_id ? parseInt(unit_id) : null, code.trim(), name.trim(), type, parseFloat(default_amount) || 0, sort_order || 1, account_id ? parseInt(account_id) : null]
    );

    await logAudit(
      req.user.id,
      req.user.name,
      req.user.role,
      'CREATE_POS',
      'POS',
      `Menambah Pos Pembayaran: ${code.trim()} - ${name.trim()} (Nominal: Rp ${parseFloat(default_amount || 0).toLocaleString('id-ID')})`,
      req
    );

    res.json({ success: true, message: 'Pos Pembayaran berhasil ditambahkan!', id: result.id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update payment post
router.put('/:id', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { unit_id, code, name, type, default_amount, is_active, sort_order, account_id } = req.body;

    const current = await get(`SELECT * FROM payment_posts WHERE id = ?`, [id]);
    if (!current) {
      return res.status(404).json({ success: false, error: 'Pos pembayaran tidak ditemukan' });
    }

    if (code && code.trim() !== current.code) {
      const existing = await get(`SELECT id FROM payment_posts WHERE code = ? AND id != ?`, [code.trim(), id]);
      if (existing) {
        return res.status(400).json({ success: false, error: `Kode pos "${code}" sudah digunakan pos pembayaran lain.` });
      }
    }

    const updatedCode = code ? code.trim() : current.code;
    const updatedName = name ? name.trim() : current.name;
    const updatedType = type || current.type;
    const updatedUnitId = unit_id !== undefined ? (unit_id ? parseInt(unit_id) : null) : current.unit_id;
    const updatedAmount = default_amount !== undefined ? parseFloat(default_amount) : parseFloat(current.default_amount);
    const updatedAccountId = account_id !== undefined ? (account_id ? parseInt(account_id) : null) : current.account_id;
    const updatedActive = is_active !== undefined ? (is_active ? 1 : 0) : current.is_active;
    const updatedSort = sort_order !== undefined ? parseInt(sort_order) : current.sort_order;

    await run(
      `UPDATE payment_posts 
       SET code = ?, name = ?, type = ?, unit_id = ?, default_amount = ?, is_active = ?, sort_order = ?, account_id = ? 
       WHERE id = ?`,
      [updatedCode, updatedName, updatedType, updatedUnitId, updatedAmount, updatedActive, updatedSort, updatedAccountId, id]
    );

    await logAudit(
      req.user.id,
      req.user.name,
      req.user.role,
      'UPDATE_POS',
      'POS',
      `Memperbarui Pos Pembayaran: ${updatedCode} - ${updatedName} (Nominal: Rp ${updatedAmount.toLocaleString('id-ID')})`,
      req
    );

    res.json({ success: true, message: 'Pos Pembayaran berhasil diperbarui!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete payment post
router.delete('/:id', verifyToken, authorizeRoles('superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const current = await get(`SELECT * FROM payment_posts WHERE id = ?`, [id]);
    if (!current) {
      return res.status(404).json({ success: false, error: 'Pos pembayaran tidak ditemukan' });
    }

    // Check if invoices are linked to this post
    const invoiceCheck = await get(`SELECT COUNT(*) as count FROM invoices WHERE post_id = ?`, [id]);
    if (invoiceCheck && Number(invoiceCheck.count) > 0) {
      return res.status(400).json({
        success: false,
        error: `Pos pembayaran "${current.name}" tidak dapat dihapus karena sudah memiliki ${invoiceCheck.count} data tagihan/transaksi siswa. Anda dapat mengubah statusnya menjadi non-aktif.`
      });
    }

    // Delete associated nominal rules
    await run(`DELETE FROM nominal_rules WHERE post_id = ?`, [id]);
    await run(`DELETE FROM payment_posts WHERE id = ?`, [id]);

    await logAudit(
      req.user.id,
      req.user.name,
      req.user.role,
      'DELETE_POS',
      'POS',
      `Menghapus Pos Pembayaran: ${current.code} - ${current.name}`,
      req
    );

    res.json({ success: true, message: 'Pos Pembayaran berhasil dihapus!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Nominal Rules for a Pos
router.get('/:id/rules', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const rules = await query(`SELECT * FROM nominal_rules WHERE post_id = ?`, [id]);
    res.json({ success: true, data: rules });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create/Update Flex Nominal Rule (Level 1: Default, Level 2: Kelas/Jenjang, Level 3: Siswa)
router.post('/:id/rules', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { target_type, target_id, amount } = req.body; // target_type: 'default', 'unit', 'class', 'student'

    // Delete existing rule for same target if present
    await run(`DELETE FROM nominal_rules WHERE post_id = ? AND target_type = ? AND (target_id = ? OR target_id IS NULL)`, [id, target_type, target_id || null]);

    const result = await run(
      `INSERT INTO nominal_rules (post_id, target_type, target_id, amount) VALUES (?, ?, ?, ?)`,
      [id, target_type, target_id || null, parseFloat(amount) || 0]
    );

    await logAudit(req.user.id, req.user.name, req.user.role, 'SET_NOMINAL_RULE', 'POS', `Mengatur nominal khusus (${target_type}) untuk Pos ID ${id}: Rp ${parseFloat(amount || 0).toLocaleString('id-ID')}`, req);
    res.json({ success: true, id: result.id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper Function: Resolve Effective Nominal based on Priority: Siswa > Kelas > Jenjang > Default
const resolveEffectiveNominal = async (postId, studentId) => {
  const post = await get(`SELECT * FROM payment_posts WHERE id = ?`, [postId]);
  if (!post) return 0;

  const student = await get(`SELECT * FROM students WHERE id = ?`, [studentId]);
  if (!student) return post.default_amount;

  // Level 3: Student-specific rule
  const studentRule = await get(`SELECT amount FROM nominal_rules WHERE post_id = ? AND target_type = 'student' AND target_id = ?`, [postId, studentId]);
  if (studentRule) return studentRule.amount;

  // Level 2: Class-specific rule
  const classRule = await get(`SELECT amount FROM nominal_rules WHERE post_id = ? AND target_type = 'class' AND target_id = ?`, [postId, student.class_id]);
  if (classRule) return classRule.amount;

  // Level 2b: Unit-specific rule
  const unitRule = await get(`SELECT amount FROM nominal_rules WHERE post_id = ? AND target_type = 'unit' AND target_id = ?`, [postId, student.unit_id]);
  if (unitRule) return unitRule.amount;

  // Level 1: Default Post Amount
  return post.default_amount;
};

module.exports = {
  router,
  resolveEffectiveNominal
};
