const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function test() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({
    where: { email: "test500@example.com" },
    include: { business: true },
  });
  console.log('User found:', !!user);
  if (!user) return console.log('No user');
  
  const pwValid = await bcrypt.compare("password123", user.passwordHash);
  console.log('Password valid:', pwValid);
  const res = {
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                avatarUrl: user.avatarUrl,
                businessId: user.businessId,
                businessName: user.business?.name,
                businessType: user.business?.type,
                hasPin: !!user.pinHash, // THIS MIGHT THROW?
            }
        };
  console.log('Result:', res);
}
test().catch(console.error).finally(() => process.exit(0));
