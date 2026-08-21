const express = require('express');
const router = express.Router();
const { query, get, run } = require('../database/db');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const { resolveEffectiveNominal } = require('./pos');
const { logAudit } = require('../middleware/auditMiddleware');

// 12 Months of Academic Year (Tahun Ajaran Juli - Juni)
const AY_MONTHS = [
  { code: '2026-07', label: 'Juli 2026', due: '2026-07-10' },
  { code: '2026-08', label: 'Agustus 2026', due: '2026-08-10' },
  { code: '2026-09', label: 'September 2026', due: '2026-09-10' },
  { code: '2026-10', label: 'Oktober 2026', due: '2026-10-10' },
  { code: '2026-11', label: 'November 2026', due: '2026-11-10' },
  { code: '2026-12', label: 'Desember 2026', due: '2026-12-10' },
  { code: '2027-01', label: 'Januari 2027', due: '2027-01-10' },
  { code: '2027-02', label: 'Februari 2027', due: '2027-02-10' },
  { code: '2027-03', label: 'Maret 2027', due: '2027-03-10' },
  { code: '2027-04', label: 'April 2027', due: '2027-04-10' },
  { code: '2027-05', label: 'Mei 2027', due: '2027-05-10' },
  { code: '2027-06', label: 'Juni 2027', due: '2027-06-10' }
];

// Helper to ensure ALL payment posts (SPP 12 Months + Non-SPP) exist for a student
const ensureAllStudentInvoices = async (studentId) => {
  try {
    const student = await get(`SELECT id, nis, unit_id FROM students WHERE id = ?`, [studentId]);
    if (!student) return;

    const activeAY = await get(`SELECT id FROM academic_years WHERE is_active = 1`);
    if (!activeAY) return;

    // 1. Ensure 12 SPP monthly invoices
    const sppPost = await get(
      `SELECT id FROM payment_posts WHERE (unit_id = ? OR unit_id IS NULL) AND code LIKE '%SPP%' AND is_active = 1 LIMIT 1`,
      [student.unit_id]
    );

    if (sppPost) {
      const sppNominal = await resolveEffectiveNominal(sppPost.id, student.id);
      const discountRec = await get(
        `SELECT type, value FROM discounts WHERE student_id = ? AND post_id = ?`,
        [student.id, sppPost.id]
      );

      let discountAmount = 0;
      if (discountRec) {
        discountAmount = discountRec.type === 'percentage' ? (sppNominal * discountRec.value) / 100 : discountRec.value;
      }

      for (const m of AY_MONTHS) {
        const invNum = `INV/SPP/${student.nis}/${m.code.replace('-', '')}`;
        const existing = await get(`SELECT id FROM invoices WHERE student_id = ? AND post_id = ? AND month_period = ?`, [student.id, sppPost.id, m.code]);
        
        if (!existing) {
          await run(
            `INSERT INTO invoices (invoice_number, student_id, post_id, academic_year_id, month_period, due_date, nominal, discount_amount, paid_amount, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'Belum Dibayar')`,
            [invNum, student.id, sppPost.id, activeAY.id, m.code, m.due, sppNominal, discountAmount]
          );
        }
      }
    }

    // 2. Ensure ALL Non-SPP payment post invoices
    const nonSppPosts = await query(
      `SELECT * FROM payment_posts WHERE (unit_id = ? OR unit_id IS NULL) AND code NOT LIKE '%SPP%' AND is_active = 1`,
      [student.unit_id]
    );

    for (const p of nonSppPosts) {
      const existing = await get(`SELECT id FROM invoices WHERE student_id = ? AND post_id = ?`, [student.id, p.id]);
      if (!existing) {
        const nominal = await resolveEffectiveNominal(p.id, student.id);
        const discountRec = await get(
          `SELECT type, value FROM discounts WHERE student_id = ? AND post_id = ?`,
          [student.id, p.id]
        );

        let discountAmount = 0;
        if (discountRec) {
          discountAmount = discountRec.type === 'percentage' ? (nominal * discountRec.value) / 100 : discountRec.value;
        }

        const invNum = `INV/${p.code}/${student.nis}/2026`;
        await run(
          `INSERT INTO invoices (invoice_number, student_id, post_id, academic_year_id, month_period, due_date, nominal, discount_amount, paid_amount, status)
           VALUES (?, ?, ?, ?, ?, '2026-12-31', ?, ?, 0, 'Belum Dibayar')`,
          [invNum, student.id, p.id, activeAY.id, p.type, nominal, discountAmount]
        );
      }
    }
  } catch (err) {
    console.error('Error ensuring student invoices:', err);
  }
};

// Get all invoices with filter
router.get('/', verifyToken, async (req, res) => {
  try {
    const { student_id, class_id, unit_id, post_id, status, search, limit } = req.query;

    if (student_id) {
      await ensureAllStudentInvoices(student_id);
    }

    let sql = `
      SELECT i.*, 
             s.name as student_name, s.nis, s.gender,
             c.name as class_name, 
             u.name as unit_name,
             pp.name as post_name, pp.code as post_code, pp.type as post_type,
             ay.name as academic_year
      FROM invoices i
      JOIN students s ON i.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN units u ON s.unit_id = u.id
      JOIN payment_posts pp ON i.post_id = pp.id
      JOIN academic_years ay ON i.academic_year_id = ay.id
      WHERE 1=1
    `;
    let params = [];

    if (student_id) {
      sql += ` AND i.student_id = ?`;
      params.push(student_id);
    }
    if (class_id) {
      sql += ` AND s.class_id = ?`;
      params.push(class_id);
    }
    if (unit_id) {
      sql += ` AND s.unit_id = ?`;
      params.push(unit_id);
    }
    if (post_id) {
      sql += ` AND i.post_id = ?`;
      params.push(post_id);
    }
    if (status) {
      sql += ` AND i.status = ?`;
      params.push(status);
    }
    if (search) {
      sql += ` AND (i.invoice_number LIKE ? OR s.name LIKE ? OR s.nis LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY i.due_date ASC, i.id DESC`;
    if (limit) {
      sql += ` LIMIT ?`;
      params.push(parseInt(limit));
    }

    const invoices = await query(sql, params);
    res.json({ success: true, data: invoices });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Edit Custom Nominal & Diskon for a specific invoice
router.put('/:id', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nominal, discount_amount, apply_to_all_months, reason } = req.body;

    const inv = await get(`SELECT * FROM invoices WHERE id = ?`, [id]);
    if (!inv) return res.status(404).json({ success: false, error: 'Tagihan tidak ditemukan' });

    const newNominal = parseFloat(nominal) >= 0 ? parseFloat(nominal) : inv.nominal;
    const newDiscount = parseFloat(discount_amount) >= 0 ? parseFloat(discount_amount) : inv.discount_amount;
    const netNominal = Math.max(0, newNominal - newDiscount);

    let newStatus = inv.status;
    if (inv.paid_amount >= (netNominal - 0.01) && netNominal > 0) {
      newStatus = 'Lunas';
    } else if (inv.paid_amount > 0) {
      newStatus = 'Sebagian';
    } else {
      newStatus = 'Belum Dibayar';
    }

    if (apply_to_all_months) {
      // Apply custom nominal & discount to ALL unpaid invoices of this student for the same post (e.g., all 12 SPP months)
      await run(
        `UPDATE invoices 
         SET nominal = ?, discount_amount = ?, status = CASE WHEN paid_amount >= (? - 0.01) AND ? > 0 THEN 'Lunas' WHEN paid_amount > 0 THEN 'Sebagian' ELSE 'Belum Dibayar' END 
         WHERE student_id = ? AND post_id = ? AND status != 'Lunas'`,
        [newNominal, newDiscount, netNominal, netNominal, inv.student_id, inv.post_id]
      );
    } else {
      await run(
        `UPDATE invoices SET nominal = ?, discount_amount = ?, status = ? WHERE id = ?`,
        [newNominal, newDiscount, newStatus, id]
      );
    }

    await logAudit(
      req.user.id,
      req.user.name,
      req.user.role,
      'UPDATE_INVOICE_CUSTOM_NOMINAL',
      'TAGIHAN',
      `Custom nominal tagihan ${inv.invoice_number} menjadi Rp ${newNominal} (Diskon: Rp ${newDiscount}). Alasan: ${reason || 'Tarif Khusus Siswa'}`,
      req
    );

    res.json({ success: true, message: `Nominal tagihan berhasil diperbarui menjadi Rp ${newNominal.toLocaleString('id-ID')}.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Batch update custom SPP for a student across all months
router.post('/custom-spp', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    const { student_id, custom_nominal, discount_amount, reason } = req.body;

    if (!student_id || custom_nominal === undefined || parseFloat(custom_nominal) < 0) {
      return res.status(400).json({ success: false, error: 'Siswa dan Nominal Baru (>= 0) wajib diisi' });
    }

    const newNominal = parseFloat(custom_nominal);
    const newDiscount = parseFloat(discount_amount || 0);

    // Update all unpaid SPP invoices for this student
    await run(
      `UPDATE invoices 
       SET nominal = ?, discount_amount = ? 
       WHERE student_id = ? AND (post_id IN (SELECT id FROM payment_posts WHERE code LIKE '%SPP%') OR month_period LIKE '202%') AND status != 'Lunas'`,
      [newNominal, newDiscount, student_id]
    );

    await logAudit(
      req.user.id,
      req.user.name,
      req.user.role,
      'APPLY_CUSTOM_SPP_RATE',
      'TAGIHAN',
      `Terapkan tarif khusus SPP Rp ${newNominal} (Diskon: Rp ${newDiscount}) untuk Student ID ${student_id}. Alasan: ${reason || 'Beasiswa / Tarif Khusus'}`,
      req
    );

    res.json({
      success: true,
      message: `Berhasil mengubah tarif SPP siswa menjadi Rp ${newNominal.toLocaleString('id-ID')} per bulan.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Per-Month Custom SPP update for a student (allows different nominals for different months)
router.post('/custom-monthly-spp', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    const { student_id, monthly_updates, reason } = req.body;

    if (!student_id || !Array.isArray(monthly_updates)) {
      return res.status(400).json({ success: false, error: 'Student ID dan data rincian bulan wajib diisi' });
    }

    for (const item of monthly_updates) {
      const nom = parseFloat(item.nominal) >= 0 ? parseFloat(item.nominal) : 0;
      const disc = parseFloat(item.discount_amount) >= 0 ? parseFloat(item.discount_amount) : 0;

      await run(
        `UPDATE invoices 
         SET nominal = ?, discount_amount = ? 
         WHERE student_id = ? AND month_period = ? AND status != 'Lunas'`,
        [nom, disc, student_id, item.month_period]
      );
    }

    await logAudit(
      req.user.id,
      req.user.name,
      req.user.role,
      'APPLY_CUSTOM_MONTHLY_SPP_RATE',
      'TAGIHAN',
      `Custom tarif SPP per-bulan untuk Student ID ${student_id}. Alasan: ${reason || 'Custom Tarif Bulanan Siswa'}`,
      req
    );

    res.json({
      success: true,
      message: `Berhasil menyimpan custom tarif SPP per-bulan untuk siswa ini.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
