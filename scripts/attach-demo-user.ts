import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { NOVAE } from '../prisma/seeds/novae/constants';

/**
 * Attach demo@omino.test to an org when full NOVAÉ seed cannot run (schema drift).
 * Prefers demo-novae org; falls back to first available org with a store.
 */
async function main() {
  const passwordHash = await bcrypt.hash(NOVAE.PASSWORD, 12);
  const user = await prisma.user.upsert({
    where: { email: NOVAE.USER_EMAIL },
    create: {
      email: NOVAE.USER_EMAIL,
      passwordHash,
      fullName: 'NOVAÉ Demo',
      phone: '+970599000100',
    },
    update: { passwordHash, fullName: 'NOVAÉ Demo' },
    select: { id: true, email: true },
  });

  const existingMembership = await prisma.membership.findFirst({
    where: { userId: user.id },
    select: { id: true, organizationId: true },
  });
  if (existingMembership) {
    const store = await prisma.store.findFirst({
      where: { organizationId: existingMembership.organizationId, isDefault: true },
      select: { publicSlug: true, name: true },
    });
    console.log(JSON.stringify({ ok: true, alreadyLinked: true, storeSlug: store?.publicSlug }));
    return;
  }

  let org = await prisma.organization.findFirst({
    where: { slug: NOVAE.ORG_SLUG },
    select: {
      id: true,
      stores: { where: { isDefault: true }, select: { id: true, publicSlug: true }, take: 1 },
      roles: { where: { slug: 'OWNER' }, select: { id: true }, take: 1 },
    },
  });

  if (!org) {
    org = await prisma.organization.findFirst({
      select: {
        id: true,
        stores: { where: { isDefault: true }, select: { id: true, publicSlug: true }, take: 1 },
        roles: { where: { slug: 'OWNER' }, select: { id: true }, take: 1 },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  if (!org?.roles[0]) throw new Error('No organization with OWNER role found');
  const store = org.stores[0];
  if (!store) throw new Error('No default store found');

  const branch = await prisma.branch.findFirst({
    where: { storeId: store.id, isDefault: true },
    select: { id: true },
  });

  await prisma.membership.create({
    data: {
      userId: user.id,
      organizationId: org.id,
      roleId: org.roles[0].id,
    },
  });

  await prisma.userContext.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      organizationId: org.id,
      storeId: store.id,
      branchId: branch?.id,
    },
    update: {
      organizationId: org.id,
      storeId: store.id,
      branchId: branch?.id,
    },
  });

  console.log(
    JSON.stringify({
      ok: true,
      email: user.email,
      storeSlug: store.publicSlug,
      login: 'http://localhost:3003/login',
      storefront: `http://localhost:3003/store/${store.publicSlug}`,
    })
  );
}

main().finally(() => prisma.$disconnect());
