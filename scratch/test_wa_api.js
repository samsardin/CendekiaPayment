const axios = require('axios');
const jwt = require('jsonwebtoken');

async function testWAReminder() {
  const token = jwt.sign({ id: 1, name: 'Superadmin', role: 'superadmin' }, 'cendekia_secret_jwt_key_2026_super_secure', { expiresIn: '1d' });
  try {
    const res = await axios.post('https://cendekia-payment.vercel.app/api/invoices/56/reminder', {
      custom_phone: '082139422870'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Vercel WA Reminder Response:', res.data);
  } catch (e) {
    console.error('Error:', e.response?.data || e.message);
  }
}

testWAReminder();
