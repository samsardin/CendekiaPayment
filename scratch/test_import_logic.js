const XLSX = require('../client/node_modules/xlsx');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Create test workbook
const testData = [
  {
    'NIS': '2026011002',
    'Nama Siswa': 'Aisha Humaira',
    'Jenjang': 'KBTK-IT Cendekia',
    'Kelas': 'Kelompok Bermain (KB)',
    'SPP Juli 2026': 0,
    'SPP Agustus 2026': 350000
  }
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(testData);
XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
const parsed = XLSX.utils.sheet_to_json(ws);
console.log('Parsed sheet_to_json:', parsed);

async function runTest() {
  const token = jwt.sign({ id: 1, name: 'Superadmin', role: 'superadmin' }, 'cendekia_secret_jwt_key_2026_super_secure', { expiresIn: '1d' });
  try {
    const res = await axios.post('https://cendekia-payment.vercel.app/api/invoices/import-excel', { items: parsed }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Vercel API Response:', res.data);
  } catch (e) {
    console.error('API Error:', e.response?.data || e.message);
  }
}

runTest();
