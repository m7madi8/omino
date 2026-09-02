import { NextResponse } from 'next/server';
import { validateCoupon } from '@/server/services/marketing/promotion-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await validateCoupon({
      organizationId: body.organizationId,
      code: body.code,
      subtotalMinor: body.subtotalMinor ?? 0,
      customerId: body.customerId,
      storeId: body.storeId,
      items: body.items,
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ valid: false, error: 'VALIDATION_FAILED' }, { status: 400 });
  }
}
