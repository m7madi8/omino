/**
 * Check if Prisma tables exist on the connected database.
 * Run: npx tsx scripts/check-db-schema.ts
 */
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const tables = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    console.log(`Tables in public schema: ${tables.length}`);

    const userTable = tables.find((t) => t.table_name === 'users');
    if (userTable) {
      console.log('users table: EXISTS');
      const count = await prisma.user.count();
      console.log(`User rows: ${count}`);
    } else {
      console.log('User table: MISSING');
      console.log('Action required: run prisma db push against this database');
    }

    if (tables.length > 0 && tables.length <= 20) {
      console.log('Tables:', tables.map((t) => t.table_name).join(', '));
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Schema check failed:', msg.slice(0, 400));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
