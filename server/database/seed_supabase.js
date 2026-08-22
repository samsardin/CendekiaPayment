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

    // Check if database is already seeded to avoid slow repeated remote queries
    const existingUsers = await get(`SELECT COUNT(*) as count FROM users`);
    if (Number(existingUsers?.count || 0) >= 3) {
      const existingInvoices = await get(`SELECT COUNT(*) as count FROM invoices`);
      if (Number(existingInvoices?.count || 0) >= 50) {
        console.log('✅ Supabase PostgreSQL data already seeded & ready.');
        return;
      }
    }

    for (const u of usersData) {
      const existing = await get(`SELECT id FROM users WHERE email = ?`, [u[1]]);
      if (!existing) {
        await run(
          `INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)`,
          u
        );
      } else {
        await run(`UPDATE users SET password = ? WHERE id = ?`, [defaultPassword, existing.id]);
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

    const clsKB = await get(`SELECT id FROM classes WHERE name LIKE '%Kelompok Bermain%'`);
    const clsTKA = await get(`SELECT id FROM classes WHERE name LIKE '%TK-A%'`);
    const clsTKB = await get(`SELECT id FROM classes WHERE name LIKE '%TK-B%'`);
    const cls1AbuBakar = await get(`SELECT id FROM classes WHERE name LIKE '%Abu Bakar%'`);
    const cls1Umar = await get(`SELECT id FROM classes WHERE name LIKE '%Umar%'`);
    const cls2Utsman = await get(`SELECT id FROM classes WHERE name LIKE '%Utsman%'`);
    const cls3Ali = await get(`SELECT id FROM classes WHERE name LIKE '%Ali%' AND unit_id = ?`, [sditId]);

    const studentsSample = [
      // KBTK-IT Students
      ['2026011001', '2026101', 'Rayyan Al-Farizi', 'L', 'Lamongan', '2022-03-10', kbtkId, clsKB?.id || 1, null],
      ['2026011002', '2026102', 'Aisha Humaira', 'P', 'Lamongan', '2022-06-15', kbtkId, clsKB?.id || 1, null],
      ['2026012001', '2026103', 'Bilal Abdul Rahman', 'L', 'Lamongan', '2021-02-20', kbtkId, clsTKA?.id || 2, null],
      ['2026012002', '2026104', 'Maryam Salsabila', 'P', 'Lamongan', '2021-08-11', kbtkId, clsTKA?.id || 2, null],
      ['2026013001', '2026105', 'Yusuf Al-Fatih', 'L', 'Lamongan', '2020-04-05', kbtkId, clsTKB?.id || 3, null],
      ['2026013002', '2026106', 'Khadijah Azzahra', 'P', 'Lamongan', '2020-11-25', kbtkId, clsTKB?.id || 3, null],

      // SDIT Students
      ['2026021001', '2026001', 'Muhammad Ali Rayyan', 'L', 'Lamongan', '2019-05-12', sditId, cls1AbuBakar?.id || 4, parentId],
      ['2026021002', '2026002', 'Khalifah Umar Al-Ghazi', 'L', 'Lamongan', '2019-06-18', sditId, cls1AbuBakar?.id || 4, null],
      ['2026021003', '2026003', 'Syakira Nabila', 'P', 'Lamongan', '2019-07-22', sditId, cls1AbuBakar?.id || 4, null],
      ['2026022001', '2026004', 'Hamzah Abdul Jabbar', 'L', 'Lamongan', '2019-04-10', sditId, cls1Umar?.id || 5, null],
      ['2026022002', '2026005', 'Zaskia Adya Mecca', 'P', 'Lamongan', '2019-08-15', sditId, cls1Umar?.id || 5, null],
      ['2026022003', '2026006', 'Fathan Mubina', 'L', 'Lamongan', '2019-09-01', sditId, cls1Umar?.id || 5, null],
      ['2026023001', '2026007', 'Fatimah Az-Zahra Subagyo', 'P', 'Lamongan', '2018-03-21', sditId, cls2Utsman?.id || 6, null],
      ['2026023002', '2026008', 'Zaid bin Tsabit', 'L', 'Lamongan', '2018-07-14', sditId, cls2Utsman?.id || 6, null],
      ['2026024001', '2026009', 'Ibrahim Al-Khalil', 'L', 'Lamongan', '2017-02-19', sditId, cls3Ali?.id || 7, null],
      ['2026024002', '2026010', 'Sarah Nur Aini', 'P', 'Lamongan', '2017-10-30', sditId, cls3Ali?.id || 7, null]
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
    console.log('✅ Students sample data populated for all 7 classes.');

    // 9. Ensure 12-Month SPP & Non-SPP Invoices for all students
    const AY_MONTHS = [
      { code: '2026-07', due: '2026-07-10' },
      { code: '2026-08', due: '2026-08-10' },
      { code: '2026-09', due: '2026-09-10' },
      { code: '2026-10', due: '2026-10-10' },
      { code: '2026-11', due: '2026-11-10' },
      { code: '2026-12', due: '2026-12-10' },
      { code: '2027-01', due: '2027-01-10' },
      { code: '2027-02', due: '2027-02-10' },
      { code: '2027-03', due: '2027-03-10' },
      { code: '2027-04', due: '2027-04-10' },
      { code: '2027-05', due: '2027-05-10' },
      { code: '2027-06', due: '2027-06-10' }
    ];

    const allStudents = await query(`SELECT id, nis, unit_id FROM students`);
    const sppPostSdit = await get(`SELECT id, default_amount FROM payment_posts WHERE code = 'SPP-SDIT'`);
    const sppPostKbtk = await get(`SELECT id, default_amount FROM payment_posts WHERE code = 'SPP-KBTK'`);

    for (const s of allStudents) {
      const sppPost = (s.unit_id === kbtkId ? sppPostKbtk : sppPostSdit) || sppPostSdit;
      if (sppPost) {
        const nominal = Number(sppPost.default_amount || 500000);
        for (const m of AY_MONTHS) {
          const invNum = `INV/SPP/${s.nis}/${m.code.replace('-', '')}`;
          const existingInv = await get(`SELECT id FROM invoices WHERE student_id = ? AND post_id = ? AND month_period = ?`, [s.id, sppPost.id, m.code]);
          if (!existingInv) {
            await run(
              `INSERT INTO invoices (invoice_number, student_id, post_id, academic_year_id, month_period, due_date, nominal, discount_amount, paid_amount, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 'Belum Dibayar')`,
              [invNum, s.id, sppPost.id, ayId || 1, m.code, m.due, nominal]
            );
          }
        }
      }

      // Non-SPP posts
      const nonSppPosts = await query(`SELECT id, code, type, default_amount FROM payment_posts WHERE code NOT LIKE '%SPP%'`);
      for (const p of nonSppPosts) {
        const invNum = `INV/${p.code}/${s.nis}/2026`;
        const existingInv = await get(`SELECT id FROM invoices WHERE student_id = ? AND post_id = ?`, [s.id, p.id]);
        if (!existingInv) {
          await run(
            `INSERT INTO invoices (invoice_number, student_id, post_id, academic_year_id, month_period, due_date, nominal, discount_amount, paid_amount, status)
             VALUES (?, ?, ?, ?, ?, '2026-12-31', ?, 0, 0, 'Belum Dibayar')`,
            [invNum, s.id, p.id, ayId || 1, p.type, Number(p.default_amount || 0)]
          );
        }
      }
    }
    console.log('✅ Student invoices (12 months SPP + Non-SPP) populated for all students.');
    console.log('🎉 Supabase PostgreSQL Data Auto-Seeding Completed Successfully!');
  } catch (err) {
    console.error('Error during Supabase auto-seeding:', err);
  }
};

module.exports = seedSupabaseData;
