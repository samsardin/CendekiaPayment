const { query, get } = require('../server/database/db');

async function debugAisha() {
  const student = await get(`SELECT * FROM students WHERE nis = '2026011002' OR name LIKE '%Aisha%'`);
  console.log('Student:', student);

  const posts = await query(`SELECT * FROM payment_posts`);
  console.log('Posts:', posts);

  const invoices = await query(`SELECT * FROM invoices WHERE student_id = ?`, [student.id]);
  console.log('Invoices for Aisha count:', invoices.length);
  console.log('Invoices sample:', invoices.slice(0, 5));
}

debugAisha();
