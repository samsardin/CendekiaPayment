const { query, get, run } = require('../server/database/db');

async function testStepByStep() {
  const students = await query(`SELECT id, nis, name, unit_id, class_id FROM students WHERE nis = '2026011002'`);
  const student = students[0];
  console.log('Student found:', student);

  const posts = await query(`SELECT id, code, name, unit_id, default_amount, type FROM payment_posts`);
  const sppPost = posts.find(p => (p.unit_id === student.unit_id || !p.unit_id) && p.code.toLowerCase().includes('spp'));
  console.log('SPP Post found:', sppPost);

  const normalizedPeriod = '2026-07';
  const existing = await get(
    `SELECT id, invoice_number, nominal, paid_amount, status FROM invoices WHERE student_id = ? AND post_id = ? AND month_period = ?`,
    [student.id, sppPost.id, normalizedPeriod]
  );
  console.log('Existing invoice for 2026-07:', existing);

  const rawVal = 0;
  const valStr = String(rawVal).trim().toLowerCase();
  console.log('valStr:', valStr, 'valStr === "0":', valStr === '0');

  let isLunas = false;
  let nominal = parseFloat(sppPost.default_amount) || 350000;
  let paid = 0;
  let discount = 0;

  if (valStr === '0' || valStr === 'lunas' || valStr === 'l' || valStr === 'sudah' || valStr === 'ya') {
    isLunas = true;
    paid = Math.max(0, nominal - discount);
  }

  const effectiveNominal = Math.max(0, nominal - discount);
  let status = 'Belum Dibayar';
  if (isLunas || (paid >= effectiveNominal && effectiveNominal > 0)) {
    status = 'Lunas';
  }

  console.log('Calculated:', { nominal, discount, paid, status, isLunas });

  if (existing) {
    console.log('Updating existing invoice id:', existing.id);
    const updateRes = await run(
      `UPDATE invoices 
       SET nominal = ?, discount_amount = ?, paid_amount = ?, status = ?
       WHERE id = ?`,
      [nominal, discount, paid, status, existing.id]
    );
    console.log('Update result:', updateRes);
  } else {
    console.log('Inserting new invoice...');
    const invNum = `INV/${sppPost.code}/${student.nis}/${normalizedPeriod.replace('-', '')}`;
    const insertRes = await run(
      `INSERT INTO invoices (invoice_number, student_id, post_id, academic_year_id, month_period, due_date, nominal, discount_amount, paid_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [invNum, student.id, sppPost.id, 1, normalizedPeriod, '2026-07-10', nominal, discount, paid, status]
    );
    console.log('Insert result:', insertRes);
  }
}

testStepByStep();
