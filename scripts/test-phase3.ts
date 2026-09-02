/**
 * Phase 3 POS integration tests — requires running dev server + seeded database.
 * Usage: npm run test:phase3
 */

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';

type TestResult = { name: string; pass: boolean; detail?: string };
const results: TestResult[] = [];

function test(name: string, pass: boolean, detail?: string) {
  results.push({ name, pass, detail });
  console.log(`${pass ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  console.log('\nOMINO Phase 3 POS Tests (API smoke)\n');

  const posPage = await fetch(`${BASE}/app/pos`, { redirect: 'manual' });
  test('Unauthenticated /app/pos redirects', posPage.status === 307 || posPage.status === 302);

  const ordersApi = await fetch(`${BASE}/api/orders`);
  test('Orders API requires auth', ordersApi.status === 401);

  const posProducts = await fetch(`${BASE}/api/pos/products`);
  test('POS products API requires auth', posProducts.status === 401);

  const posCarts = await fetch(`${BASE}/api/pos/carts`);
  test('POS carts API requires auth', posCarts.status === 401);

  const posSessions = await fetch(`${BASE}/api/pos/sessions`);
  test('POS sessions API requires auth', posSessions.status === 401);

  console.log('\n--- Summary ---');
  const passed = results.filter((r) => r.pass).length;
  console.log(`${passed}/${results.length} passed`);

  console.log('\nManual tests required:');
  console.log('  1. Open register → search product → add to cart → pay cash');
  console.log('  2. Verify inventory decrements after sale');
  console.log('  3. Attempt oversell — must reject with INSUFFICIENT_STOCK');
  console.log('  4. Double-click Pay — must create only one order (idempotency)');
  console.log('  5. Hold cart → resume → complete');
  console.log('  6. Void order (MANAGER+) — stock restored');
  console.log('  7. Multi-tenant isolation between orgs');
  console.log('  8. STAFF cannot void; MANAGER can\n');

  if (passed < results.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
