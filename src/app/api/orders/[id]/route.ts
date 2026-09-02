import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import { getOrderDetail, cancelOrder } from '@/server/services/order-service';
import { createRefund } from '@/server/services/payment-service';
import { voidPosOrder } from '@/server/services/pos-service';

const cancelSchema = z.object({
  reason: z.string().min(1).max(500),
});

const refundSchema = z.object({
  amountMinor: z.number().int().positive(),
  paymentId: z.string().uuid().optional(),
  reason: z.string().max(500).optional(),
  restockItems: z.boolean().optional(),
  idempotencyKey: z.string().max(128).optional(),
  items: z
    .array(
      z.object({
        orderItemId: z.string().uuid(),
        quantity: z.number().int().positive(),
      })
    )
    .optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireTenantContext('orders.read');
    const { id } = await params;
    const order = await getOrderDetail(ctx.organizationId, id);
    return NextResponse.json(order);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const action = body.action as string;

    if (action === 'void') {
      const ctx = await requireTenantContext('pos.void');
      if (!ctx.storeId || !ctx.branchId) {
        return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
      }
      const parsed = cancelSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
      }
      const order = await voidPosOrder(
        {
          organizationId: ctx.organizationId,
          storeId: ctx.storeId,
          branchId: ctx.branchId,
          userId: ctx.userId,
          currency: ctx.currency,
        },
        id,
        parsed.data.reason
      );
      return NextResponse.json(order);
    }

    if (action === 'cancel') {
      const ctx = await requireTenantContext('orders.cancel');
      const parsed = cancelSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
      }
      const order = await cancelOrder({
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        orderId: id,
        reason: parsed.data.reason,
      });
      return NextResponse.json(order);
    }

    if (action === 'refund') {
      const ctx = await requireTenantContext('orders.refund');
      const parsed = refundSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
      }
      const refund = await createRefund({
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        orderId: id,
        ...parsed.data,
      });
      return NextResponse.json(refund, { status: 201 });
    }

    return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
  } catch (err) {
    return handleApiError(err);
  }
}
