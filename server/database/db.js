const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../../cendekiapayment.db');
const db = new sqlite3.Database(dbPath);

// Helper for promise-based queries
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

// Initialize schema
const initDB = async () => {
  db.serialize(async () => {
    // Enable foreign keys
    await run(`PRAGMA foreign_keys = ON;`);

    // 1. Users
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('superadmin', 'admin', 'kasir', 'ortu')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Academic Years
    await run(`
      CREATE TABLE IF NOT EXISTS academic_years (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        is_active INTEGER DEFAULT 0,
        start_date TEXT,
        end_date TEXT
      );
    `);

    // 3. Educational Units
    await run(`
      CREATE TABLE IF NOT EXISTS units (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL
      );
    `);

    // 4. Classes
    await run(`
      CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        homeroom_teacher TEXT,
        capacity INTEGER DEFAULT 30,
        FOREIGN KEY (unit_id) REFERENCES units(id)
      );
    `);

    // 5. Parents
    await run(`
      CREATE TABLE IF NOT EXISTS parents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        father_name TEXT NOT NULL,
        mother_name TEXT,
        phone TEXT NOT NULL,
        email TEXT,
        address TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    // 6. Students
    await run(`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nis TEXT UNIQUE NOT NULL,
        nisn TEXT,
        name TEXT NOT NULL,
        gender TEXT CHECK(gender IN ('L', 'P')),
        pob TEXT,
        dob TEXT,
        address TEXT,
        unit_id INTEGER NOT NULL,
        class_id INTEGER NOT NULL,
        parent_id INTEGER,
        status TEXT DEFAULT 'Aktif' CHECK(status IN ('Aktif', 'Pindah', 'Lulus', 'Keluar')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (unit_id) REFERENCES units(id),
        FOREIGN KEY (class_id) REFERENCES classes(id),
        FOREIGN KEY (parent_id) REFERENCES parents(id)
      );
    `);

    // 7. Accounts (General Ledger & Cash accounts)
    await run(`
      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('Kas', 'Bank', 'Pendapatan', 'Pengeluaran', 'Piutang', 'Gabungan')),
        parent_id INTEGER,
        balance REAL DEFAULT 0.0
      );
    `);

    // 8. Payment Posts
    await run(`
      CREATE TABLE IF NOT EXISTS payment_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_id INTEGER,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('Bulanan', 'Tahunan', 'Sekali Bayar', 'Angsuran')),
        default_amount REAL DEFAULT 0.0,
        is_active INTEGER DEFAULT 1,
        sort_order INTEGER DEFAULT 1,
        account_id INTEGER,
        FOREIGN KEY (unit_id) REFERENCES units(id),
        FOREIGN KEY (account_id) REFERENCES accounts(id)
      );
    `);

    // 9. Nominal Rules (Flex-pricing per Class, Student, etc.)
    await run(`
      CREATE TABLE IF NOT EXISTS nominal_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        target_type TEXT NOT NULL CHECK(target_type IN ('default', 'unit', 'class', 'student')),
        target_id INTEGER,
        amount REAL NOT NULL,
        FOREIGN KEY (post_id) REFERENCES payment_posts(id)
      );
    `);

    // 10. Discounts
    await run(`
      CREATE TABLE IF NOT EXISTS discounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        post_id INTEGER NOT NULL,
        type TEXT CHECK(type IN ('percentage', 'nominal')),
        value REAL NOT NULL,
        reason TEXT,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (post_id) REFERENCES payment_posts(id)
      );
    `);

    // 11. Invoices
    await run(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT UNIQUE NOT NULL,
        student_id INTEGER NOT NULL,
        post_id INTEGER NOT NULL,
        academic_year_id INTEGER NOT NULL,
        month_period TEXT,
        due_date TEXT NOT NULL,
        nominal REAL NOT NULL,
        discount_amount REAL DEFAULT 0.0,
        paid_amount REAL DEFAULT 0.0,
        status TEXT DEFAULT 'Belum Dibayar' CHECK(status IN ('Belum Dibayar', 'Sebagian', 'Lunas', 'Terlambat')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (post_id) REFERENCES payment_posts(id),
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
      );
    `);

    // 12. Payments
    await run(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_number TEXT UNIQUE NOT NULL,
        invoice_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        cashier_id INTEGER,
        amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        payment_gateway_ref TEXT,
        status TEXT DEFAULT 'Paid' CHECK(status IN ('Pending', 'Paid', 'Failed', 'Expired', 'Void')),
        payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id),
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (cashier_id) REFERENCES users(id)
      );
    `);

    // 13. Expenses
    await run(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        voucher_number TEXT UNIQUE NOT NULL,
        date TEXT NOT NULL,
        category TEXT NOT NULL,
        account_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        attachment_url TEXT,
        created_by INTEGER NOT NULL,
        status TEXT DEFAULT 'Approved' CHECK(status IN ('Pending', 'Approved', 'Rejected')),
        approved_by INTEGER,
        FOREIGN KEY (account_id) REFERENCES accounts(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      );
    `);

    // 14. WA Logs
    await run(`
      CREATE TABLE IF NOT EXISTS wa_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipient_phone TEXT NOT NULL,
        recipient_name TEXT,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'PaymentSuccess',
        status TEXT DEFAULT 'Sent',
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 15. Audit Logs
    await run(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        user_name TEXT,
        user_role TEXT,
        action TEXT NOT NULL,
        module TEXT NOT NULL,
        details TEXT,
        ip_address TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ SQLite Database Schema initialized successfully.');
  });
};

module.exports = {
  db,
  query,
  get,
  run,
  initDB
};
