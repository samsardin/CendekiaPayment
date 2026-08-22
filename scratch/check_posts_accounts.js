const { query } = require('../server/database/db');

async function checkPostsAccounts() {
  const posts = await query(`SELECT id, code, name, unit_id, account_id FROM payment_posts`);
  console.log('Payment posts with account_id:');
  console.table(posts);

  const accounts = await query(`SELECT id, code, name, type FROM accounts`);
  console.log('Accounts:');
  console.table(accounts);
}

checkPostsAccounts();
