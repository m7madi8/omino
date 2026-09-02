import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const started = Date.now();
  let dbOk = false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  const status = dbOk ? 'healthy' : 'degraded';
  const httpStatus = dbOk ? 200 : 503;

  return NextResponse.json(
    {
      status,
      version: process.env.npm_package_version ?? '0.1.0',
      uptime: process.uptime(),
      checks: {
        database: dbOk ? 'ok' : 'error',
      },
      responseMs: Date.now() - started,
    },
    {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
