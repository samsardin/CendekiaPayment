const bcrypt = require('bcryptjs');
const { query, get, run, initDB, isPg } = require('./db');
const seedSupabaseData = require('./seed_supabase');

const seedData = async () => {
  try {
    await initDB();
    if (isPg) {
      return await seedSupabaseData();
    }

    console.log('🌱 Starting Comprehensive Seeding Process for Cendekia Lamongan SFMS...');

    // Hash password for demo accounts
    const defaultPassword = await bcrypt.hash('password123', 10);

    // 1. Seed Users
    const users = [
      { name: 'Superadmin Cendekia', email: 'superadmin@cendekia.sch.id', phone: '081234567890', role: 'superadmin' },
      { name: 'Admin Keuangan (Ustadzah Rahma)', email: 'admin@cendekia.sch.id', phone: '081234567891', role: 'admin' },
      { name: 'Kasir Utama (Ustadz Hendra)', email: 'kasir@cendekia.sch.id', phone: '081234567892', role: 'kasir' },
      { name: 'Wali Murid - Bpk. Ahmad Subagyo', email: 'ortu.ahmad@gmail.com', phone: '081299887766', role: 'ortu' },
      { name: 'Wali Murid - Ibu Fatimah Azzahra', email: 'ortu.fatimah@gmail.com', phone: '081233445566', role: 'ortu' }
    ];

    for (const u of users) {
      const existing = await get(`SELECT id FROM users WHERE email = ?`, [u.email]);
      if (!existing) {
        await run(
          `INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)`,
          [u.name, u.email, u.phone, defaultPassword, u.role]
        );
      } else {
        await run(`UPDATE users SET password = ? WHERE id = ?`, [defaultPassword, existing.id]);
      }
    }

    // 2. Academic Years
    const existingAY = await get(`SELECT id FROM academic_years WHERE name = '2026/2027'`);
    let ayActiveId = 1;
    if (!existingAY) {
      const res1 = await run(`INSERT INTO academic_years (name, is_active, start_date, end_date) VALUES ('2025/2026', 0, '2025-07-01', '2026-06-30')`);
      const res2 = await run(`INSERT INTO academic_years (name, is_active, start_date, end_date) VALUES ('2026/2027', 1, '2026-07-01', '2027-06-30')`);
      ayActiveId = res2.id;
    } else {
      ayActiveId = existingAY.id;
    }

    // 3. Units
    const units = [
      { code: 'KBTK', name: 'KBTK-IT Cendekia' },
      { code: 'SDIT', name: 'SDIT Cendekia' }
    ];
    let kbtkUnitId = 1, sditUnitId = 2;
    for (const un of units) {
      const existing = await get(`SELECT id FROM units WHERE code = ?`, [un.code]);
      if (!existing) {
        const res = await run(`INSERT INTO units (code, name) VALUES (?, ?)`, [un.code, un.name]);
        if (un.code === 'KBTK') kbtkUnitId = res.id;
        if (un.code === 'SDIT') sditUnitId = res.id;
      } else {
        if (un.code === 'KBTK') kbtkUnitId = existing.id;
        if (un.code === 'SDIT') sditUnitId = existing.id;
      }
    }

    // 4. Classes
    const classes = [
      { unit_id: kbtkUnitId, name: 'Kelompok Bermain (KB)', teacher: 'Ustz. Aisyah, S.Pd', capacity: 20 },
      { unit_id: kbtkUnitId, name: 'TK-A Bintang', teacher: 'Ustz. Khadijah, S.Pd', capacity: 25 },
      { unit_id: kbtkUnitId, name: 'TK-B Bulan', teacher: 'Ustz. Maryam, S.Pd', capacity: 25 },
      { unit_id: sditUnitId, name: 'Kelas 1 Abu Bakar', teacher: 'Ust. Ali Imran, S.Pd.I', capacity: 28 },
      { unit_id: sditUnitId, name: 'Kelas 1 Umar', teacher: 'Ustz. Halimah, S.Pd', capacity: 28 },
      { unit_id: sditUnitId, name: 'Kelas 2 Utsman', teacher: 'Ust. Mahmud, S.Pd', capacity: 30 },
      { unit_id: sditUnitId, name: 'Kelas 3 Ali', teacher: 'Ustz. Nur, S.Si', capacity: 30 }
    ];

    let classIds = {};
    for (const cl of classes) {
      const existing = await get(`SELECT id FROM classes WHERE unit_id = ? AND name = ?`, [cl.unit_id, cl.name]);
      if (!existing) {
        const res = await run(
          `INSERT INTO classes (unit_id, name, homeroom_teacher, capacity) VALUES (?, ?, ?, ?)`,
          [cl.unit_id, cl.name, cl.teacher, cl.capacity]
        );
        classIds[cl.name] = res.id;
      } else {
        classIds[cl.name] = existing.id;
      }
    }

    // 5. Parents
    const parentAhmad = await get(`SELECT id FROM users WHERE email = 'ortu.ahmad@gmail.com'`);
    const parentFatimah = await get(`SELECT id FROM users WHERE email = 'ortu.fatimah@gmail.com'`);

    let p1Id = 1, p2Id = 2;
    const existingP1 = await get(`SELECT id FROM parents WHERE father_name = 'Bpk. Ahmad Subagyo'`);
    if (!existingP1) {
      const r1 = await run(
        `INSERT INTO parents (user_id, father_name, mother_name, phone, email, address) VALUES (?, ?, ?, ?, ?, ?)`,
        [parentAhmad ? parentAhmad.id : null, 'Bpk. Ahmad Subagyo', 'Ibu Nurul Hidayah', '081299887766', 'ortu.ahmad@gmail.com', 'Jl. Sunan Giri No. 12, Lamongan']
      );
      p1Id = r1.id;
    } else {
      p1Id = existingP1.id;
    }

    const existingP2 = await get(`SELECT id FROM parents WHERE father_name = 'Bpk. Rizky Pratama'`);
    if (!existingP2) {
      const r2 = await run(
        `INSERT INTO parents (user_id, father_name, mother_name, phone, email, address) VALUES (?, ?, ?, ?, ?, ?)`,
        [parentFatimah ? parentFatimah.id : null, 'Bpk. Rizky Pratama', 'Ibu Fatimah Azzahra', '081233445566', 'ortu.fatimah@gmail.com', 'Jl. Veteran No. 45, Lamongan']
      );
      p2Id = r2.id;
    } else {
      p2Id = existingP2.id;
    }

    // 6. Accounts (Chart of Accounts & Cash/Bank Accounts)
    const accountsData = [
      { code: '101.01', name: 'Kas Utama Sekolah', type: 'Kas', parent_id: null, balance: 18500000.0 },
      { code: '101.02', name: 'Bank BCA (Yayasan Cendekia)', type: 'Bank', parent_id: null, balance: 64200000.0 },
      { code: '101.03', name: 'Bank BSI (Operasional)', type: 'Bank', parent_id: null, balance: 35000000.0 },
      { code: '102.01', name: 'Payment Gateway Clearing', type: 'Bank', parent_id: null, balance: 4500000.0 },
      { code: '400.00', name: 'Total Biaya Pendidikan', type: 'Gabungan', parent_id: null, balance: 125000000.0 },
      { code: '401.00', name: 'Total Infaq Pembangunan', type: 'Gabungan', parent_id: null, balance: 48000000.0 },
      { code: '402.01', name: 'Biaya Perlengkapan KBTK', type: 'Pendapatan', parent_id: null, balance: 12000000.0 },
      { code: '402.02', name: 'Biaya Perlengkapan SDIT', type: 'Pendapatan', parent_id: null, balance: 28000000.0 },
      { code: '403.01', name: 'Seragam KBTK', type: 'Pendapatan', parent_id: null, balance: 9500000.0 },
      { code: '403.02', name: 'Seragam SDIT', type: 'Pendapatan', parent_id: null, balance: 22000000.0 },
      { code: '404.01', name: 'Outing / Fieldtrip', type: 'Pendapatan', parent_id: null, balance: 8500000.0 },
      { code: '405.01', name: 'Ekskul SDIT', type: 'Pendapatan', parent_id: null, balance: 6200000.0 },
      { code: '500.01', name: 'Gaji Pegawai & Guru', type: 'Pengeluaran', parent_id: null, balance: 42000000.0 },
      { code: '500.02', name: 'Dapur & Konsumsi Cendekia', type: 'Pengeluaran', parent_id: null, balance: 8500000.0 },
      { code: '500.03', name: 'Listrik & Internet', type: 'Pengeluaran', parent_id: null, balance: 3400000.0 },
      { code: '500.04', name: 'Pemeliharaan Sarpras', type: 'Pengeluaran', parent_id: null, balance: 6100000.0 }
    ];

    let accountMap = {};
    for (const acc of accountsData) {
      const existing = await get(`SELECT id FROM accounts WHERE code = ?`, [acc.code]);
      if (!existing) {
        const res = await run(
          `INSERT INTO accounts (code, name, type, parent_id, balance) VALUES (?, ?, ?, ?, ?)`,
          [acc.code, acc.name, acc.type, acc.parent_id, acc.balance]
        );
        accountMap[acc.code] = res.id;
      } else {
        accountMap[acc.code] = existing.id;
      }
    }

    // 7. Payment Posts (Master Pos Pembayaran)
    const postsData = [
      { unit_id: kbtkUnitId, code: 'POS-KBTK-SPP', name: 'Biaya Pendidikan KBTK (SPP)', type: 'Bulanan', amount: 350000, sort: 1, accCode: '400.00' },
      { unit_id: kbtkUnitId, code: 'POS-KBTK-LKP', name: 'Biaya Perlengkapan KBTK', type: 'Tahunan', amount: 1200000, sort: 2, accCode: '402.01' },
      { unit_id: kbtkUnitId, code: 'POS-KBTK-OTG', name: 'Biaya Outing KBTK', type: 'Tahunan', amount: 450000, sort: 3, accCode: '404.01' },
      { unit_id: kbtkUnitId, code: 'POS-KBTK-SRG', name: 'Biaya Seragam KBTK', type: 'Tahunan', amount: 850000, sort: 4, accCode: '403.01' },
      { unit_id: kbtkUnitId, code: 'POS-KBTK-KOM', name: 'Uang Komite KBTK', type: 'Tahunan', amount: 50000, sort: 5, accCode: '400.00' },
      { unit_id: kbtkUnitId, code: 'POS-KBTK-INF', name: 'Infaq Pembangunan KBTK', type: 'Angsuran', amount: 3500000, sort: 6, accCode: '401.00' },

      { unit_id: sditUnitId, code: 'POS-SDIT-SPP', name: 'Biaya Pendidikan SDIT (SPP)', type: 'Bulanan', amount: 500000, sort: 1, accCode: '400.00' },
      { unit_id: sditUnitId, code: 'POS-SDIT-LKP', name: 'Biaya Perlengkapan SDIT', type: 'Tahunan', amount: 1800000, sort: 2, accCode: '402.02' },
      { unit_id: sditUnitId, code: 'POS-SDIT-OTG', name: 'Biaya Outing SDIT', type: 'Tahunan', amount: 600000, sort: 3, accCode: '404.01' },
      { unit_id: sditUnitId, code: 'POS-SDIT-SRG', name: 'Biaya Seragam SDIT', type: 'Tahunan', amount: 1250000, sort: 4, accCode: '403.02' },
      { unit_id: sditUnitId, code: 'POS-SDIT-EKS', name: 'Biaya Ekskul SDIT', type: 'Tahunan', amount: 350000, sort: 5, accCode: '405.01' },
      { unit_id: sditUnitId, code: 'POS-SDIT-KOM', name: 'Iuran Komite SDIT', type: 'Tahunan', amount: 60000, sort: 6, accCode: '400.00' },
      { unit_id: sditUnitId, code: 'POS-SDIT-INF', name: 'Infaq Pembangunan SDIT', type: 'Angsuran', amount: 5000000, sort: 7, accCode: '401.00' }
    ];

    let postMap = {};
    for (const p of postsData) {
      const existing = await get(`SELECT id FROM payment_posts WHERE code = ?`, [p.code]);
      const accId = accountMap[p.accCode] || null;
      if (!existing) {
        const res = await run(
          `INSERT INTO payment_posts (unit_id, code, name, type, default_amount, is_active, sort_order, account_id) VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
          [p.unit_id, p.code, p.name, p.type, p.amount, p.sort, accId]
        );
        postMap[p.code] = res.id;
      } else {
        postMap[p.code] = existing.id;
      }
    }

    // 8. Generate 10+ Students per Class (Total 70+ Students for Cendekia Lamongan)
    const dummyClasses = [
      {
        className: 'Kelompok Bermain (KB)',
        unitId: kbtkUnitId,
        prefix: '2026011',
        students: [
          { name: 'Rayyan Al-Faris', gender: 'L', pob: 'Lamongan', dob: '2021-04-12' },
          { name: 'Azahra Humaira', gender: 'P', pob: 'Lamongan', dob: '2021-02-18' },
          { name: 'Mikaila Hafizah', gender: 'P', pob: 'Lamongan', dob: '2021-06-05' },
          { name: 'Dzaky Hafizh', gender: 'L', pob: 'Gresik', dob: '2021-01-20' },
          { name: 'Arka Kenzie Pratama', gender: 'L', pob: 'Surabaya', dob: '2021-08-14' },
          { name: 'Naura Zhafira', gender: 'P', pob: 'Lamongan', dob: '2021-03-30' },
          { name: 'Zayn Malik Al-Ghazali', gender: 'L', pob: 'Lamongan', dob: '2021-05-11' },
          { name: 'Shanum Almahyra', gender: 'P', pob: 'Tuban', dob: '2021-07-22' },
          { name: 'Kenzo Hafiz Abhinaya', gender: 'L', pob: 'Lamongan', dob: '2021-09-01' },
          { name: 'Aqila Hasna Kamila', gender: 'P', pob: 'Lamongan', dob: '2021-10-15' }
        ]
      },
      {
        className: 'TK-A Bintang',
        unitId: kbtkUnitId,
        prefix: '2026012',
        students: [
          { name: 'Aisha Ayudia Inara', gender: 'P', pob: 'Lamongan', dob: '2020-02-10' },
          { name: 'Muhammad Al-Kahfi', gender: 'L', pob: 'Lamongan', dob: '2020-05-04' },
          { name: 'Bilal Ramadhan', gender: 'L', pob: 'Gresik', dob: '2020-04-25' },
          { name: 'Syakir Daulay', gender: 'L', pob: 'Lamongan', dob: '2020-01-19' },
          { name: 'Hana Humaira Azzahra', gender: 'P', pob: 'Lamongan', dob: '2020-07-12' },
          { name: 'Yusuf Al-Qardhawi', gender: 'L', pob: 'Surabaya', dob: '2020-08-30' },
          { name: 'Qonita Azzahra', gender: 'P', pob: 'Lamongan', dob: '2020-03-14' },
          { name: 'Fathan Al-Ghazi', gender: 'L', pob: 'Tuban', dob: '2020-09-27' },
          { name: 'Annisa Zhafira', gender: 'P', pob: 'Lamongan', dob: '2020-11-08' },
          { name: 'Rasya Pratama', gender: 'L', pob: 'Lamongan', dob: '2020-12-01' }
        ]
      },
      {
        className: 'TK-B Bulan',
        unitId: kbtkUnitId,
        prefix: '2026013',
        students: [
          { name: 'Muhammad Ahmad Al-Fatih', gender: 'L', pob: 'Lamongan', dob: '2019-05-14' },
          { name: 'Maryam Al-Batul', gender: 'P', pob: 'Lamongan', dob: '2019-03-22' },
          { name: 'Fadhil Rizky', gender: 'L', pob: 'Lamongan', dob: '2019-08-11' },
          { name: 'Aila Nisa', gender: 'P', pob: 'Surabaya', dob: '2019-01-05' },
          { name: 'Zidan Omar Al-Farisi', gender: 'L', pob: 'Gresik', dob: '2019-07-19' },
          { name: 'Kirana Larasati', gender: 'P', pob: 'Lamongan', dob: '2019-09-14' },
          { name: 'Omar Khalfan', gender: 'L', pob: 'Lamongan', dob: '2019-04-03' },
          { name: 'Sabrina Zhafarina', gender: 'P', pob: 'Lamongan', dob: '2019-11-28' },
          { name: 'Faris Hibatullah', gender: 'L', pob: 'Tuban', dob: '2019-06-17' },
          { name: 'Nabila Sakhi', gender: 'P', pob: 'Lamongan', dob: '2019-10-09' }
        ]
      },
      {
        className: 'Kelas 1 Abu Bakar',
        unitId: sditUnitId,
        prefix: '2026021',
        students: [
          { name: 'Muhammad Ali Rayyan', gender: 'L', pob: 'Surabaya', dob: '2018-09-22' },
          { name: 'Khalifah Umar Al-Ghazi', gender: 'L', pob: 'Lamongan', dob: '2018-02-14' },
          { name: 'Syakira Nabila', gender: 'P', pob: 'Lamongan', dob: '2018-05-30' },
          { name: 'Sultan Pasha', gender: 'L', pob: 'Gresik', dob: '2018-07-08' },
          { name: 'Alya Mukhbita', gender: 'P', pob: 'Lamongan', dob: '2018-01-25' },
          { name: 'Rafif Hamizan', gender: 'L', pob: 'Lamongan', dob: '2018-11-19' },
          { name: 'Kaylah Az-Zahra', gender: 'P', pob: 'Lamongan', dob: '2018-04-16' },
          { name: 'Zhafran Khairy', gender: 'L', pob: 'Tuban', dob: '2018-08-02' },
          { name: 'Medina Safiyyah', gender: 'P', pob: 'Lamongan', dob: '2018-10-12' },
          { name: 'Arkana Rizky Pratama', gender: 'L', pob: 'Surabaya', dob: '2018-06-21' }
        ]
      },
      {
        className: 'Kelas 1 Umar',
        unitId: sditUnitId,
        prefix: '2026022',
        students: [
          { name: 'Hamzah Abdul Jabbar', gender: 'L', pob: 'Lamongan', dob: '2018-03-17' },
          { name: 'Zaskia Adya Mecca', gender: 'P', pob: 'Lamongan', dob: '2018-07-29' },
          { name: 'Fathan Mubina', gender: 'L', pob: 'Lamongan', dob: '2018-09-05' },
          { name: 'Talita Zhafira', gender: 'P', pob: 'Gresik', dob: '2018-12-14' },
          { name: 'Reyhan Al-Ghifari', gender: 'L', pob: 'Lamongan', dob: '2018-02-08' },
          { name: 'Naura Hafizah', gender: 'P', pob: 'Lamongan', dob: '2018-04-19' },
          { name: 'Gibran Al-Farabi', gender: 'L', pob: 'Surabaya', dob: '2018-06-30' },
          { name: 'Salma Al-Aqila', gender: 'P', pob: 'Tuban', dob: '2018-08-11' },
          { name: 'Zaydan Ahmad', gender: 'L', pob: 'Lamongan', dob: '2018-10-04' },
          { name: 'Calista Humaira', gender: 'P', pob: 'Lamongan', dob: '2018-11-23' }
        ]
      },
      {
        className: 'Kelas 2 Utsman',
        unitId: sditUnitId,
        prefix: '2026023',
        students: [
          { name: 'Fatimah Az-Zahra Subagyo', gender: 'P', pob: 'Lamongan', dob: '2017-11-05' },
          { name: 'Salman Al-Farisi', gender: 'L', pob: 'Lamongan', dob: '2017-01-14' },
          { name: 'Aisyah Aqilah', gender: 'P', pob: 'Lamongan', dob: '2017-04-20' },
          { name: 'Danial Rizky', gender: 'L', pob: 'Gresik', dob: '2017-06-15' },
          { name: 'Zahra Nur Aini', gender: 'P', pob: 'Lamongan', dob: '2017-08-09' },
          { name: 'Ammar Zoni Al-Hafiz', gender: 'L', pob: 'Surabaya', dob: '2017-09-28' },
          { name: 'Keisha Zafira', gender: 'P', pob: 'Lamongan', dob: '2017-02-03' },
          { name: 'Faizul Anwar', gender: 'L', pob: 'Tuban', dob: '2017-05-18' },
          { name: 'Rania Salsabila', gender: 'P', pob: 'Lamongan', dob: '2017-07-27' },
          { name: 'Haikal Kamil Pratama', gender: 'L', pob: 'Lamongan', dob: '2017-10-31' }
        ]
      },
      {
        className: 'Kelas 3 Ali',
        unitId: sditUnitId,
        prefix: '2026024',
        students: [
          { name: 'Ibrahim Zhafran Pratama', gender: 'L', pob: 'Gresik', dob: '2016-04-18' },
          { name: 'Khadijah Azzahra', gender: 'P', pob: 'Lamongan', dob: '2016-02-11' },
          { name: 'Tariq Ziyad', gender: 'L', pob: 'Lamongan', dob: '2016-05-24' },
          { name: 'Safiyyah Medina', gender: 'P', pob: 'Lamongan', dob: '2016-07-03' },
          { name: 'Khalid Basalamah Al-Qadri', gender: 'L', pob: 'Surabaya', dob: '2016-09-16' },
          { name: 'Nurul Hidayah', gender: 'P', pob: 'Tuban', dob: '2016-01-30' },
          { name: 'Adnan Al-Kautsar', gender: 'L', pob: 'Lamongan', dob: '2016-08-12' },
          { name: 'Thalia Nabila', gender: 'P', pob: 'Lamongan', dob: '2016-10-05' },
          { name: 'Farhan Al-Majid', gender: 'L', pob: 'Lamongan', dob: '2016-11-20' },
          { name: 'Dzakiya Talita Humaira', gender: 'P', pob: 'Lamongan', dob: '2016-12-15' }
        ]
      }
    ];

    let allStudents = [];
    for (const group of dummyClasses) {
      const cId = classIds[group.className];
      let idx = 1;
      for (const st of group.students) {
        const nis = `${group.prefix}${idx.toString().padStart(3, '0')}`;
        const nisn = `00${nis}`;
        idx++;

        const existing = await get(`SELECT id FROM students WHERE nis = ?`, [nis]);
        let studentId;
        if (!existing) {
          const res = await run(
            `INSERT INTO students (nis, nisn, name, gender, pob, dob, address, unit_id, class_id, parent_id, status)
             VALUES (?, ?, ?, ?, ?, ?, 'Lamongan', ?, ?, ?, 'Aktif')`,
            [nis, nisn, st.name, st.gender, st.pob, st.dob, group.unitId, cId, (idx % 2 === 0 ? p1Id : p2Id)]
          );
          studentId = res.id;
        } else {
          studentId = existing.id;
          await run(`UPDATE students SET class_id = ?, unit_id = ?, status = 'Aktif' WHERE id = ?`, [cId, group.unitId, existing.id]);
        }
        allStudents.push({ id: studentId, nis, name: st.name, unitId: group.unitId, classId: cId });
      }
    }

    console.log(`✅ Seeded ${allStudents.length} students across 7 classes!`);

    // 9. Auto-Generate Invoices for ALL 70+ Students
    for (const st of allStudents) {
      const isSdit = st.unitId === sditUnitId;
      const sppPostId = isSdit ? postMap['POS-SDIT-SPP'] : postMap['POS-KBTK-SPP'];
      const defaultSppNominal = isSdit ? 500000 : 350000;

      // Generate SPP Juli 2026 (Mostly Paid)
      const invJulNum = `INV/SPP/${st.nis}/202607`;
      let invJul = await get(`SELECT id FROM invoices WHERE invoice_number = ?`, [invJulNum]);
      if (!invJul) {
        const isPaid = (st.id % 4 !== 0); // 75% paid
        const paidAmount = isPaid ? defaultSppNominal : 0;
        const status = isPaid ? 'Lunas' : 'Belum Dibayar';

        const r = await run(
          `INSERT INTO invoices (invoice_number, student_id, post_id, academic_year_id, month_period, due_date, nominal, discount_amount, paid_amount, status)
           VALUES (?, ?, ?, ?, '2026-07', '2026-07-10', ?, 0, ?, ?)`,
          [invJulNum, st.id, sppPostId, ayActiveId, defaultSppNominal, paidAmount, status]
        );
        invJul = { id: r.id };

        if (isPaid) {
          const txnNum = `TXN/202607/${st.id}`;
          await run(
            `INSERT INTO payments (transaction_number, invoice_id, student_id, cashier_id, amount, payment_method, payment_gateway_ref, status, payment_date, notes)
             VALUES (?, ?, ?, 3, ?, 'Cash', 'CASH-REF', 'Paid', '2026-07-08 10:00:00', 'Pembayaran SPP Juli')`,
            [txnNum, invJul.id, st.id, defaultSppNominal]
          );
        }
      }

      // Generate SPP Agustus 2026 (Pending/Partial/Lunas)
      const invAugNum = `INV/SPP/${st.nis}/202608`;
      let invAug = await get(`SELECT id FROM invoices WHERE invoice_number = ?`, [invAugNum]);
      if (!invAug) {
        let paidAmt = 0;
        let status = 'Belum Dibayar';

        if (st.id % 3 === 0) {
          paidAmt = defaultSppNominal;
          status = 'Lunas';
        } else {
          paidAmt = 0;
          status = 'Belum Dibayar';
        }

        const r = await run(
          `INSERT INTO invoices (invoice_number, student_id, post_id, academic_year_id, month_period, due_date, nominal, discount_amount, paid_amount, status)
           VALUES (?, ?, ?, ?, '2026-08', '2026-08-10', ?, 0, ?, ?)`,
          [invAugNum, st.id, sppPostId, ayActiveId, defaultSppNominal, paidAmt, status]
        );
        invAug = { id: r.id };

        if (paidAmt > 0) {
          const txnNum = `TXN/202608/${st.id}`;
          await run(
            `INSERT INTO payments (transaction_number, invoice_id, student_id, cashier_id, amount, payment_method, payment_gateway_ref, status, payment_date, notes)
             VALUES (?, ?, ?, 3, ?, 'QRIS', 'QRIS-PG', 'Paid', '2026-08-05 11:30:00', 'Pembayaran SPP Agustus')`,
            [txnNum, invAug.id, st.id, paidAmt]
          );
        }
      }

      // Generate Seragam / Perlengkapan Invoice for SDIT & KBTK
      const seragamPostId = isSdit ? postMap['POS-SDIT-SRG'] : postMap['POS-KBTK-SRG'];
      const seragamNominal = isSdit ? 1250000 : 850000;
      const invSrgNum = `INV/SRG/${st.nis}/2026`;
      let invSrg = await get(`SELECT id FROM invoices WHERE invoice_number = ?`, [invSrgNum]);
      if (!invSrg) {
        await run(
          `INSERT INTO invoices (invoice_number, student_id, post_id, academic_year_id, month_period, due_date, nominal, discount_amount, paid_amount, status)
           VALUES (?, ?, ?, ?, 'Tahunan', '2026-12-31', ?, 0, 0, 'Belum Dibayar')`,
          [invSrgNum, st.id, seragamPostId, ayActiveId, seragamNominal]
        );
      }
    }

    console.log('✅ Invoices & Payments generated for all 70+ students!');

    // 10. Sample Expenses (Pengeluaran Sekolah)
    const exp1 = await get(`SELECT id FROM expenses WHERE expense_number = 'VCH-202608-001'`);
    if (!exp1) {
      await run(
        `INSERT INTO expenses (expense_number, account_id, category, title, amount, date, status, notes, approved_by) VALUES (?, ?, 'Gaji Pegawai', 'Gaji Ustadz & Ustadzah Bulan Juli 2026', 24500000, '2026-08-01', 'Approved', '/uploads/nota-gaji.pdf', 1)`,
        ['VCH-202608-001', accountMap['500.01']]
      );
      await run(
        `INSERT INTO expenses (expense_number, account_id, category, title, amount, date, status, notes, approved_by) VALUES (?, ?, 'Dapur Cendekia', 'Belanja Bahan Dapur & Catering Rapat Guru', 1850000, '2026-08-12', 'Approved', '/uploads/nota-dapur.jpg', 1)`,
        ['VCH-202608-002', accountMap['500.02']]
      );
      await run(
        `INSERT INTO expenses (expense_number, account_id, category, title, amount, date, status, notes, approved_by) VALUES (?, ?, 'Listrik & Internet', 'Tagihan Indihome & PLN Sekolah', 1200000, '2026-08-18', 'Approved', '/uploads/nota-pln.pdf', 1)`,
        ['VCH-202608-003', accountMap['500.03']]
      );
    }

    // 11. Sample Audit Logs
    const auditCount = await get(`SELECT COUNT(*) as count FROM audit_logs`);
    if (auditCount.count === 0) {
      await run(
        `INSERT INTO audit_logs (user_id, user_name, user_role, action, module, details, ip_address) VALUES (1, 'Superadmin Cendekia', 'superadmin', 'INITIALIZE_SYSTEM', 'SYSTEM', 'Sistem Manajemen Keuangan Sekolah Cendekia diinisialisasi', '127.0.0.1')`
      );
      await run(
        `INSERT INTO audit_logs (user_id, user_name, user_role, action, module, details, ip_address) VALUES (2, 'Admin Keuangan (Ustadzah Rahma)', 'admin', 'GENERATE_INVOICE', 'TAGIHAN', 'Generate Tagihan 70 Siswa Cendekia', '127.0.0.1')`
      );
      await run(
        `INSERT INTO audit_logs (user_id, user_name, user_role, action, module, details, ip_address) VALUES (3, 'Kasir Utama (Ustadz Hendra)', 'kasir', 'PAYMENT_RECEIVED', 'PEMBAYARAN', 'Terima pembayaran SPP via Kasir POS', '127.0.0.1')`
      );
    }

    console.log('✅ Comprehensive seeding completed successfully!');
  } catch (err) {
    console.error('❌ Seeding error:', err);
  }
};

if (require.main === module) {
  seedData();
}

module.exports = seedData;
