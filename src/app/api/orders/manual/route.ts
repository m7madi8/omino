import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import { createManualOrder } from '@/server/services/manual-order-service';
import { prisma } from '@/lib/db';

const schema = z.object({
  customerName: z.string().min(1).max(120),
  phone: z.string().min(5).max(30),
  variantId: z.string().uuid(),
  quantity: z.number().int().positive(),
  address: z.string().max(500).optional(),
  city: z.string().max(120).optional(),
  country: z.string().length(2).optional(),
  paymentMethod: z.enum(['COD', 'CASH', 'CARD', 'OTHER']),
  notes: z.string().max(1000).optional(),
});

export async function POST(request: Request) {
  try {
    const ctx = await requireTenantContext('orders.write');
    if (!ctx.storeId || !ctx.branchId) {
      return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
    }

    const body = schema.parse(await request.json());
    const store = await prisma.store.findFirst({
      where: { id: ctx.storeId, organizationId: ctx.organizationId },
      select: { taxRateBps: true },
    });

    const order = await createManualOrder({
      organizationId: ctx.organizationId,
      storeId: ctx.storeId,
      branchId: ctx.branchId,
      userId: ctx.userId,
      currency: ctx.currency,
      taxRateBps: store?.taxRateBps ?? 0,
      customerName: body.customerName,
      phone: body.phone,
      variantId: body.variantId,
      quantity: body.quantity,
      address: body.address,
      city: body.city,
      country: body.country,
      paymentMethod: body.paymentMethod,
      notes: body.notes,
    });

    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
