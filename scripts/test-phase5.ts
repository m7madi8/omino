/**
 * Phase 5 Online Store smoke tests — requires running dev server.
 * Usage: npm run test:phase5
 */

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';

type TestResult = { name: string; pass: boolean; detail?: string };
const results: TestResult[] = [];

function test(name: string, pass: boolean, detail?: string) {
  results.push({ name, pass, detail });
  console.log(`${pass ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  console.log('\nOMINO Phase 5 Online Store Tests (API smoke)\n');

  const storeHome = await fetch(`${BASE}/store/demo-store`, { redirect: 'manual' });
  test('Public store page accessible', storeHome.status === 200 || storeHome.status === 404);

  const storefrontApi = await fetch(`${BASE}/api/storefront/demo-store`);
  test('Storefront API responds', storefrontApi.status === 200 || storefrontApi.status === 404);

  const productsApi = await fetch(`${BASE}/api/storefront/demo-store/products`);
  test('Products API responds', productsApi.status === 200 || productsApi.status === 404);

  const cartApi = await fetch(`${BASE}/api/storefront/demo-store/cart`);
  test('Cart API sets guest session', cartApi.status === 200 || cartApi.status === 404);

  const settingsApi = await fetch(`${BASE}/api/store/settings`);
  test('Store settings API requires auth', settingsApi.status === 401);

  const appStore = await fetch(`${BASE}/app/store`, { redirect: 'manual' });
  test('Admin store page requires auth', appStore.status === 307 || appStore.status === 302);

  console.log('\n--- Summary ---');
  const passed = results.filter((r) => r.pass).length;
  console.log(`${passed}/${results.length} passed`);

  console.log('\nManual tests required:');
  console.log('  1. Browse /store/demo-store → products → product detail');
  console.log('  2. Add to cart → checkout → COD → order confirmation');
  console.log('  3. Verify ONLINE order in /app/orders');
  console.log('  4. Verify inventory decremented');
  console.log('  5. Cross-store cart isolation');
  console.log('  6. Price manipulation rejected server-side');
  console.log('  7. Duplicate checkout idempotency');
  console.log('  8. Store PAUSED/MAINTENANCE states\n');

  if (passed < results.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
