// check_db.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

(async () => {
  try {
    const testEmail = `test_${crypto.randomBytes(4).toString('hex')}@example.com`;
    console.log('Creating test user with email:', testEmail);
    const created = await prisma.user.create({
      data: {
        email: testEmail,
        fullName: 'Test User',
        role: 'USER',
        phone: null,
        avatarUrl: null,
        businessId: null,
      },
    });
    console.log('Created user ID:', created.id);
    const users = await prisma.user.findMany({
      where: { email: testEmail },
    });
    console.log('Fetched users count for test email:', users.length);
    console.log('User record:', users[0]);
    // clean up
    await prisma.user.delete({ where: { id: created.id } });
    console.log('Test user deleted.');
  } catch (err) {
    console.error('Error during DB check:', err);
  } finally {
    await prisma.$disconnect();
  }
})();
