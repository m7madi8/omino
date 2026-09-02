/**
 * OMINO Phase 2 — Product & Inventory domain tests
 * Run: npm run test:phase2
 * Requires: DATABASE_URL, seeded demo org
 */

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { createProduct, listProducts, archiveProduct } from '@/server/services/product-service';
import {
  adjustStock,
  listInventory,
  listStockLocations,
  ensureDefaultStockLocation,
} from '@/server/services/inventory-service';
import { createCategory } from '@/server/services/category-service';

const results: { name: string; pass: boolean; detail?: string }[] = [];

function test(name: string, pass: boolean, detail?: string) {
  results.push({ name, pass, detail });
  console.log(`${pass ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  console.log('\nOMINO Phase 2 Tests\n');

  const ts = Date.now();
  const orgA = await prisma.organization.create({
    data: {
      name: `Test Org A ${ts}`,
      slug: `test-org-a-${ts}`,
      currency: 'USD',
      country: 'PS',
    },
  });

  const orgB = await prisma.organization.create({
    data: {
      name: `Test Org B ${ts}`,
      slug: `test-org-b-${ts}`,
      currency: 'USD',
      country: 'PS',
    },
  });

  const hash = await bcrypt.hash('Test1234!', 12);
  const userA = await prisma.user.create({
    data: { email: `test-a-${ts}@omino.test`, passwordHash: hash, fullName: 'Test A' },
  });
  const userB = await prisma.user.create({
    data: { email: `test-b-${ts}@omino.test`, passwordHash: hash, fullName: 'Test B' },
  });

  const storeA = await prisma.store.create({
    data: { organizationId: orgA.id, name: 'Store A', slug: 'store-a', isDefault: true },
  });
  const branchA = await prisma.branch.create({
    data: { storeId: storeA.id, name: 'Branch A', slug: 'main', isDefault: true },
  });
  const locA = await ensureDefaultStockLocation(orgA.id, storeA.id, branchA.id, 'Branch A');

  const storeB = await prisma.store.create({
    data: { organizationId: orgB.id, name: 'Store B', slug: 'store-b', isDefault: true },
  });
  const branchB = await prisma.branch.create({
    data: { storeId: storeB.id, name: 'Branch B', slug: 'main', isDefault: true },
  });
  await ensureDefaultStockLocation(orgB.id, storeB.id, branchB.id, 'Branch B');

  const ctxA = {
    organizationId: orgA.id,
    userId: userA.id,
    storeId: storeA.id,
    branchId: branchA.id,
    currency: 'USD',
  };

  // Category
  const category = await createCategory(orgA.id, userA.id, { name: 'Skincare' });
  test('Create category', !!category.id);

  // Product create
  const { product, variants } = await createProduct(ctxA, {
    name: 'Test Moisturizer',
    sellingPrice: 2499,
    costPrice: 1200,
    status: 'ACTIVE',
    categoryId: category.id,
    sku: `SKU-A-${ts}`,
    initialStock: 50,
    stockLocationId: locA.id,
    lowStockThreshold: 10,
  });
  test('Create product', !!product.id);
  test('Create default variant', variants.length === 1, `count=${variants.length}`);
  test('Product has SKU', variants[0].sku.includes('SKU'));

  // List products org A
  const listA = await listProducts({ organizationId: orgA.id });
  test('List products org A', listA.items.some((p) => p.id === product.id));

  // List products org B — must not see A's product
  const listB = await listProducts({ organizationId: orgB.id });
  test('Org B cannot see org A products', !listB.items.some((p) => p.id === product.id));

  // Inventory
  const invA = await listInventory({ organizationId: orgA.id });
  test('Inventory shows stock', invA.items.some((i) => i.quantityOnHand === 50));

  // Stock adjustment
  await adjustStock({
    organizationId: orgA.id,
    userId: userA.id,
    variantId: variants[0].id,
    stockLocationId: locA.id,
    quantityDelta: 5,
    type: 'ADJUSTMENT',
    reason: 'Test adjustment',
  });
  const invAfter = await listInventory({ organizationId: orgA.id });
  const level = invAfter.items.find((i) => i.variantId === variants[0].id);
  test('Stock adjustment increases on hand', level?.quantityOnHand === 55, `got ${level?.quantityOnHand}`);

  // Negative stock blocked
  let blocked = false;
  try {
    await adjustStock({
      organizationId: orgA.id,
      userId: userA.id,
      variantId: variants[0].id,
      stockLocationId: locA.id,
      quantityDelta: -1000,
      type: 'ADJUSTMENT',
      reason: 'Should fail',
    });
  } catch (e) {
    blocked = e instanceof Error && e.message === 'INSUFFICIENT_STOCK';
  }
  test('Negative stock blocked', blocked);

  // Archive product
  await archiveProduct(orgA.id, userA.id, product.id);
  const archived = await listProducts({ organizationId: orgA.id, status: 'ARCHIVED' });
  test('Archive product', archived.items.some((p) => p.id === product.id));

  // Stock locations tenant isolation
  const locsA = await listStockLocations(orgA.id);
  const locsB = await listStockLocations(orgB.id);
  test('Stock locations isolated', locsA.length > 0 && locsB.length > 0 && locsA[0].id !== locsB[0].id);

  // Cleanup
  await prisma.organization.delete({ where: { id: orgA.id } });
  await prisma.organization.delete({ where: { id: orgB.id } });
  await prisma.user.delete({ where: { id: userA.id } });
  await prisma.user.delete({ where: { id: userB.id } });

  console.log('\n--- Summary ---');
  const passed = results.filter((r) => r.pass).length;
  console.log(`${passed}/${results.length} passed\n`);

  if (passed < results.length) process.exit(1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
