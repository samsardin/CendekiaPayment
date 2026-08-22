const { query } = require('../server/database/db');

async function testQuery() {
  try {
    const posts = await query(`SELECT id, code, name, unit_id, default_nominal, type FROM payment_posts`);
    console.log('Query success:', posts);
  } catch (e) {
    console.error('PostgreSQL error:', e.message);
  }
}

testQuery();
