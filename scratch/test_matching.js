const { query } = require('../server/database/db');

async function testMatch() {
  const posts = await query('SELECT * FROM payment_posts');
  console.log('Payment posts:', posts.map(p => ({ id: p.id, code: p.code, name: p.name, unit_id: p.unit_id })));

  const students = await query('SELECT * FROM students LIMIT 3');
  console.log('Sample students:', students.map(s => ({ id: s.id, nis: s.nis, name: s.name, unit_id: s.unit_id })));

  const sampleStudent = students[0];
  const invoices = await query('SELECT id, student_id, post_id, month_period, nominal, paid_amount, status FROM invoices WHERE student_id = ?', [sampleStudent.id]);
  console.log(`Invoices for student ${sampleStudent.name} (id: ${sampleStudent.id}, unit: ${sampleStudent.unit_id}):`, invoices);
}

testMatch();
