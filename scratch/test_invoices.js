const { query } = require('../server/database/db');

async function test() {
  try {
    const sql = `
      SELECT i.*, 
             s.name as student_name, s.nis, s.gender,
             c.name as class_name, 
             u.name as unit_name,
             pp.name as post_name, pp.code as post_code, pp.type as post_type,
             ay.name as academic_year
      FROM invoices i
      LEFT JOIN students s ON i.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN units u ON s.unit_id = u.id
      LEFT JOIN payment_posts pp ON i.post_id = pp.id
      LEFT JOIN academic_years ay ON i.academic_year_id = ay.id
      ORDER BY i.due_date ASC, i.id DESC
      LIMIT 10
    `;
    const res = await query(sql);
    console.log('Invoices query result count:', res.length);
    if (res.length > 0) {
      console.log('First row:', res[0]);
    }
  } catch (err) {
    console.error('Error in test:', err);
  }
}

test();
