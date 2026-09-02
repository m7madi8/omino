/**
 * Phase 1 integration tests — run against a seeded local database.
 * Usage: npm run test:phase1
 */

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';

type TestResult = { name: string; pass: boolean; detail?: string };

const results: TestResult[] = [];

function test(name: string, pass: boolean, detail?: string) {
  results.push({ name, pass, detail });
  console.log(`${pass ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function jsonFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function main() {
  console.log('\nOMINO Phase 1 Tests\n');

  // Public routes
  const mainRes = await fetch(`${BASE}/main/`);
  test('Marketing site /main/ is accessible', mainRes.ok, `status ${mainRes.status}`);

  const loginRes = await fetch(`${BASE}/login`);
  test('Login page accessible', loginRes.ok);

  const appRes = await fetch(`${BASE}/app`, { redirect: 'manual' });
  test('Unauthenticated /app redirects', appRes.status === 307 || appRes.status === 302);

  // Signup User A
  const userA = {
    fullName: 'Test User A',
    email: `user-a-${Date.now()}@test.omino.local`,
    phone: '+970599111111',
    password: 'TestPass123!',
  };

  const signupA = await jsonFetch('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(userA),
  });
  test('User A signup', signupA.res.ok, signupA.data.error);

  // Note: cookie-based session tests require browser context.
  // Below tests verify API validation without session.

  const onboardingNoAuth = await jsonFetch('/api/onboarding', {
    method: 'POST',
    body: JSON.stringify({
      businessName: 'Org A',
      businessType: 'retail',
      country: 'PS',
      currency: 'ILS',
    }),
  });
  test('Onboarding requires auth', onboardingNoAuth.res.status === 401);

  const orgNoAuth = await fetch(`${BASE}/api/organization`);
  test('Organization API requires auth', orgNoAuth.status === 401);

  console.log('\n--- Summary ---');
  const passed = results.filter((r) => r.pass).length;
  console.log(`${passed}/${results.length} passed`);
  console.log('\nManual tests required:');
  console.log('  1. Sign up User A → complete onboarding → access /app');
  console.log('  2. Sign up User B → verify cannot see User A org data');
  console.log('  3. Test role permissions with demo accounts (owner@demo.omino.test)');
  console.log('  4. Test responsive app shell on mobile');
  console.log('  5. Verify /main marketing site unchanged\n');

  if (passed < results.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
