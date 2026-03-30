import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'testuser1@example.com' } });
  console.log(user);
}
main()
  .catch(e => console.error(e))
  .finally(async () => { await prisma.$disconnect(); });
