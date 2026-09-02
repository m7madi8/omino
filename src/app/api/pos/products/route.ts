import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import { searchPosProducts } from '@/server/services/pos-service';

export async function GET(request: Request) {
  try {
    const ctx = await requireTenantContext('pos.read');
    if (!ctx.storeId || !ctx.branchId) {
      return Response.json({ error: 'NO_BRANCH_CONTEXT' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || searchParams.get('barcode') || undefined;

    const items = await searchPosProducts(
      {
        organizationId: ctx.organizationId,
        storeId: ctx.storeId,
        branchId: ctx.branchId,
        userId: ctx.userId,
        currency: ctx.currency,
      },
      q
    );

    return Response.json({ items });
  } catch (err) {
    return handleApiError(err);
  }
}
