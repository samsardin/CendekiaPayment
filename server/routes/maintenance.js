const express = require('express');
const router = express.Router();
const { query, get, run, isPg, initDB } = require('../database/db');
const seedData = require('../database/seed');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const { logAudit } = require('../middleware/auditMiddleware');
const bcrypt = require('bcryptjs');

const ALL_TABLES = [
  'users',
  'academic_years',
  'units',
  'classes',
  'payment_posts',
  'accounts',
  'students',
  'invoices',
  'payments',
  'payment_items',
  'expenses',
  'audit_logs'
];

// GET /api/maintenance/stats - Health & Row Counts
router.get('/stats', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    const tableCounts = {};
    for (const table of ALL_TABLES) {
      try {
        const result = await query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = result && result[0] ? (result[0].count || result[0].COUNT || 0) : 0;
        tableCounts[table] = parseInt(count);
      } catch (err) {
        tableCounts[table] = 0;
      }
    }

    const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.POSTGRES_URL;

    res.json({
      success: true,
      data: {
        engine: isPg ? 'PostgreSQL (Supabase Cloud)' : 'SQLite3',
        connected: true,
        dbUrlConfigured: Boolean(dbUrl),
        timestamp: new Date().toISOString(),
        tables: tableCounts
      }
    });
  } catch (err) {
    console.error('Maintenance stats error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/maintenance/backup - Export Full Database Dump as JSON
router.get('/backup', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    const dump = {
      app: 'Cendekia SFMS (School Financial Management System)',
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      exported_by: {
        id: req.user.id,
        name: req.user.name,
        role: req.user.role
      },
      engine: isPg ? 'PostgreSQL (Supabase Cloud)' : 'SQLite3',
      data: {}
    };

    for (const table of ALL_TABLES) {
      try {
        const rows = await query(`SELECT * FROM ${table} ORDER BY id ASC`);
        dump.data[table] = rows || [];
      } catch (err) {
        console.warn(`Backup table ${table} notice:`, err.message);
        dump.data[table] = [];
      }
    }

    await logAudit(
      req.user.id,
      req.user.name,
      req.user.role,
      'BACKUP_DATABASE',
      'DATABASE',
      `Berhasil mengunduh backup lengkap database (${Object.values(dump.data).reduce((s, r) => s + r.length, 0)} baris data).`,
      req
    );

    const filename = `Cendekia_Database_Backup_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(dump);
  } catch (err) {
    console.error('Database backup error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/maintenance/restore - Restore Database from JSON
router.post('/restore', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    const { backupData, mode } = req.body; // mode: 'replace' or 'merge'
    if (!backupData || typeof backupData !== 'object' || !backupData.data) {
      return res.status(400).json({ success: false, error: 'Format file backup tidak valid. Pastikan file JSON hasil backup dari Cendekia SFMS.' });
    }

    const data = backupData.data;
    const restoredSummary = {};

    // Restore tables in dependency order
    const orderedTables = [
      'users',
      'academic_years',
      'units',
      'classes',
      'payment_posts',
      'accounts',
      'students',
      'invoices',
      'payments',
      'payment_items',
      'expenses',
      'audit_logs'
    ];

    for (const table of orderedTables) {
      const rows = data[table];
      if (!Array.isArray(rows) || rows.length === 0) {
        restoredSummary[table] = 0;
        continue;
      }

      if (mode === 'replace') {
        try {
          await run(`DELETE FROM ${table}`);
        } catch (e) {
          console.warn(`Delete ${table} notice:`, e.message);
        }
      }

      let inserted = 0;
      for (const row of rows) {
        const keys = Object.keys(row);
        if (keys.length === 0) continue;

        const placeholders = keys.map(() => '?').join(', ');
        const values = keys.map(k => row[k]);

        try {
          if (mode === 'replace') {
            await run(
              `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`,
              values
            );
          } else {
            // Upsert / insert ignore
            if (row.id) {
              const existing = await get(`SELECT id FROM ${table} WHERE id = ?`, [row.id]);
              if (!existing) {
                await run(
                  `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`,
                  values
                );
              }
            } else {
              await run(
                `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`,
                values
              );
            }
          }
          inserted++;
        } catch (err) {
          // Ignore individual row conflict if merging
        }
      }
      restoredSummary[table] = inserted;
    }

    await logAudit(
      req.user.id,
      req.user.name,
      req.user.role,
      'RESTORE_DATABASE',
      'DATABASE',
      `Restore database berhasil (mode: ${mode || 'replace'}). Total data dipulihkan: ${JSON.stringify(restoredSummary)}`,
      req
    );

    res.json({
      success: true,
      message: 'Database berhasil dipulihkan dari file backup!',
      summary: restoredSummary
    });
  } catch (err) {
    console.error('Database restore error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/maintenance/reset - Reset Database (Transactions Only or Full Reset)
router.post('/reset', verifyToken, authorizeRoles('superadmin'), async (req, res) => {
  try {
    const { mode, confirmCode, password } = req.body;
    // mode: 'transactions_only' | 'full_reset'

    if (confirmCode !== 'RESET-DATABASE-CENDEKIA') {
      return res.status(400).json({ success: false, error: 'Kode konfirmasi tidak sesuai. Harap ketik RESET-DATABASE-CENDEKIA dengan tepat.' });
    }

    // Verify superadmin password for safety
    if (!password) {
      return res.status(400).json({ success: false, error: 'Password Superadmin diperlukan untuk konfirmasi reset database.' });
    }

    const adminUser = await get(`SELECT * FROM users WHERE id = ?`, [req.user.id]);
    if (!adminUser || !(await bcrypt.compare(password, adminUser.password))) {
      return res.status(401).json({ success: false, error: 'Password Superadmin salah. Tindakan reset dibatalkan.' });
    }

    if (mode === 'transactions_only') {
      // Clear payments, payment_items, expenses, and reset invoice statuses back to unpaid
      await run(`DELETE FROM payment_items`);
      await run(`DELETE FROM payments`);
      await run(`DELETE FROM expenses`);
      await run(`UPDATE invoices SET paid_amount = 0, status = 'Belum Dibayar'`);

      await logAudit(
        req.user.id,
        req.user.name,
        req.user.role,
        'RESET_TRANSACTIONS',
        'DATABASE',
        'Reset data transaksi kasir, pengeluaran & pengosongan pembayaran tagihan selesai.',
        req
      );

      return res.json({
        success: true,
        message: 'Seluruh data riwayat transaksi kasir, kwitansi, dan pengeluaran berhasil di-reset. Master siswa & daftar tagihan tetap dipertahankan.'
      });
    } else if (mode === 'full_reset') {
      // Clear all tables and re-seed clean default demo data
      await run(`DELETE FROM payment_items`);
      await run(`DELETE FROM payments`);
      await run(`DELETE FROM expenses`);
      await run(`DELETE FROM invoices`);
      await run(`DELETE FROM students`);
      await run(`DELETE FROM classes`);
      await run(`DELETE FROM payment_posts`);
      await run(`DELETE FROM accounts`);
      await run(`DELETE FROM units`);
      await run(`DELETE FROM academic_years`);

      // Re-seed default demo data
      await seedData();

      await logAudit(
        req.user.id,
        req.user.name,
        req.user.role,
        'FULL_DATABASE_RESET',
        'DATABASE',
        'Reset total database dan inisialisasi ulang master data demo standar.',
        req
      );

      return res.json({
        success: true,
        message: 'Database berhasil di-reset total dan master data standar telah diinisialisasi ulang!'
      });
    } else {
      return res.status(400).json({ success: false, error: 'Mode reset tidak dikenali.' });
    }
  } catch (err) {
    console.error('Database reset error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
