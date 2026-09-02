import { NextResponse } from 'next/server';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import { listPromotions, createPromotion } from '@/server/services/marketing/promotion-service';
import type { DiscountType, MarketingPromotionStatus } from '@prisma/client';

export async function GET() {
  try {
    const ctx = await requireTenantContext('marketing.read');
    const promotions = await listPromotions(ctx.organizationId, ctx.storeId ?? undefined);
    return NextResponse.json({ promotions });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireTenantContext('marketing.manage_promotions');
    const body = await request.json();

    const promotion = await createPromotion(ctx.organizationId, ctx.userId, {
      name: body.name,
      description: body.description,
      discountType: body.discountType as DiscountType,
      discountValue: body.discountValue,
      minOrderMinor: body.minOrderMinor,
      productIds: body.productIds,
      categoryIds: body.categoryIds,
      customerTagIds: body.customerTagIds,
      audienceId: body.audienceId,
      usageLimit: body.usageLimit,
      perCustomerLimit: body.perCustomerLimit,
      startsAt: body.startsAt,
      endsAt: body.endsAt,
      storeId: body.storeId ?? ctx.storeId ?? undefined,
      couponCode: body.couponCode,
      status: (body.status as MarketingPromotionStatus) ?? 'DRAFT',
    });

    return NextResponse.json({ promotion }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
