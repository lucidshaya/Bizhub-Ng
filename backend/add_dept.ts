import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function main() {
    console.log("Setting up connection...");
    const pool = new pg.Pool({
        connectionString: "postgresql://postgres.gypptbedjebrwhovpwsu:ohineivori77u@aws-1-eu-central-1.pooler.supabase.com:5432/postgres",
    });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        console.log('Connecting...');
        await prisma.$connect();
        console.log('Adding departments column manually...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "businesses" ADD COLUMN departments TEXT[] DEFAULT ARRAY[]::TEXT[];`);
        console.log('Added departments column! ✅');
    } catch (err) {
        console.error('Error adding departments:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();

main();
