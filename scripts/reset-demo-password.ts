import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

const EMAIL = 'demo@omino.test';
const PASSWORD = 'OminoDemo2026!';

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 12);
  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    create: { email: EMAIL, passwordHash: hash, fullName: 'NOVAÉ Demo' },
    update: { passwordHash: hash },
    select: { id: true, email: true },
  });

  const valid = await bcrypt.compare(
    PASSWORD,
    (
      await prisma.user.findUnique({
        where: { id: user.id },
        select: { passwordHash: true },
      })
    )?.passwordHash ?? ''
  );

  console.log(JSON.stringify({ ok: true, email: user.email, passwordValid: valid }));
}

main().finally(() => prisma.$disconnect());
