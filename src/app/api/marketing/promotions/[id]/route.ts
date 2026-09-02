import { NextResponse } from 'next/server';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import {
  getPromotion,
  updatePromotionStatus,
} from '@/server/services/marketing/promotion-service';
import { getPromotionUsageStats } from '@/server/services/marketing/marketing-analytics-service';
import type { MarketingPromotionStatus } from '@prisma/client';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireTenantContext('marketing.read');
    const { id } = await params;
    const promotion = await getPromotion(ctx.organizationId, id);
    const usage = await getPromotionUsageStats(ctx.organizationId, id);
    return NextResponse.json({ promotion, usage });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const ctx = await requireTenantContext('marketing.manage_promotions');
    const { id } = await params;
    const body = await request.json();

    if (body.status) {
      await updatePromotionStatus(
        ctx.organizationId,
        id,
        body.status as MarketingPromotionStatus,
        ctx.userId
      );
    }

    const promotion = await getPromotion(ctx.organizationId, id);
    return NextResponse.json({ promotion });
  } catch (err) {
    return handleApiError(err);
  }
}
