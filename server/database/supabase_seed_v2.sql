-- ====================================================================
-- Cendekia SFMS v2.0 Initial Data Seed Script for Supabase PostgreSQL Cloud
-- Sekolah Cendekia Lamongan (KBTK-IT Cendekia & SDIT Cendekia)
-- ====================================================================

-- 1. Insert Base Users (Default password: password123)
INSERT INTO users (id, name, email, phone, password, role) VALUES
(1, 'Superadmin Cendekia', 'superadmin@cendekia.sch.id', '081234567890', '$2a$10$3e877gMh52s6sB0WjH6SseZz6P6M6E6A6B6C6D6E6F6G6H6I6J6K', 'superadmin'),
(2, 'Ustz. Rahma (Admin Keuangan)', 'admin@cendekia.sch.id', '081234567891', '$2a$10$3e877gMh52s6sB0WjH6SseZz6P6M6E6A6B6C6D6E6F6G6H6I6J6K', 'admin'),
(3, 'Ust. Hendra (Kasir Utama)', 'kasir@cendekia.sch.id', '081234567892', '$2a$10$3e877gMh52s6sB0WjH6SseZz6P6M6E6A6B6C6D6E6F6G6H6I6J6K', 'kasir'),
(4, 'Bpk. Ahmad Subagyo (Ortu)', 'ortu.ahmad@gmail.com', '081298765432', '$2a$10$3e877gMh52s6sB0WjH6SseZz6P6M6E6A6B6C6D6E6F6G6H6I6J6K', 'ortu')
ON CONFLICT (email) DO NOTHING;

-- 2. Insert Academic Year
INSERT INTO academic_years (id, name, is_active, start_date, end_date) VALUES
(1, '2026/2027', 1, '2026-07-01', '2027-06-30')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Units
INSERT INTO units (id, code, name) VALUES
(1, 'KBTK', 'KBTK-IT Cendekia'),
(2, 'SDIT', 'SDIT Cendekia')
ON CONFLICT (code) DO NOTHING;

-- 4. Insert Classes
INSERT INTO classes (id, unit_id, name, homeroom_teacher, capacity) VALUES
(1, 1, 'Kelompok Bermain (KB)', 'Ustz. Aisyah, S.Pd', 20),
(2, 1, 'TK-A Bintang', 'Ustz. Khadijah, S.Pd', 25),
(3, 1, 'TK-B Bulan', 'Ustz. Maryam, S.Pd', 25),
(4, 2, 'Kelas 1 Abu Bakar', 'Ust. Ali Imran, S.Pd.I', 28),
(5, 2, 'Kelas 1 Umar', 'Ustz. Halimah, S.Pd', 28),
(6, 2, 'Kelas 2 Utsman', 'Ust. Mahmud, S.Pd', 30),
(7, 2, 'Kelas 3 Ali', 'Ustz. Nur, S.Si', 30)
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Accounts (Chart of Accounts / COA)
INSERT INTO accounts (id, code, name, type, balance) VALUES
(1, '101.01', 'Kas Utama (Bendahara)', 'Kas', 15500000.00),
(2, '101.02', 'Bank BCA Cendekia', 'Bank', 45000000.00),
(3, '101.03', 'Bank BSI Syariah Cendekia', 'Bank', 32500000.00),
(4, '102.01', 'Piutang SPP & Tagihan Siswa', 'Piutang', 12800000.00),
(5, '401.01', 'Pendapatan SPP (Biaya Pendidikan)', 'Pendapatan', 0.00),
(6, '401.02', 'Pendapatan Infaq Pembangunan', 'Pendapatan', 0.00),
(7, '401.03', 'Pendapatan Seragam & Atribut', 'Pendapatan', 0.00),
(8, '501.01', 'Beban Gaji & Honor Guru', 'Pengeluaran', 0.00),
(9, '501.02', 'Beban Operasional & Listrik/Air', 'Pengeluaran', 0.00)
ON CONFLICT (code) DO NOTHING;

-- 6. Insert Payment Posts
INSERT INTO payment_posts (id, unit_id, code, name, type, default_amount, is_active, sort_order, account_id) VALUES
(1, 2, 'SPP-SDIT', 'Biaya Pendidikan / SPP SDIT', 'Bulanan', 500000.00, 1, 1, 1),
(2, 1, 'SPP-KBTK', 'Biaya Pendidikan / SPP KBTK', 'Bulanan', 400000.00, 1, 2, 1),
(3, 2, 'INFAQ-PEMB', 'Infaq Pembangunan SDIT', 'Tahunan', 4500000.00, 1, 3, 1),
(4, 2, 'SERAGAM-SDIT', 'Seragam & Atribut Sekolah SDIT', 'Sekali Bayar', 1200000.00, 1, 4, 1),
(5, 2, 'BUKU-SDIT', 'Buku Paket & LKS (Tahunan)', 'Tahunan', 850000.00, 1, 5, 1),
(6, 2, 'OUTING-SDIT', 'Kegiatan Outing & Rihlah', 'Sekali Bayar', 450000.00, 1, 6, 1),
(7, 2, 'KOMITE-SDIT', 'Komite Sekolah & Majelis', 'Tahunan', 150000.00, 1, 7, 1)
ON CONFLICT (id) DO NOTHING;

-- 7. Insert Parent Record
INSERT INTO parents (id, user_id, father_name, mother_name, phone, email, address) VALUES
(1, 4, 'Bpk. Ahmad Subagyo', 'Ibu Siti Aminah', '081298765432', 'ortu.ahmad@gmail.com', 'Jl. Merdeka No. 45, Lamongan')
ON CONFLICT (id) DO NOTHING;

-- 8. Insert Students Sample
INSERT INTO students (id, nis, nisn, name, gender, pob, dob, address, unit_id, class_id, parent_id, status) VALUES
(239, '2026021001', '2026001', 'Muhammad Ali Rayyan', 'L', 'Lamongan', '2019-05-12', 'Jl. Merdeka No. 45', 2, 4, 1, 'Aktif'),
(240, '2026021002', '2026002', 'Khalifah Umar Al-Ghazi', 'L', 'Lamongan', '2019-06-18', 'Jl. Pemuda No. 12', 2, 4, NULL, 'Aktif'),
(241, '2026021003', '2026003', 'Syakira Nabila', 'P', 'Lamongan', '2019-07-22', 'Jl. Veteran No. 8', 2, 4, NULL, 'Aktif'),
(256, '2026022001', '2026004', 'Hamzah Abdul Jabbar', 'L', 'Lamongan', '2019-04-10', 'Jl. Sunan Giri No. 3', 2, 5, NULL, 'Aktif'),
(257, '2026022002', '2026005', 'Zaskia Adya Mecca', 'P', 'Lamongan', '2019-08-15', 'Jl. Pahlawan No. 20', 2, 5, NULL, 'Aktif'),
(258, '2026022003', '2026006', 'Fathan Mubina', 'L', 'Lamongan', '2019-09-01', 'Jl. Basuki Rahmat No. 14', 2, 5, NULL, 'Aktif'),
(274, '2026023001', '2026007', 'Fatimah Az-Zahra Subagyo', 'P', 'Lamongan', '2018-02-11', 'Jl. Panglima Sudirman No. 9', 2, 6, NULL, 'Aktif')
ON CONFLICT (nis) DO NOTHING;

-- Reset Sequence ID values for PostgreSQL
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('academic_years_id_seq', (SELECT MAX(id) FROM academic_years));
SELECT setval('units_id_seq', (SELECT MAX(id) FROM units));
SELECT setval('classes_id_seq', (SELECT MAX(id) FROM classes));
SELECT setval('accounts_id_seq', (SELECT MAX(id) FROM accounts));
SELECT setval('payment_posts_id_seq', (SELECT MAX(id) FROM payment_posts));
SELECT setval('parents_id_seq', (SELECT MAX(id) FROM parents));
SELECT setval('students_id_seq', (SELECT MAX(id) FROM students));
