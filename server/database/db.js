const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.POSTGRES_URL;
const isPg = Boolean(dbUrl && (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://') || dbUrl.includes('supabase')));

let pool = null;
let sqliteDb = null;

if (isPg) {
  console.log('🐘 Connecting to Supabase PostgreSQL Cloud Database...');
  pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });
} else {
  const dbPath = process.env.VERCEL
    ? path.join('/tmp', 'cendekiapayment.db')
    : path.resolve(__dirname, '../../cendekiapayment.db');
  console.log(`📁 Connecting to SQLite Database at: ${dbPath}`);
  sqliteDb = new sqlite3.Database(dbPath);
}

const convertSql = (sql) => {
  if (!isPg) return sql;
  let idx = 1;
  let pgSql = sql.replace(/\?/g, () => `$${idx++}`);
  pgSql = pgSql.replace(/DATE\('now', 'localtime'\)/gi, 'CURRENT_DATE');
  pgSql = pgSql.replace(/DATE\('now', '-7 days'\)/gi, "(CURRENT_DATE - INTERVAL '7 days')");
  pgSql = pgSql.replace(/strftime\('%Y-%m', 'now'\)/gi, "to_char(CURRENT_DATE, 'YYYY-MM')");
  pgSql = pgSql.replace(/strftime\('%Y-%m', ([a-zA-Z0-9_\.]+)\)/gi, "to_char($1, 'YYYY-MM')");
  return pgSql;
};

const query = async (sql, params = []) => {
  if (isPg) {
    const pgSql = convertSql(sql);
    const res = await pool.query(pgSql, params);
    return res.rows;
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }
};

const get = async (sql, params = []) => {
  if (isPg) {
    const pgSql = convertSql(sql);
    const res = await pool.query(pgSql, params);
    return res.rows[0] || null;
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });
  }
};

const run = async (sql, params = []) => {
  if (isPg) {
    let pgSql = convertSql(sql);
    if (pgSql.trim().toUpperCase().startsWith('INSERT') && !pgSql.toUpperCase().includes('RETURNING')) {
      pgSql += ' RETURNING id';
    }
    const res = await pool.query(pgSql, params);
    const insertedId = res.rows && res.rows[0] ? res.rows[0].id : null;
    return { id: insertedId, changes: res.rowCount };
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }
};

// Initialize schema for PostgreSQL or SQLite
const initDB = async () => {
  if (isPg) {
    const schemaPath = path.join(__dirname, 'supabase_schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(sql);
      console.log('✅ Supabase PostgreSQL Schema initialized successfully.');
    }
  } else {
    return new Promise((resolve) => {
      sqliteDb.serialize(async () => {
        try {
          await run(`PRAGMA foreign_keys = ON;`);
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
          await run(`
            CREATE TABLE IF NOT EXISTS academic_years (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              is_active INTEGER DEFAULT 0,
              start_date TEXT,
              end_date TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `);
          await run(`
            CREATE TABLE IF NOT EXISTS units (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              code TEXT UNIQUE NOT NULL,
              name TEXT NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `);
          await run(`
            CREATE TABLE IF NOT EXISTS classes (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              unit_id INTEGER NOT NULL,
              name TEXT NOT NULL,
              homeroom_teacher TEXT,
              capacity INTEGER DEFAULT 30,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (unit_id) REFERENCES units(id)
            );
          `);
          await run(`
            CREATE TABLE IF NOT EXISTS parents (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER,
              father_name TEXT NOT NULL,
              mother_name TEXT,
              phone TEXT,
              email TEXT,
              address TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id)
            );
          `);
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
          await run(`
            CREATE TABLE IF NOT EXISTS expenses (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              expense_number TEXT UNIQUE NOT NULL,
              account_id INTEGER NOT NULL,
              category TEXT NOT NULL,
              title TEXT NOT NULL,
              amount REAL NOT NULL,
              recipient TEXT,
              date TEXT NOT NULL,
              approved_by INTEGER,
              status TEXT DEFAULT 'Approved',
              notes TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (account_id) REFERENCES accounts(id),
              FOREIGN KEY (approved_by) REFERENCES users(id)
            );
          `);
          await run(`
            CREATE TABLE IF NOT EXISTS wa_logs (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              recipient_phone TEXT NOT NULL,
              recipient_name TEXT,
              message TEXT NOT NULL,
              type TEXT,
              status TEXT DEFAULT 'Sent',
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `);
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
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `);
          console.log('✅ SQLite Database Schema initialized successfully.');
          resolve();
        } catch (err) {
          console.error('SQLite init error:', err);
          resolve();
        }
      });
    });
  }
};

module.exports = {
  query,
  get,
  run,
  initDB,
  isPg
};
