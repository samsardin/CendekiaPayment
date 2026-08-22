const XLSX = require('../client/node_modules/xlsx');
const express = require('express');
const invoicesRoute = require('../server/routes/invoices');
const jwt = require('jsonwebtoken');

// Test input
const testItems = [
  {
    'NIS': '2026011002',
    'Nama Siswa': 'Aisha Humaira',
    'Jenjang': 'KBTK-IT Cendekia',
    'Kelas': 'Kelompok Bermain (KB)',
    'SPP Juli 2026': 0,
    'SPP Agustus 2026': 350000
  }
];

// Mock req and res
const req = {
  body: { items: testItems },
  user: { id: 1, name: 'Superadmin', role: 'superadmin' }
};

const res = {
  status: (code) => ({
    json: (data) => console.log('Status', code, 'Response:', data)
  }),
  json: (data) => console.log('JSON Response:', data)
};

// Find route handler
const layer = invoicesRoute.stack.find(l => l.route && l.route.path === '/import-excel' && l.route.methods.post);
if (layer) {
  const handler = layer.route.stack[layer.route.stack.length - 1].handle;
  handler(req, res);
} else {
  console.log('Route /import-excel not found');
}
