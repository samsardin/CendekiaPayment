const { query, get } = require('../server/database/db');

async function checkAll() {
  const students = await query('SELECT * FROM students');
  console.log('Total students:', students.length);
  for (const s of students) {
    const invCount = await get('SELECT count(*) as c FROM invoices WHERE student_id = ?', [s.id]);
    console.log(`Student [${s.nis}] ${s.name} (Unit: ${s.unit_id}, Class: ${s.class_id}): ${invCount.c} invoices`);
  }
}

checkAll();
