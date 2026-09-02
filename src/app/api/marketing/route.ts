import { NextResponse } from 'next/server';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import { getMarketingOverview } from '@/server/services/marketing/marketing-analytics-service';
import { CAMPAIGN_TEMPLATES } from '@/server/services/marketing/templates';

export async function GET(request: Request) {
  try {
    const ctx = await requireTenantContext('marketing.read');
    const { searchParams } = new URL(request.url);

    if (searchParams.get('view') === 'templates') {
      return NextResponse.json({ templates: CAMPAIGN_TEMPLATES });
    }

    const overview = await getMarketingOverview(ctx.organizationId, ctx.storeId ?? undefined);
    return NextResponse.json({ overview });
  } catch (err) {
    return handleApiError(err);
  }
}
