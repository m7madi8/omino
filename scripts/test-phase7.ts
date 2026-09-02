/**
 * OMINO Phase 7 — Analytics + BI tests
 * Run: npm run test:phase7
 */

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import {
  compareMetric,
  computeAov,
  computeNetSales,
  computeRepeatRate,
  aggregateSalesFromOrders,
} from '@/lib/analytics/metrics';
import { resolveDateRange } from '@/lib/analytics/date-range';
import { createProduct } from '@/server/services/product-service';
import {
  ensureDefaultStockLocation,
  adjustStock,
} from '@/server/services/inventory-service';
import {
  addToCart,
  checkout,
  ensureDefaultRegister,
  getOrCreateActiveCart,
} from '@/server/services/pos-service';
import { getSalesMetrics, getChannelMetrics } from '@/server/services/analytics/sales-analytics-service';
import { getTopProducts } from '@/server/services/analytics/product-analytics-service';
import { getCustomerMetricsSummary } from '@/server/services/analytics/customer-analytics-service';
import { getInventoryMetricsSummary } from '@/server/services/analytics/inventory-analytics-service';
import {
  getAnalyticsOverview,
  reconcileSalesMetrics,
} from '@/server/services/analytics/analytics-service';
import { generateBusinessSignals } from '@/server/services/analytics/business-signals-service';

const results: { name: string; pass: boolean; detail?: string }[] = [];

function test(name: string, pass: boolean, detail?: string) {
  results.push({ name, pass, detail });
  console.log(`${pass ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  console.log('\nOMINO Phase 7 Tests\n');

  // Unit: metrics
  test('computeNetSales', computeNetSales(10000, 1500) === 8500);
  test('computeAov', computeAov(10000, 4) === 2500);
  test('computeRepeatRate', computeRepeatRate(3, 10) === 30);
  test('compareMetric up', compareMetric(120, 100).direction === 'up');
  test('compareMetric zero baseline', compareMetric(100, 0).changePercent === null);

  const orders = [
    {
      status: 'COMPLETED',
      totalMinor: 5000,
      discountAmount: 200,
      taxAmount: 400,
      feesAmount: 0,
      shippingAmount: 0,
      refundedMinor: 500,
      items: [{ quantity: 2 }],
    },
    {
      status: 'COMPLETED',
      totalMinor: 3000,
      discountAmount: 0,
      taxAmount: 240,
      feesAmount: 0,
      shippingAmount: 0,
      refundedMinor: 0,
      items: [{ quantity: 1 }],
    },
    { status: 'CANCELLED', totalMinor: 1000, discountAmount: 0, taxAmount: 0, feesAmount: 0, shippingAmount: 0, refundedMinor: 0 },
  ];
  const agg = aggregateSalesFromOrders(orders);
  test('aggregate gross sales', agg.grossSalesMinor === 8000);
  test('aggregate net sales', agg.netSalesMinor === 7500);
  test('aggregate completed count', agg.completedOrders === 2);
  test('aggregate item count', agg.itemCount === 3);

  const range = resolveDateRange('last_30_days');
  test('date range has previous period', range.previousFrom < range.from);
  test('date range label', range.label === 'Last 30 days');

  const ts = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    console.log('\n⚠ Database unavailable — skipping integration tests (11 unit tests passed)\n');
    const failed = results.filter((r) => !r.pass);
    console.log(`${results.length - failed.length}/${results.length} passed`);
    process.exit(failed.length ? 1 : 0);
  }

  const orgA = await prisma.organization.create({
    data: { name: `P7 A ${ts}`, slug: `p7-a-${ts}`, currency: 'USD', country: 'PS' },
  });
  const orgB = await prisma.organization.create({
    data: { name: `P7 B ${ts}`, slug: `p7-b-${ts}`, currency: 'USD', country: 'PS' },
  });

  const hash = await bcrypt.hash('Test1234!', 12);
  const userA = await prisma.user.create({
    data: { email: `p7-a-${ts}@omino.test`, passwordHash: hash, fullName: 'User A' },
  });

  const storeA = await prisma.store.create({
    data: { organizationId: orgA.id, name: 'Store A', slug: 'store-a', isDefault: true },
  });
  const branchA = await prisma.branch.create({
    data: { storeId: storeA.id, name: 'Branch A', slug: 'main', isDefault: true },
  });
  const locA = await ensureDefaultStockLocation(orgA.id, storeA.id, branchA.id, 'Branch A');
  await ensureDefaultRegister(orgA.id, storeA.id, branchA.id);

  const ctxA = {
    organizationId: orgA.id,
    userId: userA.id,
    storeId: storeA.id,
    branchId: branchA.id,
    currency: 'USD',
  };

  const { variants } = await createProduct(ctxA, {
    name: 'Analytics Widget',
    sellingPrice: 2500,
    status: 'ACTIVE',
    sku: `AW-${ts}`,
    initialStock: 20,
    stockLocationId: locA.id,
    lowStockThreshold: 5,
  });
  const variantId = variants[0].id;

  await addToCart(ctxA, { variantId, quantity: 2 });
  const cart = await getOrCreateActiveCart(ctxA);
  const order = await checkout(ctxA, {
    cartId: cart.id,
    payments: [{ method: 'CASH', amountMinor: cart.totalMinor, amountReceived: cart.totalMinor }],
    idempotencyKey: `p7-checkout-${ts}`,
  });
  test('POS checkout for analytics', order.status === 'COMPLETED');

  const filters = {
    organizationId: orgA.id,
    storeId: storeA.id,
    branchId: branchA.id,
    from: new Date(Date.now() - 24 * 60 * 60 * 1000),
    to: new Date(),
  };
  const salesRange = { from: filters.from, to: filters.to };

  const sales = await getSalesMetrics(filters, salesRange);
  test('Sales gross matches order', sales.grossSalesMinor === order.totalMinor, `gross=${sales.grossSalesMinor}`);
  test('Sales completed count', sales.completedOrders === 1);
  test('Sales AOV', sales.averageOrderValueMinor === order.totalMinor);

  const channels = await getChannelMetrics(filters, salesRange);
  const posChannel = channels.find((c) => c.source === 'POS');
  test('POS channel revenue', posChannel?.revenueMinor === order.totalMinor);
  test('Channel sum equals gross', channels.reduce((s, c) => s + c.revenueMinor, 0) === sales.grossSalesMinor);

  const topProducts = await getTopProducts(filters, salesRange, 5);
  test('Top product name snapshot', topProducts[0]?.productName === 'Analytics Widget');
  test('Top product units', topProducts[0]?.unitsSold === 2);

  const customers = await getCustomerMetricsSummary(filters, salesRange);
  test('Customer metrics callable', customers.totalCustomers >= 0);

  const inventory = await getInventoryMetricsSummary(filters, salesRange);
  test('Inventory movement count', inventory.movementCount >= 1);

  const recon = await reconcileSalesMetrics(filters, salesRange);
  test('Reconciliation gross matches', recon.grossMatches);
  test('Reconciliation channel matches total', recon.channelMatchesTotal);

  const overviewA = await getAnalyticsOverview({
    organizationId: orgA.id,
    storeId: storeA.id,
    branchId: branchA.id,
    preset: 'last_7_days',
    currency: 'USD',
  });
  test('Overview has data', overviewA.hasData);
  test('Overview signals', overviewA.signals.length > 0);

  const overviewB = await getAnalyticsOverview({
    organizationId: orgB.id,
    preset: 'last_7_days',
    currency: 'USD',
  });
  test('Tenant isolation — org B no sales', !overviewB.hasData || overviewB.sales.completedOrders === 0);

  const signals = generateBusinessSignals({
    sales: { ...sales, pendingOrders: 0, cancelledOrders: 0, orderCount: 1, discountsMinor: 0, taxesMinor: 0, feesMinor: 0, shippingMinor: 0 },
    previousSales: { ...sales, grossSalesMinor: 0, netSalesMinor: 0, completedOrders: 0, averageOrderValueMinor: 0, pendingOrders: 0, cancelledOrders: 0, orderCount: 0, discountsMinor: 0, taxesMinor: 0, feesMinor: 0, shippingMinor: 0, refundsMinor: 0, itemCount: 0 },
    customers,
    channels,
    inventoryLowStock: 0,
    inventoryOutOfStock: 0,
    hasData: true,
  });
  test('Business signals generated', signals.some((s) => s.type === 'CUSTOMER_GROWTH' || s.type === 'TOP_PRODUCT' || s.type === 'REVENUE_GROWTH' || s.type === 'NO_DATA') || signals.length > 0);

  // Low stock alert setup
  await adjustStock({
    organizationId: orgA.id,
    userId: userA.id,
    variantId,
    stockLocationId: locA.id,
    quantityDelta: -16,
    reason: 'Test low stock',
    type: 'ADJUSTMENT',
  });
  const inventoryLow = await getInventoryMetricsSummary(filters, salesRange);
  test('Low stock detected', inventoryLow.lowStockCount >= 1 || inventoryLow.outOfStockCount >= 1);

  // Cleanup
  await prisma.organization.delete({ where: { id: orgA.id } });
  await prisma.organization.delete({ where: { id: orgB.id } });
  await prisma.user.delete({ where: { id: userA.id } });

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.log('\nFailed:');
    failed.forEach((f) => console.log(`  - ${f.name}${f.detail ? `: ${f.detail}` : ''}`));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
