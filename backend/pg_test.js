// pg_test.js
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
(async () => {
  try {
    const res = await pool.query('SELECT now()');
    console.log('PG connection successful, now:', res.rows[0]);
  } catch (e) {
    console.error('PG connection error:', e);
  } finally {
    await pool.end();
  }
})();
