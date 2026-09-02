import { NextResponse } from 'next/server';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import { parseDateRangePreset } from '@/lib/analytics/date-range';
import { getAnalyticsOverview, getBusinessContextSnapshot } from '@/server/services/analytics/analytics-service';
import type { OrderSource } from '@/types/prisma-enums';

function parseParams(request: Request, ctx: Awaited<ReturnType<typeof requireTenantContext>>) {
  const { searchParams } = new URL(request.url);
  return {
    organizationId: ctx.organizationId,
    storeId: searchParams.get('storeId') || ctx.storeId || undefined,
    branchId: searchParams.get('branchId') || ctx.branchId || undefined,
    channel: (searchParams.get('channel') as OrderSource) || undefined,
    preset: parseDateRangePreset(searchParams.get('preset')),
    from: searchParams.get('from') || undefined,
    to: searchParams.get('to') || undefined,
    currency: ctx.currency,
  };
}

export async function GET(request: Request) {
  try {
    const ctx = await requireTenantContext('analytics.read');
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view');

    const params = parseParams(request, ctx);

    if (view === 'context') {
      const context = await getBusinessContextSnapshot(params);
      return NextResponse.json({ context });
    }

    if (view === 'automations') {
      const { getAutomationMetrics } = await import('@/server/automation/automation-service');
      const metrics = await getAutomationMetrics(ctx.organizationId);
      return NextResponse.json({ automations: metrics });
    }

    const overview = await getAnalyticsOverview(params);
    return NextResponse.json({ overview });
  } catch (err) {
    return handleApiError(err);
  }
}
