/**
 * OMINO Supabase integration tests.
 * Run: npm run test:supabase
 *
 * Requires DATABASE_URL and optionally Supabase env vars.
 * Skips realtime/storage tests when Supabase is not configured.
 */

import { prisma } from '../src/lib/db';
import {
  isSupabaseConfigured,
  isSupabaseRealtimeConfigured,
  isSupabaseStorageConfigured,
} from '../src/lib/supabase/config';

let passed = 0;
let failed = 0;
let skipped = 0;

function ok(name: string) {
  passed++;
  console.log(`  ✓ ${name}`);
}

function fail(name: string, err: unknown) {
  failed++;
  console.error(`  ✗ ${name}`, err);
}

function skip(name: string, reason: string) {
  skipped++;
  console.log(`  ○ ${name} (skipped: ${reason})`);
}

async function testDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    ok('PostgreSQL connection');
  } catch (err) {
    fail('PostgreSQL connection', err);
  }
}

async function testTenantIsolation() {
  try {
    const orgs = await prisma.organization.findMany({ take: 2, select: { id: true } });
    if (orgs.length < 2) {
      skip('Cross-tenant isolation', 'need at least 2 organizations in seed data');
      return;
    }

    const [orgA, orgB] = orgs;
    const ordersA = await prisma.order.findMany({
      where: { organizationId: orgA.id },
      take: 1,
    });
    if (!ordersA.length) {
      skip('Cross-tenant isolation', 'no orders for org A');
      return;
    }

    const leaked = await prisma.order.findFirst({
      where: { id: ordersA[0].id, organizationId: orgB.id },
    });
    if (leaked) {
      fail('Cross-tenant isolation', 'order visible under wrong org');
    } else {
      ok('Cross-tenant isolation (application layer)');
    }
  } catch (err) {
    fail('Cross-tenant isolation', err);
  }
}

async function testRlsHelpers() {
  try {
    const result = await prisma.$queryRaw<Array<{ fn: string | null }>>`
      SELECT proname::text AS fn
      FROM pg_proc
      WHERE proname IN ('app_current_organization_id', 'auth_organization_id')
    `;
    const names = result.map((r) => r.fn);
    if (names.includes('app_current_organization_id')) {
      ok('RLS helper app_current_organization_id exists');
    } else {
      skip('RLS helper app_current_organization_id', 'apply prisma/migrations/rls_policies.sql');
    }
    if (names.includes('auth_organization_id')) {
      ok('RLS helper auth_organization_id exists');
    } else {
      skip('RLS helper auth_organization_id', 'apply supabase/migrations/20260302100000_omino_foundation.sql');
    }
  } catch (err) {
    fail('RLS helpers', err);
  }
}

async function testSupabaseConfig() {
  if (isSupabaseConfigured()) {
    ok('Supabase URL + anon key configured');
  } else {
    skip('Supabase URL + anon key', 'set NEXT_PUBLIC_SUPABASE_* in .env');
  }

  if (isSupabaseStorageConfigured()) {
    ok('Supabase Storage (service role) configured');
  } else {
    skip('Supabase Storage', 'set SUPABASE_SERVICE_ROLE_KEY');
  }

  if (isSupabaseRealtimeConfigured()) {
    ok('Supabase Realtime JWT configured');
  } else {
    skip('Supabase Realtime JWT', 'set SUPABASE_JWT_SECRET');
  }
}

async function testMoneySafety() {
  try {
    const order = await prisma.order.findFirst({
      select: { totalMinor: true, subtotalMinor: true },
    });
    if (!order) {
      skip('Money stored as integers (minor units)', 'no orders');
      return;
    }
    if (Number.isInteger(order.totalMinor) && Number.isInteger(order.subtotalMinor)) {
      ok('Money stored as integers (minor units)');
    } else {
      fail('Money stored as integers', 'non-integer minor units found');
    }
  } catch (err) {
    fail('Money safety', err);
  }
}

async function main() {
  console.log('\nOMINO Supabase Integration Tests\n');

  await testDatabaseConnection();
  await testSupabaseConfig();
  await testRlsHelpers();
  await testTenantIsolation();
  await testMoneySafety();

  console.log(`\nResults: ${passed} passed, ${failed} failed, ${skipped} skipped\n`);
  await prisma.$disconnect();

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
