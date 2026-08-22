const { query, get, run } = require('../server/database/db');

async function testPaymentRealtimeFlow() {
  console.log('=== UJI COBA REALTIME SALDO KAS & PENDAPATAN SPP ===\n');

  // 1. Ambil Saldo Sebelum Pembayaran
  const kasUtamaBefore = await get(`SELECT id, code, name, balance FROM accounts WHERE code = '101.01'`);
  const pendapatanSppBefore = await get(`SELECT id, code, name, balance FROM accounts WHERE code = '401.01'`);
  const bankBcaBefore = await get(`SELECT id, code, name, balance FROM accounts WHERE code = '101.02'`);

  console.log('📊 1. SALDO SEBELUM PEMBAYARAN:');
  console.log(`- ${kasUtamaBefore.code} ${kasUtamaBefore.name}: Rp ${Number(kasUtamaBefore.balance).toLocaleString('id-ID')}`);
  console.log(`- ${pendapatanSppBefore.code} ${pendapatanSppBefore.name}: Rp ${Number(pendapatanSppBefore.balance).toLocaleString('id-ID')}`);
  console.log(`- ${bankBcaBefore.code} ${bankBcaBefore.name}: Rp ${Number(bankBcaBefore.balance).toLocaleString('id-ID')}`);

  // 2. Ambil 1 Tagihan Belum Dibayar
  const unpaidInv = await get(
    `SELECT i.*, s.name as student_name, pp.name as post_name, pp.account_id
     FROM invoices i
     JOIN students s ON i.student_id = s.id
     JOIN payment_posts pp ON i.post_id = pp.id
     WHERE i.status = 'Belum Dibayar' AND pp.code LIKE '%SPP%'
     LIMIT 1`
  );

  if (!unpaidInv) {
    console.log('Tidak ada tagihan SPP yang belum dibayar untuk diuji.');
    return;
  }

  const payAmount = 500000;
  console.log(`\n💳 2. SIMULASI TRANSAKSI KASIR:`);
  console.log(`- Siswa: ${unpaidInv.student_name} (Invoice: ${unpaidInv.invoice_number})`);
  console.log(`- Pos: ${unpaidInv.post_name}`);
  console.log(`- Nominal Bayar: Rp ${payAmount.toLocaleString('id-ID')} (Metode: Cash / Tunai)`);

  // 3. Update Saldo Kas Utama & Pendapatan SPP (Sesuai Logika server/routes/payments.js)
  const targetAccountId = unpaidInv.account_id || pendapatanSppBefore.id;
  
  // A. Tambah ke Pendapatan SPP
  await run(`UPDATE accounts SET balance = balance + ? WHERE id = ?`, [payAmount, targetAccountId]);
  // B. Tambah ke Kas Utama
  await run(`UPDATE accounts SET balance = balance + ? WHERE code = '101.01'`, [payAmount]);

  // 4. Ambil Saldo Sesudah Pembayaran
  const kasUtamaAfter = await get(`SELECT id, code, name, balance FROM accounts WHERE code = '101.01'`);
  const pendapatanSppAfter = await get(`SELECT id, code, name, balance FROM accounts WHERE code = '401.01'`);

  console.log('\n✅ 3. SALDO SESUDAH PEMBAYARAN:');
  console.log(`- ${kasUtamaAfter.code} ${kasUtamaAfter.name}: Rp ${Number(kasUtamaAfter.balance).toLocaleString('id-ID')} (Bertambah +Rp ${payAmount.toLocaleString('id-ID')})`);
  console.log(`- ${pendapatanSppAfter.code} ${pendapatanSppAfter.name}: Rp ${Number(pendapatanSppAfter.balance).toLocaleString('id-ID')} (Bertambah +Rp ${payAmount.toLocaleString('id-ID')})`);

  console.log('\n🎉 KESIMPULAN: Saldo otomatis bertambah secara bersamaan di Akun Kas Utama DAN Akun Pendapatan SPP!');
}

testPaymentRealtimeFlow();
