import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import {
  deleteDeliveryZone,
  listDeliveryZones,
  upsertDeliveryZone,
} from '@/server/services/delivery-zone-service';

export async function GET() {
  try {
    const ctx = await requireTenantContext('store.read');
    if (!ctx.storeId) {
      return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
    }
    const zones = await listDeliveryZones(ctx.organizationId, ctx.storeId);
    return NextResponse.json({ zones });
  } catch (err) {
    return handleApiError(err);
  }
}

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  priceMinor: z.number().int().min(0),
  isActive: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const ctx = await requireTenantContext('store.write');
    if (!ctx.storeId) {
      return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
    }
    const body = upsertSchema.parse(await request.json());
    const zone = await upsertDeliveryZone(ctx.organizationId, ctx.storeId, body);
    return NextResponse.json({ zone });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request: Request) {
  try {
    const ctx = await requireTenantContext('store.write');
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
    await deleteDeliveryZone(ctx.organizationId, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
