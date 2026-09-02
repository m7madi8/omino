import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import { listOrders } from '@/server/services/order-service';
import type { OrderSource } from '@/types/prisma-enums';

export async function GET(request: Request) {
  try {
    const ctx = await requireTenantContext('orders.read');
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || undefined;
    const status = searchParams.get('status') as 'COMPLETED' | 'CANCELLED' | undefined;
    const source = searchParams.get('source') as OrderSource | undefined;
    const codPending = searchParams.get('cod') === 'pending';
    const page = Number(searchParams.get('page') || '1');

    const result = await listOrders({
      organizationId: ctx.organizationId,
      storeId: ctx.storeId ?? undefined,
      source,
      codPending,
      search,
      status,
      page,
    });

    return Response.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
