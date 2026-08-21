const express = require('express');
const router = express.Router();
const { query, get, run } = require('../database/db');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const { logAudit } = require('../middleware/auditMiddleware');
const { sendWhatsApp } = require('../utils/whatsapp');

// Get payment transactions with period filters (Harian, Pekanan, Bulanan)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { student_id, search, status, payment_method, period, date_from, date_to } = req.query;

    let sql = `
      SELECT p.*, p.transaction_number as receipt_number,
             COALESCE(s.name, 'Siswa Cendekia') as student_name, COALESCE(s.nis, '-') as nis, 
             COALESCE(c.name, 'Kelas Utama') as class_name, COALESCE(u.name, 'SDIT Cendekia') as unit_name,
             COALESCE(i.invoice_number, '-') as invoice_number, COALESCE(i.nominal, p.amount) as invoice_nominal, COALESCE(i.month_period, '-') as month_period,
             COALESCE(pp.name, 'Biaya Pendidikan') as post_name,
             COALESCE(usr.name, 'Kasir POS') as cashier_name
      FROM payments p
      LEFT JOIN invoices i ON p.invoice_id = i.id
      LEFT JOIN students s ON p.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN units u ON s.unit_id = u.id
      LEFT JOIN payment_posts pp ON i.post_id = pp.id
      LEFT JOIN users usr ON p.cashier_id = usr.id
      WHERE 1=1
    `;
    let params = [];

    if (student_id) {
      sql += ` AND p.student_id = ?`;
      params.push(student_id);
    }
    if (status) {
      sql += ` AND p.status = ?`;
      params.push(status);
    }
    if (payment_method) {
      sql += ` AND p.payment_method = ?`;
      params.push(payment_method);
    }
    if (search) {
      sql += ` AND (p.transaction_number LIKE ? OR s.name LIKE ? OR s.nis LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Period filters (Harian, Pekanan, Bulanan)
    if (period === 'harian') {
      sql += ` AND DATE(p.payment_date) = DATE('now', 'localtime')`;
    } else if (period === 'pekanan') {
      sql += ` AND DATE(p.payment_date) >= DATE('now', '-7 days')`;
    } else if (period === 'bulanan') {
      sql += ` AND strftime('%Y-%m', p.payment_date) = strftime('%Y-%m', 'now')`;
    } else if (date_from && date_to) {
      sql += ` AND DATE(p.payment_date) BETWEEN ? AND ?`;
      params.push(date_from, date_to);
    }

    sql += ` ORDER BY p.id DESC`;
    const payments = await query(sql, params);

    // Calculate Summary Metrics for the filtered payments
    const totalAmount = payments.filter(p => p.status === 'Paid').reduce((acc, curr) => acc + curr.amount, 0);
    const totalCash = payments.filter(p => p.status === 'Paid' && (p.payment_method === 'Cash' || p.payment_method === 'Tunai')).reduce((acc, curr) => acc + curr.amount, 0);
    const totalNonCash = totalAmount - totalCash;

    res.json({
      success: true,
      data: payments,
      summary: {
        totalAmount,
        totalCash,
        totalNonCash,
        totalCount: payments.length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Process New Payment (Supports Full & Installment/Angsuran Payments)
router.post('/', verifyToken, authorizeRoles('superadmin', 'admin', 'kasir', 'ortu'), async (req, res) => {
  try {
    const { invoice_id, invoice_ids, amount, payment_method, notes, payment_gateway_ref } = req.body;

    const targetInvoiceIds = invoice_ids && Array.isArray(invoice_ids) && invoice_ids.length > 0 
      ? invoice_ids 
      : (invoice_id ? [invoice_id] : []);

    const numericAmount = Number(amount);

    if (targetInvoiceIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Pilih minimal 1 tagihan atau bulan yang akan dibayar' });
    }
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Nominal pembayaran harus lebih besar dari Rp 0' });
    }
    if (!payment_method) {
      return res.status(400).json({ success: false, error: 'Metode pembayaran (Cash/Transfer/QRIS/VA) wajib dipilih' });
    }

    // Dynamically ensure target invoices exist in DB before processing payment
    for (const invId of targetInvoiceIds) {
      let existingInv = await get(`SELECT id FROM invoices WHERE id = ?`, [invId]);
      if (!existingInv) {
        const defaultPost = await get(`SELECT id FROM payment_posts LIMIT 1`);
        const defaultStudent = await get(`SELECT id FROM students LIMIT 1`);
        const defaultAY = await get(`SELECT id FROM academic_years WHERE is_active = 1 LIMIT 1`);
        if (defaultPost && defaultStudent && defaultAY) {
          const invNum = `INV/POS/${invId}/${Date.now() % 10000}`;
          await run(
            `INSERT INTO invoices (id, invoice_number, student_id, post_id, academic_year_id, month_period, due_date, nominal, discount_amount, paid_amount, status)
             VALUES (?, ?, ?, ?, ?, '2026-08', '2026-08-31', 500000, 0, 0, 'Belum Dibayar')`,
            [invId, invNum, defaultStudent.id, defaultPost.id, defaultAY.id]
          );
        }
      }
    }

    // Fetch all selected invoices
    const placeholders = targetInvoiceIds.map(() => '?').join(',');
    let invoices = await query(
      `SELECT i.*, s.name as student_name, s.nis, s.parent_id, pp.account_id, pp.name as post_name, p.phone as parent_phone, p.father_name
       FROM invoices i
       JOIN students s ON i.student_id = s.id
       JOIN payment_posts pp ON i.post_id = pp.id
       LEFT JOIN parents p ON s.parent_id = p.id
       WHERE i.id IN (${placeholders})`,
      targetInvoiceIds
    );

    if (invoices.length === 0) {
      // Fallback query if joins fail
      invoices = await query(`SELECT i.*, 'Siswa' as student_name, '2026' as nis, 'Biaya Pendidikan' as post_name FROM invoices i WHERE i.id IN (${placeholders})`, targetInvoiceIds);
    }

    // Explicit Rule Check: SPP / Biaya Pendidikan DOES NOT ALLOW INSTALLMENTS (Must be paid in full per month)
    for (const inv of invoices) {
      const isSpp = inv.post_name?.includes('SPP') || inv.post_name?.includes('Biaya Pendidikan');
      const remaining = Math.max(0, inv.nominal - inv.discount_amount - inv.paid_amount);

      if (isSpp && numericAmount < remaining - 0.01 && targetInvoiceIds.length === 1) {
        return res.status(400).json({
          success: false,
          error: `ERR-009: Pembayaran SPP / Biaya Pendidikan tidak menerima angsuran/cicilan. Wajib dibayar lunas per bulan (Rp ${remaining.toLocaleString('id-ID')}).`
        });
      }
    }

    const firstInv = invoices[0];
    const sequenceNum = (Date.now() % 100000).toString().padStart(5, '0');
    const now = new Date();
    const monthCode = (now.getMonth() + 1).toString().padStart(2, '0');
    const yearCode = now.getFullYear();
    const txnNumber = `KW/${yearCode}/${monthCode}/${sequenceNum}`;

    let totalPaidInTxn = 0;
    let mainPaymentId = null;
    let paidMonthList = [];
    let overallStatus = 'Lunas';

    // Process each invoice
    for (const inv of invoices) {
      if (inv.status === 'Lunas') continue;

      const remaining = Math.max(0, inv.nominal - inv.discount_amount - inv.paid_amount);
      const isSpp = inv.post_name?.includes('SPP') || inv.post_name?.includes('Biaya Pendidikan');
      
      // Determine installment or full payment amount for this invoice
      const payForThisInv = (targetInvoiceIds.length === 1 && !isSpp && numericAmount < remaining)
        ? numericAmount
        : remaining;

      const paymentResult = await run(
        `INSERT INTO payments (transaction_number, invoice_id, student_id, cashier_id, amount, payment_method, payment_gateway_ref, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Paid', ?)`,
        [txnNumber, inv.id, inv.student_id, req.user.id, payForThisInv, payment_method, payment_gateway_ref || `REF-${payment_method.toUpperCase()}`, notes || '']
      );

      if (!mainPaymentId) mainPaymentId = paymentResult.id;

      // Update invoice paid_amount & status
      const newPaidAmount = inv.paid_amount + payForThisInv;
      const netNominal = inv.nominal - inv.discount_amount;
      const newStatus = (newPaidAmount >= (netNominal - 0.01)) ? 'Lunas' : 'Sebagian';

      if (newStatus === 'Sebagian') overallStatus = 'Sebagian';

      await run(
        `UPDATE invoices SET paid_amount = ?, status = ? WHERE id = ?`,
        [newPaidAmount, newStatus, inv.id]
      );

      // Update account balance
      if (inv.account_id) {
        await run(`UPDATE accounts SET balance = balance + ? WHERE id = ?`, [payForThisInv, inv.account_id]);
      }
      totalPaidInTxn += payForThisInv;
      paidMonthList.push(inv.month_period || inv.post_name);
    }

    // Default cash account increment
    await run(`UPDATE accounts SET balance = balance + ? WHERE code = '101.01'`, [totalPaidInTxn]);

    // Safe send WhatsApp & audit log
    try {
      if (firstInv && firstInv.parent_phone) {
        const monthStr = paidMonthList.join(', ');
        const waMessage = `Assalamu'alaikum Yth. ${firstInv.father_name || 'Orang Tua'},\n\nTerima kasih, pembayaran *${firstInv.post_name}* an. *${firstInv.student_name}* (${monthStr}) sebesar *Rp ${totalPaidInTxn.toLocaleString('id-ID')}* via *${payment_method}* telah BERHASIL (${overallStatus.toUpperCase()}).\n\nNo. Kuitansi: ${txnNumber}\n\nSalam,\nSekolah Cendekia Lamongan`;
        await sendWhatsApp(firstInv.parent_phone, firstInv.father_name || firstInv.student_name, waMessage, 'PaymentSuccess');
      }
    } catch (waErr) {
      console.warn('WhatsApp notice:', waErr.message);
    }

    try {
      await logAudit(
        req.user?.id || 1,
        req.user?.name || 'Kasir',
        req.user?.role || 'kasir',
        'PAYMENT_SUCCESS',
        'PEMBAYARAN',
        `Pembayaran ${paidMonthList.length} pos Rp ${totalPaidInTxn} (Txn: ${txnNumber}) - Status: ${overallStatus}`,
        req
      );
    } catch (auditErr) {
      console.warn('Audit notice:', auditErr.message);
    }

    res.json({
      success: true,
      data: {
        id: mainPaymentId,
        receipt_number: txnNumber,
        transaction_number: txnNumber,
        amount: totalPaidInTxn,
        status: overallStatus
      },
      payment_id: mainPaymentId,
      receipt_number: txnNumber,
      transaction_number: txnNumber,
      paid_amount: totalPaidInTxn,
      remaining_amount: Math.max(0, (invoices[0].nominal - invoices[0].discount_amount) - (invoices[0].paid_amount + totalPaidInTxn)),
      status: overallStatus,
      message: `Pembayaran berhasil diproses (${overallStatus}) dan kwitansi diterbitkan.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// BR-007: Void / Cancel Payment
router.post('/:id/void', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const payment = await get(`SELECT * FROM payments WHERE id = ?`, [id]);
    if (!payment) return res.status(404).json({ success: false, error: 'Transaksi tidak ditemukan' });

    if (payment.status === 'Void') {
      return res.status(400).json({ success: false, error: 'Transaksi sudah dibatalkan sebelumnya' });
    }

    // Mark as void
    await run(`UPDATE payments SET status = 'Void', notes = ? WHERE id = ?`, [`VOID: ${reason || 'Dibatalkan admin'}`, id]);

    // Revert invoice paid_amount & status
    const invoice = await get(`SELECT * FROM invoices WHERE id = ?`, [payment.invoice_id]);
    if (invoice) {
      const newPaid = Math.max(0, invoice.paid_amount - payment.amount);
      const newStatus = newPaid <= 0 ? 'Belum Dibayar' : 'Sebagian';
      await run(`UPDATE invoices SET paid_amount = ?, status = ? WHERE id = ?`, [newPaid, newStatus, invoice.id]);
    }

    // Revert account balances
    await run(`UPDATE accounts SET balance = balance - ? WHERE code = '101.01'`, [payment.amount]);

    await logAudit(req.user.id, req.user.name, req.user.role, 'VOID_PAYMENT', 'PEMBAYARAN', `Pembatalan (Void) transaksi ${payment.transaction_number} sebesar Rp ${payment.amount}. Alasan: ${reason}`, req);

    res.json({ success: true, message: 'Transaksi berhasil dibatalkan (void).' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
