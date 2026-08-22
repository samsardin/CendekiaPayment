const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testApi() {
  const secret = process.env.JWT_SECRET || 'cendekia_secret_key_jwt_2026';
  const token = jwt.sign({ id: 1, name: 'Admin', role: 'superadmin' }, secret, { expiresIn: '1d' });

  // Test local backend
  try {
    const res = await axios.get('http://localhost:5000/api/invoices', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Local API status:', res.status, 'Invoices count:', res.data.data?.length);
    if (res.data.data?.length > 0) {
      console.log('Sample invoice:', res.data.data[0]);
    }
  } catch (err) {
    console.error('Local API error:', err.response?.data || err.message);
  }

  // Test cloud database directly
  const { query } = require('../server/database/db');
  try {
    const dbInvoices = await query(`
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
      LIMIT 5
    `);
    console.log('Direct DB query count:', dbInvoices.length);
  } catch (err) {
    console.error('Direct DB error:', err);
  }
}

testApi();
