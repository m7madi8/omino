import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { ensurePermissions } from '@/server/services/organization-service';
import {
  PERMISSIONS,
  ROLE_PERMISSION_MAP,
  type SystemRoleSlug,
} from '@/lib/permissions/constants';
import { slugify } from '@/lib/utils';

async function seedPermissions() {
  await ensurePermissions();
}

async function seedDemoOrg() {
  const existing = await prisma.organization.findUnique({ where: { slug: 'demo-org' } });
  if (existing) {
    console.log('Demo organization already exists — skipping');
    return;
  }

  const passwordHash = await bcrypt.hash('Demo1234!', 12);

  const owner = await prisma.user.create({
    data: {
      email: 'owner@demo.omino.test',
      passwordHash,
      fullName: 'Demo Owner',
      phone: '+970599000001',
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@demo.omino.test',
      passwordHash,
      fullName: 'Demo Admin',
      phone: '+970599000002',
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@demo.omino.test',
      passwordHash,
      fullName: 'Demo Manager',
      phone: '+970599000003',
    },
  });

  const staff = await prisma.user.create({
    data: {
      email: 'staff@demo.omino.test',
      passwordHash,
      fullName: 'Demo Staff',
      phone: '+970599000004',
    },
  });

  const org = await prisma.organization.create({
    data: {
      name: 'Demo Organization',
      slug: 'demo-org',
      businessType: 'retail',
      country: 'PS',
      currency: 'ILS',
    },
  });

  const allPerms = await prisma.permission.findMany();
  const permByKey = Object.fromEntries(allPerms.map((p) => [p.key, p.id]));
  const roles: Record<string, string> = {};

  for (const roleSlug of Object.keys(ROLE_PERMISSION_MAP) as SystemRoleSlug[]) {
    const role = await prisma.role.create({
      data: {
        organizationId: org.id,
        name: roleSlug.charAt(0) + roleSlug.slice(1).toLowerCase(),
        slug: roleSlug,
        isSystem: true,
      },
    });
    roles[roleSlug] = role.id;
    await prisma.rolePermission.createMany({
      data: ROLE_PERMISSION_MAP[roleSlug]
        .filter((k) => permByKey[k])
        .map((k) => ({ roleId: role.id, permissionId: permByKey[k] })),
    });
  }

  const store = await prisma.store.create({
    data: {
      organizationId: org.id,
      name: 'Demo Store',
      slug: 'demo-store',
      publicSlug: 'demo-store',
      isDefault: true,
      status: 'ACTIVE',
      description: 'Welcome to our demo online store',
      currency: 'ILS',
      country: 'PS',
      contactEmail: 'store@demo.omino.test',
    },
  });

  const branch = await prisma.branch.create({
    data: {
      storeId: store.id,
      name: 'Main Branch',
      slug: 'main',
      isDefault: true,
      address: 'Ramallah, Palestine',
    },
  });

  const members = [
    { userId: owner.id, roleId: roles.OWNER },
    { userId: admin.id, roleId: roles.ADMIN },
    { userId: manager.id, roleId: roles.MANAGER },
    { userId: staff.id, roleId: roles.STAFF },
  ];

  for (const m of members) {
    await prisma.membership.create({
      data: { userId: m.userId, organizationId: org.id, roleId: m.roleId },
    });
    await prisma.userContext.upsert({
      where: { userId: m.userId },
      create: {
        userId: m.userId,
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
  }

  console.log('Demo organization seeded');
  console.log('  Emails: owner@demo.omino.test, admin@demo.omino.test, manager@demo.omino.test, staff@demo.omino.test');
  console.log('  Password (all): Demo1234!');

  await seedDemoCatalog(org.id, owner.id, store.id, branch.id);
}

async function seedDemoCatalog(
  organizationId: string,
  userId: string,
  storeId: string,
  branchId: string
) {
  const existing = await prisma.product.findFirst({ where: { organizationId } });
  if (existing) {
    console.log('Demo catalog already exists — skipping');
    return;
  }

  const { ensureDefaultStockLocation } = await import('../src/server/services/inventory-service');
  const { createCategory } = await import('../src/server/services/category-service');
  const { createProduct } = await import('../src/server/services/product-service');

  const loc = await ensureDefaultStockLocation(
    organizationId,
    storeId,
    branchId,
    'Main Branch'
  );

  const beauty = await createCategory(organizationId, userId, { name: 'Beauty' });
  const skincare = await createCategory(organizationId, userId, {
    name: 'Skincare',
    parentId: beauty.id,
  });

  await createProduct(
    {
      organizationId,
      userId,
      storeId,
      branchId,
      currency: 'ILS',
    },
    {
      name: 'Rose Water Toner',
      description: 'Hydrating toner for daily use',
      status: 'ACTIVE',
      categoryId: skincare.id,
      sellingPrice: 4500,
      costPrice: 2200,
      sku: 'RWT-001',
      barcode: '6291108734567',
      barcodeType: 'EAN',
      initialStock: 120,
      stockLocationId: loc.id,
      lowStockThreshold: 15,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400',
          isPrimary: true,
        },
      ],
    }
  );

  await createProduct(
    {
      organizationId,
      userId,
      storeId,
      branchId,
      currency: 'ILS',
    },
    {
      name: 'Premium Cotton T-Shirt',
      description: 'Soft cotton tee with multiple sizes',
      status: 'ACTIVE',
      sellingPrice: 8900,
      costPrice: 3500,
      options: [{ name: 'Size', values: ['S', 'M', 'L'] }],
      variants: [
        { sku: 'TSH-S', name: 'Small', sellingPrice: 8900, optionValues: ['S'], initialStock: 25 },
        { sku: 'TSH-M', name: 'Medium', sellingPrice: 8900, optionValues: ['M'], initialStock: 40 },
        { sku: 'TSH-L', name: 'Large', sellingPrice: 8900, optionValues: ['L'], initialStock: 18, lowStockThreshold: 5 },
      ],
      stockLocationId: loc.id,
    }
  );

  console.log('Demo catalog seeded (2 products, variants, stock)');
}

async function main() {
  console.log('Seeding permissions...');
  await seedPermissions();
  console.log(`  ${PERMISSIONS.length} permissions ready`);

  await seedDemoOrg();
  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
