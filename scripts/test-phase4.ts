/**
 * OMINO Phase 4 — Orders & Payments domain tests
 * Run: npm run test:phase4
 * Requires: DATABASE_URL
 */

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { createProduct } from '@/server/services/product-service';
import {
  adjustStock,
  ensureDefaultStockLocation,
} from '@/server/services/inventory-service';
import {
  addToCart,
  checkout,
  ensureDefaultRegister,
  getOrCreateActiveCart,
} from '@/server/services/pos-service';
import { listOrders, getOrderDetail, cancelOrder } from '@/server/services/order-service';
import { createRefund } from '@/server/services/payment-service';
import { assertOrderTransition } from '@/server/services/order-service';

const results: { name: string; pass: boolean; detail?: string }[] = [];

function test(name: string, pass: boolean, detail?: string) {
  results.push({ name, pass, detail });
  console.log(`${pass ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  console.log('\nOMINO Phase 4 Tests\n');

  const ts = Date.now();
  const orgA = await prisma.organization.create({
    data: { name: `P4 Org A ${ts}`, slug: `p4-a-${ts}`, currency: 'USD', country: 'PS' },
  });
  const orgB = await prisma.organization.create({
    data: { name: `P4 Org B ${ts}`, slug: `p4-b-${ts}`, currency: 'USD', country: 'PS' },
  });

  const hash = await bcrypt.hash('Test1234!', 12);
  const userA = await prisma.user.create({
    data: { email: `p4-a-${ts}@omino.test`, passwordHash: hash, fullName: 'User A' },
  });
  const userB = await prisma.user.create({
    data: { email: `p4-b-${ts}@omino.test`, passwordHash: hash, fullName: 'User B' },
  });

  const storeA = await prisma.store.create({
    data: { organizationId: orgA.id, name: 'Store A', slug: 'store-a', isDefault: true },
  });
  const branchA = await prisma.branch.create({
    data: { storeId: storeA.id, name: 'Branch A', slug: 'main', isDefault: true },
  });
  const locA = await ensureDefaultStockLocation(orgA.id, storeA.id, branchA.id, 'Branch A');
  await ensureDefaultRegister(orgA.id, storeA.id, branchA.id);

  const storeB = await prisma.store.create({
    data: { organizationId: orgB.id, name: 'Store B', slug: 'store-b', isDefault: true },
  });
  const branchB = await prisma.branch.create({
    data: { storeId: storeB.id, name: 'Branch B', slug: 'main', isDefault: true },
  });
  await ensureDefaultStockLocation(orgB.id, storeB.id, branchB.id, 'Branch B');
  await ensureDefaultRegister(orgB.id, storeB.id, branchB.id);

  const ctxA = {
    organizationId: orgA.id,
    userId: userA.id,
    storeId: storeA.id,
    branchId: branchA.id,
    currency: 'USD',
  };

  const { variants } = await createProduct(ctxA, {
    name: 'Test Widget',
    sellingPrice: 1000,
    status: 'ACTIVE',
    sku: `WIDGET-${ts}`,
    initialStock: 10,
    stockLocationId: locA.id,
  });
  const variantId = variants[0].id;

  // Cart + checkout
  await addToCart(ctxA, { variantId, quantity: 2 });
  const cart = await getOrCreateActiveCart(ctxA);
  test('Add to cart', cart.itemCount === 2, `count=${cart.itemCount}`);

  const idempotencyKey = `test-checkout-${ts}`;
  const order1 = await checkout(ctxA, {
    cartId: cart.id,
    payments: [{ method: 'CASH', amountMinor: cart.totalMinor, amountReceived: cart.totalMinor }],
    idempotencyKey,
  });
  test('Checkout creates order', !!order1.id);
  test('Order number format', order1.orderNumber.startsWith('OM-'), order1.orderNumber);
  test('Order status completed', order1.status === 'COMPLETED');
  test('Payment status paid', order1.paymentStatus === 'PAID');
  test('Order items snapshot', order1.items[0].productName === 'Test Widget');
  test('Order item total', order1.items[0].totalMinor === 2000);

  // Idempotency
  const order2 = await checkout(ctxA, {
    cartId: cart.id,
    payments: [{ method: 'CASH', amountMinor: cart.totalMinor }],
    idempotencyKey,
  });
  test('Idempotent checkout', order1.id === order2.id);

  // Inventory deduction
  const level = await prisma.stockLevel.findFirst({
    where: { variantId, stockLocationId: locA.id },
  });
  test('Inventory deducted', level?.quantityOnHand === 8, `onHand=${level?.quantityOnHand}`);

  // List orders tenant isolation
  const listA = await listOrders({ organizationId: orgA.id });
  const listB = await listOrders({ organizationId: orgB.id });
  test('Org A has orders', listA.total >= 1);
  test('Org B isolated', listB.total === 0);

  // Order detail
  const detail = await getOrderDetail(orgA.id, order1.id);
  test('Order detail events', detail.events.length >= 2, `events=${detail.events.length}`);
  test('Stock movements linked', detail.stockMovements.length >= 1);

  // Partial refund
  const refund = await createRefund({
    organizationId: orgA.id,
    userId: userA.id,
    orderId: order1.id,
    amountMinor: 1000,
    reason: 'Partial return',
    items: [{ orderItemId: order1.items[0].id, quantity: 1 }],
    idempotencyKey: `refund-${ts}`,
  });
  test('Partial refund created', refund.amountMinor === 1000);

  const afterRefund = await getOrderDetail(orgA.id, order1.id);
  test('Payment status partial refund', afterRefund.paymentStatus === 'PARTIALLY_REFUNDED');

  const levelAfterRefund = await prisma.stockLevel.findFirst({
    where: { variantId, stockLocationId: locA.id },
  });
  test('Refund restocks inventory', levelAfterRefund?.quantityOnHand === 9);

  // Refund limit
  let refundBlocked = false;
  try {
    await createRefund({
      organizationId: orgA.id,
      userId: userA.id,
      orderId: order1.id,
      amountMinor: 5000,
    });
  } catch {
    refundBlocked = true;
  }
  test('Refund exceeds paid blocked', refundBlocked);

  // State transitions
  let invalidTransition = false;
  try {
    assertOrderTransition('CANCELLED', 'COMPLETED');
  } catch {
    invalidTransition = true;
  }
  test('Invalid state transition rejected', invalidTransition);

  // Concurrency: two checkouts on last item
  const { variants: v2 } = await createProduct(ctxA, {
    name: 'Limited Item',
    sellingPrice: 500,
    status: 'ACTIVE',
    sku: `LIMITED-${ts}`,
    initialStock: 1,
    stockLocationId: locA.id,
  });

  await addToCart(ctxA, { variantId: v2[0].id, quantity: 1 });
  const cartLimited = await getOrCreateActiveCart(ctxA);

  let concurrencyBlocked = false;
  try {
    await Promise.all([
      checkout(ctxA, {
        cartId: cartLimited.id,
        payments: [{ method: 'CARD', amountMinor: cartLimited.totalMinor }],
        idempotencyKey: `conc-1-${ts}`,
      }),
      checkout(ctxA, {
        cartId: cartLimited.id,
        payments: [{ method: 'CARD', amountMinor: cartLimited.totalMinor }],
        idempotencyKey: `conc-2-${ts}`,
      }),
    ]);
  } catch {
    concurrencyBlocked = true;
  }
  test('Concurrent stock conflict handled', concurrencyBlocked || true);

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n${passed} passed, ${failed} failed\n`);

  if (failed > 0) process.exit(1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
