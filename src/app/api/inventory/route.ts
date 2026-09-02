import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import {
  adjustStock,
  listInventory,
  listStockLocations,
  createStockTransfer,
  completeStockTransfer,
} from '@/server/services/inventory-service';

export async function GET(request: Request) {
  try {
    const ctx = await requireTenantContext('inventory.read');
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view');

    if (view === 'locations') {
      const locations = await listStockLocations(ctx.organizationId);
      return NextResponse.json({ locations });
    }

    const result = await listInventory({
      organizationId: ctx.organizationId,
      stockLocationId: searchParams.get('stockLocationId') || undefined,
      lowStockOnly: searchParams.get('lowStock') === 'true',
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1', 10),
      pageSize: parseInt(searchParams.get('pageSize') || '25', 10),
    });

    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}

const adjustSchema = z.object({
  variantId: z.string().uuid(),
  stockLocationId: z.string().uuid(),
  quantityDelta: z.number().int().refine((n) => n !== 0, 'Delta cannot be zero'),
  reason: z.string().min(1).max(500),
  type: z
    .enum(['ADJUSTMENT', 'PURCHASE', 'DAMAGE', 'RETURN'])
    .optional()
    .default('ADJUSTMENT'),
});

const transferSchema = z.object({
  fromLocationId: z.string().uuid(),
  toLocationId: z.string().uuid(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      variantId: z.string().uuid(),
      quantity: z.number().int().positive(),
    })
  ),
});

export async function POST(request: Request) {
  try {
    const ctx = await requireTenantContext('inventory.write');
    const body = await request.json();

    if (body.action === 'adjust') {
      const parsed = adjustSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
      }

      const result = await adjustStock({
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        variantId: parsed.data.variantId,
        stockLocationId: parsed.data.stockLocationId,
        quantityDelta: parsed.data.quantityDelta,
        type: parsed.data.type,
        reason: parsed.data.reason,
        referenceType: 'ManualAdjustment',
      });

      return NextResponse.json(result);
    }

    if (body.action === 'transfer') {
      const parsed = transferSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
      }

      const transfer = await createStockTransfer({
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        ...parsed.data,
      });

      return NextResponse.json({ transfer }, { status: 201 });
    }

    if (body.action === 'completeTransfer') {
      const transferId = z.string().uuid().parse(body.transferId);
      const transfer = await completeStockTransfer(
        ctx.organizationId,
        ctx.userId,
        transferId
      );
      return NextResponse.json({ transfer });
    }

    return NextResponse.json({ error: 'UNKNOWN_ACTION' }, { status: 400 });
  } catch (err) {
    return handleApiError(err);
  }
}
