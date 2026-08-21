const bcrypt = require('bcryptjs');
const { query, get, run, isPg } = require('./db');

const seedSupabaseData = async () => {
  try {
    console.log('🚀 Starting Supabase PostgreSQL Data Auto-Seeding...');

    // 1. Password hash default 'password123'
    const defaultPassword = await bcrypt.hash('password123', 10);

    // 2. Insert Base Users
    const usersData = [
      ['Superadmin Cendekia', 'superadmin@cendekia.sch.id', '081234567890', defaultPassword, 'superadmin'],
      ['Ustz. Rahma (Admin Keuangan)', 'admin@cendekia.sch.id', '081234567891', defaultPassword, 'admin'],
      ['Ust. Hendra (Kasir Utama)', 'kasir@cendekia.sch.id', '081234567892', defaultPassword, 'kasir'],
      ['Bpk. Ahmad Subagyo (Ortu)', 'ortu.ahmad@gmail.com', '081298765432', defaultPassword, 'ortu']
    ];

    for (const u of usersData) {
      const existing = await get(`SELECT id FROM users WHERE email = ?`, [u[1]]);
      if (!existing) {
        await run(
          `INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)`,
          u
        );
      }
    }
    console.log('✅ Base users populated.');

    // 3. Insert Academic Years
    const ay = await get(`SELECT id FROM academic_years WHERE name = '2026/2027'`);
    let ayId = ay?.id;
    if (!ayId) {
      const res = await run(
        `INSERT INTO academic_years (name, is_active, start_date, end_date) VALUES ('2026/2027', 1, '2026-07-01', '2027-06-30')`
      );
      ayId = res.id;
    }
    console.log('✅ Academic year 2026/2027 active.');

    // 4. Insert Units
    const kbtk = await get(`SELECT id FROM units WHERE code = 'KBTK'`);
    let kbtkId = kbtk?.id;
    if (!kbtkId) {
      const res = await run(`INSERT INTO units (code, name) VALUES ('KBTK', 'KBTK-IT Cendekia')`);
      kbtkId = res.id;
    }

    const sdit = await get(`SELECT id FROM units WHERE code = 'SDIT'`);
    let sditId = sdit?.id;
    if (!sditId) {
      const res = await run(`INSERT INTO units (code, name) VALUES ('SDIT', 'SDIT Cendekia')`);
      sditId = res.id;
    }
    console.log('✅ Units KBTK-IT & SDIT created.');

    // 5. Insert Classes
    const classesList = [
      [kbtkId, 'Kelompok Bermain (KB)', 'Ustz. Aisyah, S.Pd', 20],
      [kbtkId, 'TK-A Bintang', 'Ustz. Khadijah, S.Pd', 25],
      [kbtkId, 'TK-B Bulan', 'Ustz. Maryam, S.Pd', 25],
      [sditId, 'Kelas 1 Abu Bakar', 'Ust. Ali Imran, S.Pd.I', 28],
      [sditId, 'Kelas 1 Umar', 'Ustz. Halimah, S.Pd', 28],
      [sditId, 'Kelas 2 Utsman', 'Ust. Mahmud, S.Pd', 30],
      [sditId, 'Kelas 3 Ali', 'Ustz. Nur, S.Si', 30]
    ];

    for (const c of classesList) {
      const existing = await get(`SELECT id FROM classes WHERE unit_id = ? AND name = ?`, [c[0], c[1]]);
      if (!existing) {
        await run(`INSERT INTO classes (unit_id, name, homeroom_teacher, capacity) VALUES (?, ?, ?, ?)`, c);
      }
    }
    console.log('✅ All 7 classes created.');

    // 6. Insert Chart of Accounts (COA)
    const accountsData = [
      ['101.01', 'Kas Utama (Bendahara)', 'Kas', 15500000],
      ['101.02', 'Bank BCA Cendekia', 'Bank', 45000000],
      ['101.03', 'Bank BSI Syariah Cendekia', 'Bank', 32500000],
      ['102.01', 'Piutang SPP & Tagihan Siswa', 'Piutang', 12800000],
      ['401.01', 'Pendapatan SPP (Biaya Pendidikan)', 'Pendapatan', 0],
      ['401.02', 'Pendapatan Infaq Pembangunan', 'Pendapatan', 0],
      ['401.03', 'Pendapatan Seragam & Atribut', 'Pendapatan', 0],
      ['501.01', 'Beban Gaji & Honor Guru', 'Pengeluaran', 0],
      ['501.02', 'Beban Operasional & Listrik/Air', 'Pengeluaran', 0]
    ];

    for (const acc of accountsData) {
      const existing = await get(`SELECT id FROM accounts WHERE code = ?`, [acc[0]]);
      if (!existing) {
        await run(`INSERT INTO accounts (code, name, type, balance) VALUES (?, ?, ?, ?)`, acc);
      }
    }
    console.log('✅ Accounts (COA) created.');

    // 7. Insert Payment Posts
    const kasAccount = await get(`SELECT id FROM accounts WHERE code = '101.01'`);
    const kasAccId = kasAccount ? kasAccount.id : null;

    const postsData = [
      [sditId, 'SPP-SDIT', 'Biaya Pendidikan / SPP SDIT', 'Bulanan', 500000, 1, 1, kasAccId],
      [kbtkId, 'SPP-KBTK', 'Biaya Pendidikan / SPP KBTK', 'Bulanan', 400000, 1, 2, kasAccId],
      [sditId, 'INFAQ-PEMB', 'Infaq Pembangunan SDIT', 'Tahunan', 4500000, 1, 3, kasAccId],
      [sditId, 'SERAGAM-SDIT', 'Seragam & Atribut Sekolah SDIT', 'Sekali Bayar', 1200000, 1, 4, kasAccId],
      [sditId, 'BUKU-SDIT', 'Buku Paket & LKS (Tahunan)', 'Tahunan', 850000, 1, 5, kasAccId],
      [sditId, 'OUTING-SDIT', 'Kegiatan Outing & Rihlah', 'Sekali Bayar', 450000, 1, 6, kasAccId],
      [sditId, 'KOMITE-SDIT', 'Komite Sekolah & Majelis', 'Tahunan', 150000, 1, 7, kasAccId]
    ];

    for (const p of postsData) {
      const existing = await get(`SELECT id FROM payment_posts WHERE code = ?`, [p[1]]);
      if (!existing) {
        await run(
          `INSERT INTO payment_posts (unit_id, code, name, type, default_amount, is_active, sort_order, account_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          p
        );
      }
    }
    console.log('✅ Payment Posts created.');

    // 8. Insert Parents & Students
    const parentUser = await get(`SELECT id FROM users WHERE email = 'ortu.ahmad@gmail.com'`);
    let parentId = null;
    if (parentUser) {
      const existingParent = await get(`SELECT id FROM parents WHERE user_id = ?`, [parentUser.id]);
      if (existingParent) {
        parentId = existingParent.id;
      } else {
        const pRes = await run(
          `INSERT INTO parents (user_id, father_name, mother_name, phone, email, address)
           VALUES (?, 'Bpk. Ahmad Subagyo', 'Ibu Siti Aminah', '081298765432', 'ortu.ahmad@gmail.com', 'Jl. Merdeka No. 45, Lamongan')`,
          [parentUser.id]
        );
        parentId = pRes.id;
      }
    }

    const cls1Umar = await get(`SELECT id FROM classes WHERE name LIKE '%Umar%'`);
    const cls1AbuBakar = await get(`SELECT id FROM classes WHERE name LIKE '%Abu Bakar%'`);

    const studentsSample = [
      ['2026021001', '2026001', 'Muhammad Ali Rayyan', 'L', 'Lamongan', '2019-05-12', sditId, cls1AbuBakar?.id || 4, parentId],
      ['2026021002', '2026002', 'Khalifah Umar Al-Ghazi', 'L', 'Lamongan', '2019-06-18', sditId, cls1AbuBakar?.id || 4, null],
      ['2026021003', '2026003', 'Syakira Nabila', 'P', 'Lamongan', '2019-07-22', sditId, cls1AbuBakar?.id || 4, null],
      ['2026022001', '2026004', 'Hamzah Abdul Jabbar', 'L', 'Lamongan', '2019-04-10', sditId, cls1Umar?.id || 5, null],
      ['2026022002', '2026005', 'Zaskia Adya Mecca', 'P', 'Lamongan', '2019-08-15', sditId, cls1Umar?.id || 5, null],
      ['2026022003', '2026006', 'Fathan Mubina', 'L', 'Lamongan', '2019-09-01', sditId, cls1Umar?.id || 5, null]
    ];

    for (const st of studentsSample) {
      const existingSt = await get(`SELECT id FROM students WHERE nis = ?`, [st[0]]);
      if (!existingSt) {
        await run(
          `INSERT INTO students (nis, nisn, name, gender, pob, dob, unit_id, class_id, parent_id, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Aktif')`,
          st
        );
      }
    }
    console.log('✅ Students sample data populated.');
    console.log('🎉 Supabase PostgreSQL Data Auto-Seeding Completed Successfully!');
  } catch (err) {
    console.error('Error during Supabase auto-seeding:', err);
  }
};

module.exports = seedSupabaseData;
