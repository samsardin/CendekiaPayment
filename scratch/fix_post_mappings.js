const { query, get, run } = require('../server/database/db');

async function fixPostMappings() {
  console.log('Fixing payment_posts account mapping...');
  const accSpp = await get(`SELECT id FROM accounts WHERE code = '401.01'`);
  const accInfaq = await get(`SELECT id FROM accounts WHERE code = '401.02'`);
  const accSeragam = await get(`SELECT id FROM accounts WHERE code = '401.03'`);

  if (accSpp) {
    await run(`UPDATE payment_posts SET account_id = ? WHERE code IN ('SPP-SDIT', 'SPP-KBTK')`, [accSpp.id]);
  }
  if (accInfaq) {
    await run(`UPDATE payment_posts SET account_id = ? WHERE code IN ('INFAQ-PEMB')`, [accInfaq.id]);
  }
  if (accSeragam) {
    await run(`UPDATE payment_posts SET account_id = ? WHERE code IN ('SERAGAM-SDIT', 'BUKU-SDIT', 'OUTING-SDIT', 'KOMITE-SDIT')`, [accSeragam.id]);
  }

  const posts = await query(`
    SELECT pp.id, pp.code, pp.name as post_name, a.code as account_code, a.name as account_name
    FROM payment_posts pp
    LEFT JOIN accounts a ON pp.account_id = a.id
  `);
  console.table(posts);
}

fixPostMappings();
