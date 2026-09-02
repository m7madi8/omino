/**
 * OMINO Phase 6 — CRM + Customer Engine tests
 * Run: npm run test:phase6
 */

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { normalizeEmail, normalizePhone } from '@/lib/customer-utils';
import {
  createCustomer,
  findCustomerMatches,
  findOrCreateCustomerFromCheckout,
  updateCustomer,
  archiveCustomer,
} from '@/server/services/customer-service';
import { searchCustomers } from '@/server/services/customer-search-service';
import { getCustomerMetrics } from '@/server/services/customer-metrics-service';
import { createCustomerAddress } from '@/server/services/customer-address-service';
import { createCustomerTag, attachTagToCustomer } from '@/server/services/customer-tag-service';
import { createCustomerNote } from '@/server/services/customer-timeline-service';

const results: { name: string; pass: boolean; detail?: string }[] = [];

function test(name: string, pass: boolean, detail?: string) {
  results.push({ name, pass, detail });
  console.log(`${pass ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  console.log('\nOMINO Phase 6 Tests\n');

  const ts = Date.now();
  const orgA = await prisma.organization.create({
    data: { name: `P6 A ${ts}`, slug: `p6-a-${ts}`, currency: 'USD', country: 'PS' },
  });
  const orgB = await prisma.organization.create({
    data: { name: `P6 B ${ts}`, slug: `p6-b-${ts}`, currency: 'USD', country: 'PS' },
  });

  const hash = await bcrypt.hash('Test1234!', 12);
  const userA = await prisma.user.create({
    data: { email: `p6-a-${ts}@omino.test`, passwordHash: hash, fullName: 'User A' },
  });

  test('Normalize email', normalizeEmail(' John@Example.COM ') === 'john@example.com');
  test('Normalize phone', normalizePhone('+1 (555) 123-4567') === '15551234567');

  const customer = await createCustomer(orgA.id, userA.id, {
    firstName: 'Jane',
    lastName: 'Doe',
    email: `jane-${ts}@example.com`,
    phone: '+970599123456',
    source: 'MANUAL',
  });
  test('Create customer', !!customer.id);
  test('Display name', customer.name === 'Jane Doe');
  test('Email normalized', customer.emailNormalized === `jane-${ts}@example.com`);

  let dupBlocked = false;
  try {
    await createCustomer(orgA.id, userA.id, {
      email: `jane-${ts}@example.com`,
      name: 'Jane Duplicate',
    });
  } catch (e) {
    dupBlocked = e instanceof Error && e.message === 'DUPLICATE_CUSTOMER';
  }
  test('Duplicate email blocked', dupBlocked);

  const matches = await findCustomerMatches(orgA.id, {
    email: `jane-${ts}@example.com`,
  });
  test('Find matches by email', matches.length === 1);

  await updateCustomer(orgA.id, customer.id, userA.id, {
    phone: '+970599999999',
  });
  const updated = await prisma.customer.findUnique({ where: { id: customer.id } });
  test('Update customer phone', updated?.phoneNormalized === '970599999999');

  const tag = await createCustomerTag(orgA.id, { name: 'VIP' });
  await attachTagToCustomer(orgA.id, customer.id, tag.id, userA.id);
  test('Attach tag', true);

  await createCustomerAddress(orgA.id, customer.id, userA.id, {
    addressLine1: '123 Main St',
    city: 'Ramallah',
    country: 'PS',
    type: 'SHIPPING',
    isDefault: true,
  });
  const addresses = await prisma.customerAddress.count({ where: { customerId: customer.id } });
  test('Create address', addresses === 1);

  await createCustomerNote(orgA.id, customer.id, userA.id, 'Preferred contact by email');
  const notes = await prisma.customerNote.count({ where: { customerId: customer.id } });
  test('Create internal note', notes === 1);

  const store = await prisma.store.create({
    data: { organizationId: orgA.id, name: 'Store', slug: 'store', isDefault: true },
  });
  const branch = await prisma.branch.create({
    data: { storeId: store.id, name: 'Main', slug: 'main', isDefault: true },
  });
  await prisma.order.create({
    data: {
      organizationId: orgA.id,
      storeId: store.id,
      branchId: branch.id,
      userId: userA.id,
      customerId: customer.id,
      orderNumber: `OM-${ts}-001`,
      source: 'POS',
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      fulfillmentStatus: 'FULFILLED',
      subtotalMinor: 5000,
      totalMinor: 5000,
      paidMinor: 5000,
      customerName: customer.name,
      completedAt: new Date(),
    },
  });

  const metrics = await getCustomerMetrics(orgA.id, customer.id);
  test('Customer metrics orders', metrics.totalOrders === 1);
  test('Customer metrics revenue', metrics.totalRevenueMinor === 5000);

  const checkoutCustomer = await findOrCreateCustomerFromCheckout(orgA.id, {
    email: `jane-${ts}@example.com`,
    source: 'ONLINE_STORE',
  });
  test('Checkout match existing', checkoutCustomer.id === customer.id);

  const listA = await searchCustomers({ organizationId: orgA.id, search: 'Jane' });
  const listB = await searchCustomers({ organizationId: orgB.id });
  test('Search org A', listA.total >= 1);
  test('Tenant isolation', listB.total === 0);

  await archiveCustomer(orgA.id, customer.id, userA.id);
  const archived = await prisma.customer.findUnique({ where: { id: customer.id } });
  test('Archive customer', archived?.deletedAt != null);

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
