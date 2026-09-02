/**
 * Safe read-only DB connectivity test.
 * Run: npx tsx scripts/test-db-connection.ts
 */
import { PrismaClient } from '@prisma/client';

function parseHostPort(databaseUrl: string): { host: string; port: string } | null {
  try {
    const parsed = new URL(databaseUrl.replace(/^postgresql:/, 'http:'));
    return {
      host: parsed.hostname,
      port: parsed.port || '5432',
    };
  } catch {
    const match = databaseUrl.match(/@([^:/@]+):?(\d+)?\//);
    if (!match) return null;
    return { host: match[1], port: match[2] || '5432' };
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('SUPABASE CONNECTION: FAILED');
    console.error('Reason: DATABASE_URL is not set');
    process.exit(1);
  }

  const endpoint = parseHostPort(databaseUrl);
  const isLocalhost = endpoint?.host === 'localhost' || endpoint?.host === '127.0.0.1';

  if (isLocalhost) {
    console.error('SUPABASE CONNECTION: FAILED');
    console.error(`Reason: DATABASE_URL still points to localhost (${endpoint?.host}:${endpoint?.port})`);
    process.exit(1);
  }

  if (databaseUrl.includes('[YOUR-PASSWORD]') || databaseUrl.includes('[PASSWORD]')) {
    console.error('SUPABASE CONNECTION: FAILED');
    console.error('Reason: DATABASE_URL contains a placeholder password — replace with real Supabase DB password');
    if (endpoint) console.error(`Target: ${endpoint.host}:${endpoint.port}`);
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    await prisma.$queryRaw`SELECT 1 as ok`;
    console.log('SUPABASE CONNECTION: SUCCESS');
    if (endpoint) {
      console.log(`Host: ${endpoint.host}`);
      console.log(`Port: ${endpoint.port}`);
    }
  } catch (err) {
    console.error('SUPABASE CONNECTION: FAILED');
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Can't reach database server")) {
      console.error('Reason: Cannot reach database server (DNS/network/firewall)');
    } else if (msg.includes('Authentication failed') || msg.includes('password')) {
      console.error('Reason: Authentication failed (username/password)');
    } else if (msg.includes('SSL') || msg.includes('certificate')) {
      console.error('Reason: SSL/TLS connection issue');
    } else if (msg.includes('ENOTFOUND')) {
      console.error('Reason: DNS lookup failed for hostname');
    } else {
      console.error(`Reason: ${msg.slice(0, 300)}`);
    }
    if (endpoint) console.error(`Target: ${endpoint.host}:${endpoint.port}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
