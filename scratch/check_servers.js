const axios = require('axios');
const jwt = require('jsonwebtoken');

async function checkServers() {
  const secret = process.env.JWT_SECRET || 'cendekia_secret_jwt_key_2026_super_secure';
  const token = jwt.sign({ id: 1, name: 'Superadmin Cendekia', email: 'superadmin@cendekia.sch.id', role: 'superadmin' }, secret, { expiresIn: '1d' });

  console.log('--- 1. Testing Localhost:5000 ---');
  try {
    const resLocal = await axios.get('http://localhost:5000/api/invoices', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Localhost /api/invoices status:', resLocal.status, 'Total data:', resLocal.data.data?.length);
  } catch (e) {
    console.error('Localhost error:', e.message);
  }

  console.log('--- 2. Testing Vercel Cloud ---');
  try {
    const resVercel = await axios.get('https://cendekia-payment.vercel.app/api/invoices', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Vercel /api/invoices status:', resVercel.status, 'Total data:', resVercel.data.data?.length);
  } catch (e) {
    console.error('Vercel error:', e.response?.data || e.message);
  }
}

checkServers();
