const express = require('express');
const router = express.Router();
const { query, get, run } = require('../database/db');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const { logAudit } = require('../middleware/auditMiddleware');

// === PAYMENT GATEWAY SIMULATION ===

// Charge / Initiate Online Payment
router.post('/charge', verifyToken, async (req, res) => {
  try {
    const { invoice_id, payment_method, amount } = req.body;

    const invoice = await get(
      `SELECT i.*, s.name as student_name, s.nis, p.father_name, p.phone
       FROM invoices i
       JOIN students s ON i.student_id = s.id
       LEFT JOIN parents p ON s.parent_id = p.id
       WHERE i.id = ?`,
      [invoice_id]
    );

    if (!invoice) return res.status(404).json({ success: false, error: 'Tagihan tidak ditemukan' });

    const payAmount = amount || (invoice.nominal - invoice.discount_amount - invoice.paid_amount);
    const orderId = `PG-CENDEKIA-${invoice.id}-${Date.now()}`;

    let qrCodeData = null;
    let vaNumber = null;
    let paymentUrl = null;

    if (payment_method === 'QRIS') {
      qrCodeData = `00020101021226670016ID.CO.CENDEKIA.WWW01189360091400000000005204581253033605802ID5916CENDEKIA LAMONGAN6008LAMONGAN61056221162070703A016304`;
    } else if (['Virtual Account', 'Transfer'].includes(payment_method)) {
      vaNumber = `8809${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    } else if (['E-Wallet', 'Minimarket'].includes(payment_method)) {
      paymentUrl = `https://checkout.cendekia-pay.id/pay/${orderId}`;
    }

    res.json({
      success: true,
      order_id: orderId,
      invoice_id: invoice.id,
      amount: payAmount,
      payment_method,
      qr_code_data: qrCodeData,
      va_number: vaNumber,
      payment_url: paymentUrl,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Webhook / Callback Handler (FR-013)
router.post('/callback', async (req, res) => {
  try {
    const { order_id, invoice_id, amount, payment_method, status } = req.body;

    if (status !== 'PAID') {
      return res.json({ success: true, status: 'IGNORED' });
    }

    const invoice = await get(
      `SELECT i.*, s.name as student_name, s.nis, s.parent_id, pp.account_id, pp.name as post_name, p.phone as parent_phone, p.father_name
       FROM invoices i
       JOIN students s ON i.student_id = s.id
       JOIN payment_posts pp ON i.post_id = pp.id
       LEFT JOIN parents p ON s.parent_id = p.id
       WHERE i.id = ?`,
      [invoice_id]
    );

    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });

    const payAmount = parseFloat(amount);
    const txnNumber = `TXN-PG/${Date.now().toString().slice(-8)}`;

    // Create payment
    const paymentResult = await run(
      `INSERT INTO payments (transaction_number, invoice_id, student_id, cashier_id, amount, payment_method, payment_gateway_ref, status, notes)
       VALUES (?, ?, ?, 1, ?, ?, ?, 'Paid', 'Pembayaran via Payment Gateway Webhook')`,
      [txnNumber, invoice.id, invoice.student_id, payAmount, payment_method || 'QRIS', order_id]
    );

    // Update invoice
    const newPaid = invoice.paid_amount + payAmount;
    const newStatus = (newPaid >= (invoice.nominal - invoice.discount_amount - 0.01)) ? 'Lunas' : 'Sebagian';

    await run(`UPDATE invoices SET paid_amount = ?, status = ? WHERE id = ?`, [newPaid, newStatus, invoice.id]);

    // Update accounts
    if (invoice.account_id) {
      await run(`UPDATE accounts SET balance = balance + ? WHERE id = ?`, [payAmount, invoice.account_id]);
    }
    await run(`UPDATE accounts SET balance = balance + ? WHERE code = '102.01'`, [payAmount]); // PG Clearing Account

    // Trigger WhatsApp notification
    const waMsg = `[Payment Gateway Callback]\nAssalamu'alaikum Yth. ${invoice.father_name || 'Orang Tua'},\n\nPembayaran *${invoice.post_name}* an. *${invoice.student_name}* sebesar *Rp ${payAmount.toLocaleString('id-ID')}* via *${payment_method}* telah TERKONFIRMASI LUNAS secara otomatis oleh Payment Gateway.\n\nRef PG: ${order_id}\n\nKwitansi: http://localhost:5173/receipt/${paymentResult.id}`;

    if (invoice.parent_phone) {
      await run(
        `INSERT INTO wa_logs (recipient_phone, recipient_name, message, type, status) VALUES (?, ?, ?, 'PaymentSuccess', 'Sent')`,
        [invoice.parent_phone, invoice.father_name || invoice.student_name, waMsg]
      );
    }

    await logAudit(1, 'Payment Gateway Webhook', 'system', 'PG_CALLBACK_SUCCESS', 'GATEWAY', `Payment Gateway callback processed Rp ${payAmount} for invoice ${invoice.invoice_number}`);

    res.json({ success: true, message: 'Callback processed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// === WHATSAPP GATEWAY SIMULATION ===

// Get WA Logs
router.get('/wa-logs', verifyToken, async (req, res) => {
  try {
    const logs = await query(`SELECT * FROM wa_logs ORDER BY id DESC LIMIT 100`);
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Send Manual Reminder WA
router.post('/send-wa-reminder', verifyToken, authorizeRoles('superadmin', 'admin', 'kasir'), async (req, res) => {
  try {
    const { invoice_id } = req.body;

    const invoice = await get(
      `SELECT i.*, s.name as student_name, s.nis, c.name as class_name, pp.name as post_name, p.father_name, p.phone as parent_phone
       FROM invoices i
       JOIN students s ON i.student_id = s.id
       JOIN classes c ON s.class_id = c.id
       JOIN payment_posts pp ON i.post_id = pp.id
       LEFT JOIN parents p ON s.parent_id = p.id
       WHERE i.id = ?`,
      [invoice_id]
    );

    if (!invoice) return res.status(404).json({ success: false, error: 'Tagihan tidak ditemukan' });

    if (!invoice.parent_phone) {
      return res.status(400).json({ success: false, error: 'Nomor WhatsApp Orang Tua tidak tersedia' });
    }

    const remaining = invoice.nominal - invoice.discount_amount - invoice.paid_amount;
    const msg = `[REMINDER TAGIHAN SEKOALAH]\n\nAssalamu'alaikum Wr. Wb.\nBapak/Ibu ${invoice.father_name || 'Wali Murid'},\n\nKami menginformasikan tagihan *${invoice.post_name}* an. Ananda *${invoice.student_name}* (${invoice.class_name}):\n- Nominal: Rp ${invoice.nominal.toLocaleString('id-ID')}\n- Sisa Tagihan: *Rp ${remaining.toLocaleString('id-ID')}*\n- Jatuh Tempo: ${invoice.due_date}\n\nPembayaran dapat dilakukan melalui Kasir Sekolah atau secara online via Portal Orang Tua.\n\nTerima kasih,\nSekolah Cendekia Lamongan`;

    const result = await run(
      `INSERT INTO wa_logs (recipient_phone, recipient_name, message, type, status) VALUES (?, ?, ?, 'Reminder', 'Sent')`,
      [invoice.parent_phone, invoice.father_name || invoice.student_name, msg]
    );

    await logAudit(req.user.id, req.user.name, req.user.role, 'SEND_WA_REMINDER', 'GATEWAY', `Kirim pengingat WA ke ${invoice.parent_phone} untuk invoice ${invoice.invoice_number}`, req);

    res.json({ success: true, message: `Pesan pengingat WhatsApp berhasil dikirim ke ${invoice.parent_phone}`, log_id: result.id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
