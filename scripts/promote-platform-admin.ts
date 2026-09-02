import { prisma } from '@/lib/db';
import { slugify } from '@/lib/utils';

const email = process.argv[2];
if (!email) {
  console.error('Usage: npx tsx scripts/promote-platform-admin.ts <email>');
  process.exit(1);
}

async function main() {
  const normalized = email.toLowerCase().trim();

  await prisma.$executeRawUnsafe(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN NOT NULL DEFAULT false;
  `);

  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) {
    console.error('User not found:', normalized);
    process.exit(1);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isPlatformAdmin: true, fullName: user.fullName ?? 'OMINO Owner' },
  });

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    include: { organization: true },
  });

  if (membership) {
    let slug = 'omino';
    const taken = await prisma.organization.findFirst({
      where: { slug, NOT: { id: membership.organizationId } },
    });
    if (taken) slug = slugify(`omino-${user.id.slice(0, 8)}`);

    await prisma.organization.update({
      where: { id: membership.organizationId },
      data: { name: 'OMINO', slug },
    });

    const store = await prisma.store.findFirst({
      where: { organizationId: membership.organizationId, isDefault: true },
    });
    if (store) {
      await prisma.store.update({
        where: { id: store.id },
        data: { name: 'OMINO Store' },
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        email: normalized,
        isPlatformAdmin: true,
        role: 'PLATFORM_ADMIN',
        organization: membership ? 'OMINO' : null,
      },
      null,
      2
    )
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
