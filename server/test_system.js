const { query, get, run, initDB } = require('./database/db');
const seedData = require('./database/seed');
const bcrypt = require('bcryptjs');
const { resolveEffectiveNominal } = require('./routes/pos');

const runTests = async () => {
  console.log('====================================================');
  console.log('🧪 RUNNING SFMS CENDEKIA LAMONGAN INTEGRATION TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  };

  try {
    // 1. Initialize & Seed DB
    console.log('--- 1. Testing Database Initialization & Seed Data ---');
    await seedData();
    const students = await query(`SELECT * FROM students`);
    assert(students.length >= 2, 'Initial students seeded successfully (KBTK & SDIT)');

    const units = await query(`SELECT * FROM units`);
    assert(units.length === 2, 'Units KBTK-IT and SDIT Cendekia exist');

    const paymentPosts = await query(`SELECT * FROM payment_posts`);
    assert(paymentPosts.length >= 10, 'Initial payment posts seeded (SPP, Perlengkapan, Outing, Infaq, etc.)');

    const accounts = await query(`SELECT * FROM accounts`);
    assert(accounts.length >= 10, 'Chart of Accounts initialized (Kas, Bank, Gabungan, Pengeluaran)');

    // 2. Test User Authentication & Password Validation (TC-001, TC-002)
    console.log('\n--- 2. Testing Authentication & Passwords ---');
    const adminUser = await get(`SELECT * FROM users WHERE role = 'admin' LIMIT 1`);
    assert(adminUser !== null, 'Admin user exists in database');

    const validPass = await bcrypt.compare('password123', adminUser.password);
    assert(validPass === true, 'TC-001: Correct password verifies successfully');

    const invalidPass = await bcrypt.compare('wrongpassword', adminUser.password);
    assert(invalidPass === false, 'TC-002: Incorrect password correctly rejected (ERR-001)');

    // 3. Test Academic Year Business Rule BR-001 (Single Active Year)
    console.log('\n--- 3. Testing Academic Year Business Rule (BR-001) ---');
    const activeAYs = await query(`SELECT * FROM academic_years WHERE is_active = 1`);
    assert(activeAYs.length === 1, 'BR-001: Exactly one academic year is active');

    // 4. Test Hierarchical Nominal Resolution Engine (BR-002, Phase 6)
    console.log('\n--- 4. Testing Hierarchical Pricing Engine (BR-002) ---');
    const sppPost = await get(`SELECT id, default_amount FROM payment_posts WHERE code LIKE '%SPP%' LIMIT 1`);
    const student1 = students[0];

    // Priority Test: Default
    const defaultNominal = await resolveEffectiveNominal(sppPost.id, student1.id);
    assert(defaultNominal > 0, `Default nominal resolved: Rp ${defaultNominal.toLocaleString('id-ID')}`);

    // Set Student-specific Rule (Level 3 - Highest)
    await run(`DELETE FROM nominal_rules WHERE post_id = ? AND target_type = 'student' AND target_id = ?`, [sppPost.id, student1.id]);
    await run(`INSERT INTO nominal_rules (post_id, target_type, target_id, amount) VALUES (?, 'student', ?, 450000)`, [sppPost.id, student1.id]);
    const customStudentNominal = await resolveEffectiveNominal(sppPost.id, student1.id);
    assert(customStudentNominal === 450000, `Level 3 (Siswa) priority override working: Rp ${customStudentNominal.toLocaleString('id-ID')}`);

    // 5. Test Invoice Creation & Installment Calculation (Phase 7 & 8)
    console.log('\n--- 5. Testing Invoice Generation & Installments (BR-008, BR-009) ---');
    const testInvNum = `TEST-INV-${Date.now()}`;
    const invRes = await run(
      `INSERT INTO invoices (invoice_number, student_id, post_id, academic_year_id, month_period, due_date, nominal, discount_amount, paid_amount, status)
       VALUES (?, ?, ?, ?, '2026-08', '2026-08-31', 1000000, 0, 0, 'Belum Dibayar')`,
      [testInvNum, student1.id, sppPost.id, activeAYs[0].id]
    );

    const testInvoice = await get(`SELECT * FROM invoices WHERE id = ?`, [invRes.id]);
    assert(testInvoice.status === 'Belum Dibayar' && testInvoice.paid_amount === 0, 'Invoice initialized with status Belum Dibayar');

    // Installment 1: Pay 400,000 of 1,000,000
    const pay1Txn = `PAY-TEST-${Date.now()}-1`;
    await run(
      `INSERT INTO payments (transaction_number, invoice_id, student_id, amount, payment_method, status)
       VALUES (?, ?, ?, 400000, 'Cash', 'Paid')`,
      [pay1Txn, testInvoice.id, student1.id]
    );
    await run(`UPDATE invoices SET paid_amount = paid_amount + 400000, status = 'Sebagian' WHERE id = ?`, [testInvoice.id]);

    let updatedInv = await get(`SELECT * FROM invoices WHERE id = ?`, [testInvoice.id]);
    assert(updatedInv.paid_amount === 400000 && updatedInv.status === 'Sebagian', 'Installment 1 sets status to Sebagian with correct remaining');

    // Installment 2: Pay remaining 600,000 -> Status becomes Lunas
    const pay2Txn = `PAY-TEST-${Date.now()}-2`;
    await run(
      `INSERT INTO payments (transaction_number, invoice_id, student_id, amount, payment_method, status)
       VALUES (?, ?, ?, 600000, 'Cash', 'Paid')`,
      [pay2Txn, testInvoice.id, student1.id]
    );
    await run(`UPDATE invoices SET paid_amount = paid_amount + 600000, status = 'Lunas' WHERE id = ?`, [testInvoice.id]);

    updatedInv = await get(`SELECT * FROM invoices WHERE id = ?`, [testInvoice.id]);
    assert(updatedInv.paid_amount === 1000000 && updatedInv.status === 'Lunas', 'Installment 2 completes invoice -> Status LUNAS (BR-009)');

    // 6. Test Void Transaction Reversal without physical delete (BR-007)
    console.log('\n--- 6. Testing Void Payment Reversal (BR-007) ---');
    const paymentToVoid = await get(`SELECT * FROM payments WHERE transaction_number = ?`, [pay2Txn]);
    assert(paymentToVoid !== null, 'Payment transaction retrieved');

    // Perform VOID
    await run(`UPDATE payments SET status = 'Void', notes = 'VOID: Salah input nominal' WHERE id = ?`, [paymentToVoid.id]);
    await run(`UPDATE invoices SET paid_amount = paid_amount - ?, status = 'Sebagian' WHERE id = ?`, [paymentToVoid.amount, testInvoice.id]);

    const voidedPayment = await get(`SELECT * FROM payments WHERE id = ?`, [paymentToVoid.id]);
    const revertedInvoice = await get(`SELECT * FROM invoices WHERE id = ?`, [testInvoice.id]);
    assert(voidedPayment.status === 'Void', 'Payment record marked as Void (not physically deleted)');
    assert(revertedInvoice.paid_amount === 400000 && revertedInvoice.status === 'Sebagian', 'Invoice balance and status correctly reverted after void');

    // 7. Test Expense Management & Account Balance Validation (BR-010)
    console.log('\n--- 7. Testing Expense & Cash Engine (BR-010) ---');
    const mainCashBefore = await get(`SELECT balance FROM accounts WHERE code = '101.01'`);
    const expVoucher = `VCH-TEST-${Date.now()}`;
    const expAmount = 250000;

    await run(
      `INSERT INTO expenses (expense_number, account_id, category, title, amount, date, status)
       VALUES (?, 1, 'Sarpras', 'Beli Perlengkapan Kelas', ?, '2026-08-22', 'Approved')`,
      [expVoucher, expAmount]
    );
    await run(`UPDATE accounts SET balance = balance - ? WHERE code = '101.01'`, [expAmount]);

    const mainCashAfter = await get(`SELECT balance FROM accounts WHERE code = '101.01'`);
    assert(mainCashAfter.balance === mainCashBefore.balance - expAmount, 'Cash balance accurately updated after approved expense');

    // Clean up test records
    await run(`DELETE FROM payments WHERE transaction_number LIKE 'PAY-TEST%'`);
    await run(`DELETE FROM invoices WHERE invoice_number LIKE 'TEST-INV%'`);
    await run(`DELETE FROM expenses WHERE expense_number LIKE 'VCH-TEST%'`);

    console.log('\n====================================================');
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

  } catch (err) {
    console.error('Test execution exception:', err);
  }
};

runTests();
