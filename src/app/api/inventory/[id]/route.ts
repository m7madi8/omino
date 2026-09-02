import { NextResponse } from 'next/server';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import { getVariantInventoryDetail } from '@/server/services/inventory-service';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireTenantContext('inventory.read');
    const { id } = await params;
    const variant = await getVariantInventoryDetail(ctx.organizationId, id);
    return NextResponse.json({ variant });
  } catch (err) {
    return handleApiError(err);
  }
}
