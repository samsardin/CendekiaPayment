-- ========================================================
-- Cendekia SFMS Database Schema for Supabase PostgreSQL Cloud
-- Sekolah Cendekia Lamongan (KBTK-IT & SDIT Cendekia)
-- ========================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(30),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK(role IN ('superadmin', 'admin', 'kasir', 'ortu')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Academic Years Table
CREATE TABLE IF NOT EXISTS academic_years (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL,
    is_active INT DEFAULT 0,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Units Table
CREATE TABLE IF NOT EXISTS units (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Classes Table
CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    unit_id INT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    homeroom_teacher VARCHAR(100),
    capacity INT DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Parents Table
CREATE TABLE IF NOT EXISTS parents (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    father_name VARCHAR(100) NOT NULL,
    mother_name VARCHAR(100),
    phone VARCHAR(30),
    email VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Students Table
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    nis VARCHAR(30) UNIQUE NOT NULL,
    nisn VARCHAR(30),
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(2) CHECK(gender IN ('L', 'P')),
    pob VARCHAR(100),
    dob DATE,
    address TEXT,
    unit_id INT NOT NULL REFERENCES units(id),
    class_id INT NOT NULL REFERENCES classes(id),
    parent_id INT REFERENCES parents(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'Aktif' CHECK(status IN ('Aktif', 'Pindah', 'Lulus', 'Keluar')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Accounts (Chart of Accounts) Table
CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL CHECK(type IN ('Kas', 'Bank', 'Pendapatan', 'Pengeluaran', 'Piutang', 'Gabungan')),
    parent_id INT REFERENCES accounts(id),
    balance NUMERIC(15, 2) DEFAULT 0.00
);

-- 8. Payment Posts Table
CREATE TABLE IF NOT EXISTS payment_posts (
    id SERIAL PRIMARY KEY,
    unit_id INT REFERENCES units(id),
    code VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL CHECK(type IN ('Bulanan', 'Tahunan', 'Sekali Bayar', 'Angsuran')),
    default_amount NUMERIC(15, 2) DEFAULT 0.00,
    is_active INT DEFAULT 1,
    sort_order INT DEFAULT 1,
    account_id INT REFERENCES accounts(id)
);

-- 9. Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    post_id INT NOT NULL REFERENCES payment_posts(id),
    academic_year_id INT NOT NULL REFERENCES academic_years(id),
    month_period VARCHAR(20),
    due_date DATE NOT NULL,
    nominal NUMERIC(15, 2) NOT NULL,
    discount_amount NUMERIC(15, 2) DEFAULT 0.00,
    paid_amount NUMERIC(15, 2) DEFAULT 0.00,
    status VARCHAR(30) DEFAULT 'Belum Dibayar' CHECK(status IN ('Belum Dibayar', 'Sebagian', 'Lunas', 'Terlambat')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    transaction_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_id INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES students(id),
    cashier_id INT REFERENCES users(id),
    amount NUMERIC(15, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_gateway_ref VARCHAR(100),
    status VARCHAR(30) DEFAULT 'Paid' CHECK(status IN ('Pending', 'Paid', 'Failed', 'Expired', 'Void')),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- 11. Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    expense_number VARCHAR(50) UNIQUE NOT NULL,
    account_id INT NOT NULL REFERENCES accounts(id),
    category VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    recipient VARCHAR(100),
    date DATE NOT NULL,
    approved_by INT REFERENCES users(id),
    status VARCHAR(30) DEFAULT 'Approved',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. WA Logs Table
CREATE TABLE IF NOT EXISTS wa_logs (
    id SERIAL PRIMARY KEY,
    recipient_phone VARCHAR(30) NOT NULL,
    recipient_name VARCHAR(100),
    message TEXT NOT NULL,
    type VARCHAR(50),
    status VARCHAR(30) DEFAULT 'Sent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT,
    user_name VARCHAR(100),
    user_role VARCHAR(30),
    action VARCHAR(50) NOT NULL,
    module VARCHAR(50) NOT NULL,
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
