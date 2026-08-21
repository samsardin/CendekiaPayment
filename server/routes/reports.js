const express = require('express');
const router = express.Router();
const { query, get } = require('../database/db');
const { verifyToken } = require('../middleware/authMiddleware');
const { parentOwnsStudent } = require('../utils/parentAccess');

// Rekap Keuangan & Ringkasan Laporan
router.get('/summary', verifyToken, async (req, res) => {
  try {
    const { date_from, date_to, unit_id } = req.query;

    let paySql = `SELECT SUM(p.amount) as total_income FROM payments p JOIN invoices i ON p.invoice_id = i.id JOIN students s ON p.student_id = s.id WHERE p.status = 'Paid'`;
    let expSql = `SELECT SUM(amount) as total_expense FROM expenses WHERE status = 'Approved'`;
    let params = [];

    if (unit_id) {
      paySql += ` AND s.unit_id = ?`;
      params.push(unit_id);
    }

    const incomeRes = await get(paySql, params);
    const expenseRes = await get(expSql);

    const totalIncome = incomeRes ? (incomeRes.total_income || 0) : 0;
    const totalExpense = expenseRes ? (expenseRes.total_expense || 0) : 0;
    const netCashFlow = totalIncome - totalExpense;

    // Total Piutang (Unpaid / Partial Invoices)
    const piutangRes = await get(
      `SELECT SUM(i.nominal - i.discount_amount - i.paid_amount) as total_piutang 
       FROM invoices i 
       JOIN students s ON i.student_id = s.id 
       WHERE i.status IN ('Belum Dibayar', 'Sebagian') ${unit_id ? 'AND s.unit_id = ?' : ''}`,
      unit_id ? [unit_id] : []
    );

    res.json({
      success: true,
      totalIncome,
      totalExpense,
      netCashFlow,
      totalPiutang: piutangRes ? (piutangRes.total_piutang || 0) : 0
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Kartu Piutang Siswa (Fitur 23.B)
router.get('/student-ledger/:student_id', verifyToken, async (req, res) => {
  try {
    const { student_id } = req.params;

    if (!(await parentOwnsStudent(req.user, student_id))) {
      return res.status(403).json({ success: false, error: 'Anda tidak memiliki akses ke data siswa ini' });
    }

    const student = await get(
      `SELECT s.*, u.name as unit_name, c.name as class_name, p.father_name, p.phone as parent_phone
       FROM students s
       JOIN units u ON s.unit_id = u.id
       JOIN classes c ON s.class_id = c.id
       LEFT JOIN parents p ON s.parent_id = p.id
       WHERE s.id = ?`,
      [student_id]
    );

    if (!student) return res.status(404).json({ success: false, error: 'Siswa tidak ditemukan' });

    const invoices = await query(
      `SELECT i.*, pp.name as post_name, pp.type as post_type
       FROM invoices i
       JOIN payment_posts pp ON i.post_id = pp.id
       WHERE i.student_id = ?
       ORDER BY i.created_at ASC`,
      [student_id]
    );

    let totalNominal = 0;
    let totalPaid = 0;
    let totalDiscount = 0;

    const ledgerItems = [];

    for (const inv of invoices) {
      totalNominal += inv.nominal;
      totalPaid += inv.paid_amount;
      totalDiscount += inv.discount_amount;

      const remaining = inv.nominal - inv.discount_amount - inv.paid_amount;

      const payments = await query(
        `SELECT * FROM payments WHERE invoice_id = ? AND status = 'Paid' ORDER BY id ASC`,
        [inv.id]
      );

      ledgerItems.push({
        invoice_number: inv.invoice_number,
        post_name: inv.post_name,
        month_period: inv.month_period,
        due_date: inv.due_date,
        nominal: inv.nominal,
        discount: inv.discount_amount,
        paid: inv.paid_amount,
        remaining,
        status: inv.status,
        payments
      });
    }

    res.json({
      success: true,
      student,
      summary: {
        totalNominal,
        totalDiscount,
        totalPaid,
        totalPiutang: totalNominal - totalDiscount - totalPaid
      },
      ledgerItems
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Laporan per Pos Pembayaran
router.get('/by-post', verifyToken, async (req, res) => {
  try {
    const rows = await query(`
      SELECT pp.id, pp.code, pp.name as post_name, pp.type as post_type, u.name as unit_name,
             COUNT(i.id) as total_invoices,
             SUM(i.nominal) as total_nominal,
             SUM(i.discount_amount) as total_discount,
             SUM(i.paid_amount) as total_paid,
             SUM(i.nominal - i.discount_amount - i.paid_amount) as total_piutang
      FROM payment_posts pp
      LEFT JOIN units u ON pp.unit_id = u.id
      LEFT JOIN invoices i ON i.post_id = pp.id
      GROUP BY pp.id
      ORDER BY pp.sort_order ASC
    `);

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Laporan per Kelas
router.get('/by-class', verifyToken, async (req, res) => {
  try {
    const rows = await query(`
      SELECT c.id, c.name as class_name, u.name as unit_name,
             COUNT(DISTINCT s.id) as student_count,
             SUM(i.paid_amount) as total_paid,
             SUM(i.nominal - i.discount_amount - i.paid_amount) as total_piutang
      FROM classes c
      JOIN units u ON c.unit_id = u.id
      LEFT JOIN students s ON s.class_id = c.id
      LEFT JOIN invoices i ON i.student_id = s.id
      GROUP BY c.id
      ORDER BY c.unit_id ASC, c.name ASC
    `);

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
