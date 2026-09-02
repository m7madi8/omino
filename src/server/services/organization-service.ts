import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import {
  PERMISSIONS,
  ROLE_PERMISSION_MAP,
  type SystemRoleSlug,
} from '@/lib/permissions/constants';
import { slugify, uniqueSlug } from '@/lib/utils';

type Tx = Prisma.TransactionClient;

export async function ensurePermissions(tx: Tx = prisma) {
  for (const key of PERMISSIONS) {
    await tx.permission.upsert({
      where: { key },
      create: { key, module: key.split('.')[0], description: key },
      update: {},
    });
  }
}

async function createOrgRoles(tx: Tx, organizationId: string) {
  const allPerms = await tx.permission.findMany();
  const permByKey = Object.fromEntries(allPerms.map((p) => [p.key, p.id]));

  for (const roleSlug of Object.keys(ROLE_PERMISSION_MAP) as SystemRoleSlug[]) {
    const role = await tx.role.create({
      data: {
        organizationId,
        name: roleSlug.charAt(0) + roleSlug.slice(1).toLowerCase(),
        slug: roleSlug,
        isSystem: true,
        description: `System ${roleSlug} role`,
      },
    });

    const keys = ROLE_PERMISSION_MAP[roleSlug];
    await tx.rolePermission.createMany({
      data: keys
        .filter((k) => permByKey[k])
        .map((k) => ({ roleId: role.id, permissionId: permByKey[k] })),
      skipDuplicates: true,
    });
  }

  return tx.role.findFirst({
    where: { organizationId, slug: 'OWNER' },
  });
}

export async function createOrganizationWithDefaults(input: {
  userId: string;
  name: string;
  businessType?: string;
  country?: string;
  currency?: string;
  storeName?: string;
  branchName?: string;
}) {
  const baseSlug = slugify(input.name);
  let slug = baseSlug;
  let attempt = 0;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = uniqueSlug(input.name, String(attempt));
  }

  await ensurePermissions();

  return prisma.$transaction(
    async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: input.name,
        slug,
        businessType: input.businessType,
        country: input.country,
        currency: input.currency || 'USD',
      },
    });

    const ownerRole = await createOrgRoles(tx, org.id);
    if (!ownerRole) throw new Error('OWNER_ROLE_MISSING');

    await tx.membership.create({
      data: {
        userId: input.userId,
        organizationId: org.id,
        roleId: ownerRole.id,
      },
    });

    const storeSlug = slugify(input.storeName || `${input.name} Store`);
    const store = await tx.store.create({
      data: {
        organizationId: org.id,
        name: input.storeName || `${input.name} Store`,
        slug: storeSlug,
        publicSlug: storeSlug,
        isDefault: true,
        status: 'ACTIVE',
        currency: input.currency,
        country: input.country,
      },
    });

    const branch = await tx.branch.create({
      data: {
        storeId: store.id,
        name: input.branchName || 'Main Branch',
        slug: 'main',
        isDefault: true,
      },
    });

    const { ensureDefaultStockLocation } = await import(
      '@/server/services/inventory-service'
    );
    await ensureDefaultStockLocation(
      org.id,
      store.id,
      branch.id,
      branch.name,
      tx
    );

    const { ensureDefaultRegister } = await import('@/server/services/pos-service');
    await ensureDefaultRegister(org.id, store.id, branch.id, tx);

    await tx.userContext.upsert({
      where: { userId: input.userId },
      create: {
        userId: input.userId,
        organizationId: org.id,
        storeId: store.id,
        branchId: branch.id,
      },
      update: {
        organizationId: org.id,
        storeId: store.id,
        branchId: branch.id,
      },
    });

    return { organization: org, store, branch };
    },
    { timeout: 60_000 }
  );
}

export async function updateUserContext(
  userId: string,
  data: { organizationId?: string; storeId?: string; branchId?: string }
) {
  const membership = data.organizationId
    ? await prisma.membership.findUnique({
        where: {
          userId_organizationId: { userId, organizationId: data.organizationId },
        },
      })
    : null;

  if (data.organizationId && !membership) {
    throw new Error('FORBIDDEN');
  }

  if (data.storeId && data.organizationId) {
    const store = await prisma.store.findFirst({
      where: { id: data.storeId, organizationId: data.organizationId },
    });
    if (!store) throw new Error('FORBIDDEN');
  }

  if (data.branchId && data.storeId) {
    const branch = await prisma.branch.findFirst({
      where: { id: data.branchId, storeId: data.storeId },
    });
    if (!branch) throw new Error('FORBIDDEN');
  }

  return prisma.userContext.upsert({
    where: { userId },
    create: {
      userId,
      organizationId: data.organizationId!,
      storeId: data.storeId,
      branchId: data.branchId,
    },
    update: {
      ...(data.organizationId && { organizationId: data.organizationId }),
      ...(data.storeId !== undefined && { storeId: data.storeId }),
      ...(data.branchId !== undefined && { branchId: data.branchId }),
    },
  });
}

export async function getOrgTeam(organizationId: string) {
  return prisma.membership.findMany({
    where: { organizationId },
    include: {
      user: { select: { id: true, email: true, fullName: true, phone: true, createdAt: true } },
      role: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getOrgStores(organizationId: string) {
  return prisma.store.findMany({
    where: { organizationId },
    include: { branches: { orderBy: { createdAt: 'asc' } } },
    orderBy: { createdAt: 'asc' },
  });
}
