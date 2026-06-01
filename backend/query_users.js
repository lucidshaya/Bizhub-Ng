require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    const res = await pool.query('SELECT id, email, "full_name", role FROM "users"');
    console.log('Users in DB:');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error('DB query error:', e);
  } finally {
    await pool.end();
  }
})();
