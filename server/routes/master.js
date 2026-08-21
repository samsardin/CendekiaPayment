const express = require('express');
const router = express.Router();
const { query, get, run } = require('../database/db');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const { logAudit } = require('../middleware/auditMiddleware');

// === Academic Years ===
router.get('/academic-years', verifyToken, async (req, res) => {
  try {
    const data = await query(`SELECT * FROM academic_years ORDER BY id DESC`);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/academic-years', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    const { name, start_date, end_date } = req.body;
    const result = await run(
      `INSERT INTO academic_years (name, is_active, start_date, end_date) VALUES (?, 0, ?, ?)`,
      [name, start_date, end_date]
    );
    await logAudit(req.user.id, req.user.name, req.user.role, 'CREATE_ACADEMIC_YEAR', 'MASTER', `Menambah tahun ajaran ${name}`, req);
    res.json({ success: true, id: result.id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/academic-years/:id/activate', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    // BR-001: Hanya satu Tahun Ajaran yang aktif
    await run(`UPDATE academic_years SET is_active = 0`);
    await run(`UPDATE academic_years SET is_active = 1 WHERE id = ?`, [id]);
    await logAudit(req.user.id, req.user.name, req.user.role, 'ACTIVATE_ACADEMIC_YEAR', 'MASTER', `Mengaktifkan tahun ajaran ID ${id}`, req);
    res.json({ success: true, message: 'Tahun ajaran berhasil diaktifkan' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// === Units ===
router.get('/units', verifyToken, async (req, res) => {
  try {
    let data = await query(`SELECT * FROM units ORDER BY id ASC`);
    if (!data || data.length === 0) {
      const seedData = require('../database/seed');
      await seedData();
      data = await query(`SELECT * FROM units ORDER BY id ASC`);
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// === Classes ===
router.get('/classes', verifyToken, async (req, res) => {
  try {
    const { unit_id } = req.query;
    let sql = `SELECT c.*, u.name as unit_name FROM classes c JOIN units u ON c.unit_id = u.id`;
    let params = [];
    if (unit_id) {
      sql += ` WHERE (c.unit_id = ? OR c.unit_id = ?)`;
      params.push(unit_id, parseInt(unit_id) || unit_id);
    }
    sql += ` ORDER BY c.unit_id ASC, c.name ASC`;
    let data = await query(sql, params);
    if (!data || data.length === 0) {
      const seedData = require('../database/seed');
      await seedData();
      data = await query(sql, params);
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/classes', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    const { unit_id, name, homeroom_teacher, capacity } = req.body;
    const result = await run(
      `INSERT INTO classes (unit_id, name, homeroom_teacher, capacity) VALUES (?, ?, ?, ?)`,
      [unit_id, name, homeroom_teacher, capacity || 30]
    );
    await logAudit(req.user.id, req.user.name, req.user.role, 'CREATE_CLASS', 'MASTER', `Menambah kelas ${name}`, req);
    res.json({ success: true, id: result.id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// === Parents ===
router.get('/parents', verifyToken, async (req, res) => {
  try {
    const data = await query(`SELECT * FROM parents ORDER BY father_name ASC`);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/parents', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    const { father_name, mother_name, phone, email, address } = req.body;
    const result = await run(
      `INSERT INTO parents (father_name, mother_name, phone, email, address) VALUES (?, ?, ?, ?, ?)`,
      [father_name, mother_name, phone, email, address]
    );
    res.json({ success: true, id: result.id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// === Students ===
router.get('/students', verifyToken, async (req, res) => {
  try {
    const { unit_id, class_id, search, status } = req.query;
    let sql = `
      SELECT s.*, u.name as unit_name, u.code as unit_code, c.name as class_name, 
             p.father_name, p.mother_name, p.phone as parent_phone
      FROM students s
      JOIN units u ON s.unit_id = u.id
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN parents p ON s.parent_id = p.id
      WHERE 1=1
    `;
    let params = [];

    if (unit_id) {
      sql += ` AND (s.unit_id = ? OR s.unit_id = ?)`;
      params.push(unit_id, parseInt(unit_id) || unit_id);
    }
    if (class_id) {
      sql += ` AND (s.class_id = ? OR s.class_id = ? OR c.id = ? OR c.name LIKE ?)`;
      params.push(class_id, parseInt(class_id) || class_id, parseInt(class_id) || class_id, `%${class_id}%`);
    }
    if (status) {
      sql += ` AND s.status = ?`;
      params.push(status);
    }
    if (search) {
      sql += ` AND (s.name LIKE ? OR s.nis LIKE ? OR s.nisn LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY s.name ASC`;
    let data = await query(sql, params);
    if (!data || data.length === 0) {
      const seedData = require('../database/seed');
      await seedData();
      data = await query(sql, params);
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/students/:id', verifyToken, async (req, res) => {
  try {
    const student = await get(
      `SELECT s.*, u.name as unit_name, c.name as class_name, p.father_name, p.mother_name, p.phone as parent_phone, p.address as parent_address
       FROM students s
       JOIN units u ON s.unit_id = u.id
       JOIN classes c ON s.class_id = c.id
       LEFT JOIN parents p ON s.parent_id = p.id
       WHERE s.id = ?`,
      [req.params.id]
    );

    if (!student) return res.status(404).json({ success: false, error: 'ERR-002: Siswa tidak ditemukan' });

    // Fetch discounts
    const discounts = await query(
      `SELECT d.*, pp.name as post_name FROM discounts d JOIN payment_posts pp ON d.post_id = pp.id WHERE d.student_id = ?`,
      [student.id]
    );

    res.json({ success: true, data: { ...student, discounts } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/students', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    const { nis, nisn, name, gender, pob, dob, address, unit_id, class_id, parent_id } = req.body;

    // Check unique NIS
    const existingNis = await get(`SELECT id FROM students WHERE nis = ?`, [nis]);
    if (existingNis) {
      return res.status(400).json({ success: false, error: 'NIS sudah terdaftar dalam sistem' });
    }

    const result = await run(
      `INSERT INTO students (nis, nisn, name, gender, pob, dob, address, unit_id, class_id, parent_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Aktif')`,
      [nis, nisn, name, gender, pob, dob, address, unit_id, class_id, parent_id]
    );

    await logAudit(req.user.id, req.user.name, req.user.role, 'CREATE_STUDENT', 'SISWA', `Menambah siswa baru: ${name} (NIS: ${nis})`, req);
    res.json({ success: true, id: result.id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/students/:id/mutation', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, target_class_id } = req.body; // status: 'Aktif', 'Pindah', 'Lulus', 'Keluar'

    if (!['Aktif', 'Pindah', 'Lulus', 'Keluar'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status mutasi tidak valid' });
    }

    if (target_class_id) {
      await run(`UPDATE students SET status = ?, class_id = ? WHERE id = ?`, [status, target_class_id, id]);
    } else {
      await run(`UPDATE students SET status = ? WHERE id = ?`, [status, id]);
    }

    const student = await get(`SELECT name FROM students WHERE id = ?`, [id]);
    await logAudit(req.user.id, req.user.name, req.user.role, 'MUTATION_STUDENT', 'SISWA', `Mutasi siswa ${student?.name} menjadi status: ${status}`, req);

    res.json({ success: true, message: 'Status mutasi siswa berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Edit / Update Student Details
router.put('/students/:id', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nis, nisn, name, gender, pob, dob, address, unit_id, class_id, status, father_name, phone } = req.body;

    const student = await get(`SELECT * FROM students WHERE id = ?`, [id]);
    if (!student) return res.status(404).json({ success: false, error: 'Siswa tidak ditemukan' });

    if (nis && nis !== student.nis) {
      const existingNis = await get(`SELECT id FROM students WHERE nis = ? AND id != ?`, [nis, id]);
      if (existingNis) {
        return res.status(400).json({ success: false, error: 'NIS sudah terdaftar untuk siswa lain' });
      }
    }

    await run(
      `UPDATE students 
       SET nis = ?, nisn = ?, name = ?, gender = ?, pob = ?, dob = ?, address = ?, unit_id = ?, class_id = ?, status = ?
       WHERE id = ?`,
      [
        nis || student.nis,
        nisn !== undefined ? nisn : student.nisn,
        name || student.name,
        gender || student.gender,
        pob || student.pob,
        dob || student.dob,
        address || student.address,
        unit_id || student.unit_id,
        class_id || student.class_id,
        status || student.status,
        id
      ]
    );

    if (student.parent_id && (father_name || phone)) {
      await run(
        `UPDATE parents SET father_name = COALESCE(?, father_name), phone = COALESCE(?, phone) WHERE id = ?`,
        [father_name, phone, student.parent_id]
      );
    }

    await logAudit(
      req.user.id,
      req.user.name,
      req.user.role,
      'UPDATE_STUDENT',
      'SISWA',
      `Memperbarui data siswa: ${name || student.name} (NIS: ${nis || student.nis})`,
      req
    );

    res.json({ success: true, message: 'Data siswa berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete Student
router.delete('/students/:id', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const student = await get(`SELECT * FROM students WHERE id = ?`, [id]);
    if (!student) return res.status(404).json({ success: false, error: 'Siswa tidak ditemukan' });

    await run(`DELETE FROM invoices WHERE student_id = ?`, [id]);
    await run(`DELETE FROM students WHERE id = ?`, [id]);

    await logAudit(
      req.user.id,
      req.user.name,
      req.user.role,
      'DELETE_STUDENT',
      'SISWA',
      `Menghapus data siswa: ${student.name} (NIS: ${student.nis})`,
      req
    );

    res.json({ success: true, message: `Siswa ${student.name} berhasil dihapus dari sistem` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// === Batch Import Students from Excel ===
router.post('/students/batch-import', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    const { students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ success: false, error: 'Data siswa untuk di-import tidak boleh kosong' });
    }

    let insertedCount = 0;
    let skippedCount = 0;

    for (const st of students) {
      if (!st.nis || !st.name) {
        skippedCount++;
        continue;
      }

      const existing = await get(`SELECT id FROM students WHERE nis = ?`, [st.nis]);
      if (existing) {
        skippedCount++;
        continue;
      }

      let unitId = st.unit_id;
      if (!unitId && st.unit_name) {
        const u = await get(`SELECT id FROM units WHERE name LIKE ? OR code LIKE ?`, [`%${st.unit_name}%`, `%${st.unit_name}%`]);
        if (u) unitId = u.id;
      }

      let classId = st.class_id;
      if (!classId && st.class_name) {
        const c = await get(`SELECT id FROM classes WHERE name LIKE ?`, [`%${st.class_name}%`]);
        if (c) classId = c.id;
      }

      if (!unitId) unitId = 2; // SDIT default
      if (!classId) classId = 5; // Kelas 1 Umar default

      let parentId = null;
      if (st.father_name || st.parent_name) {
        const pName = st.father_name || st.parent_name;
        const pPhone = st.parent_phone || st.phone || '081234567890';
        const pRes = await run(
          `INSERT INTO parents (father_name, phone) VALUES (?, ?)`,
          [pName, pPhone]
        );
        parentId = pRes.id;
      }

      await run(
        `INSERT INTO students (nis, nisn, name, gender, pob, dob, address, unit_id, class_id, parent_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Aktif')`,
        [
          st.nis,
          st.nisn || '',
          st.name,
          st.gender === 'P' || st.gender === 'Perempuan' ? 'P' : 'L',
          st.pob || 'Lamongan',
          st.dob || '2019-01-01',
          st.address || 'Lamongan',
          unitId,
          classId,
          parentId
        ]
      );
      insertedCount++;
    }

    await logAudit(
      req.user.id,
      req.user.name,
      req.user.role,
      'IMPORT_STUDENTS_EXCEL',
      'SISWA',
      `Import ${insertedCount} data siswa dari file Excel (Dilewati: ${skippedCount})`,
      req
    );

    res.json({
      success: true,
      inserted: insertedCount,
      skipped: skippedCount,
      message: `Berhasil meng-import ${insertedCount} data siswa baru dari Excel (.xlsx). (${skippedCount} dilewati/duplikat)`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// === Discounts / Beasiswa ===
router.post('/discounts', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    const { student_id, post_id, type, value, reason } = req.body;
    const result = await run(
      `INSERT INTO discounts (student_id, post_id, type, value, reason) VALUES (?, ?, ?, ?, ?)`,
      [student_id, post_id, type, value, reason]
    );
    res.json({ success: true, id: result.id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
