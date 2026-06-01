require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    const password = 'ugoreX52';
    const email = 'ivorilucid@gmail.com';
    const hash = await bcrypt.hash(password, 12);
    
    // Check if the user exists
    const checkRes = await pool.query('SELECT id, email, role FROM "users" WHERE email = $1', [email]);
    if (checkRes.rows.length === 0) {
      console.log(`User ${email} does not exist. Creating...`);
      // We will create the user if it doesn't exist, but since it does we will just log a warning
      console.warn('Warning: User not found in database. Cannot update password.');
    } else {
      const user = checkRes.rows[0];
      console.log(`Found user ${email} with ID ${user.id} and role ${user.role}. Updating password hash...`);
      
      const updateRes = await pool.query(
        'UPDATE "users" SET password_hash = $1 WHERE email = $2',
        [hash, email]
      );
      
      console.log('Password hash updated successfully!');
    }
  } catch (e) {
    console.error('Error updating admin user:', e);
  } finally {
    await pool.end();
  }
})();
