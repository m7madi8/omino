import { NextResponse } from 'next/server';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import { listPayments } from '@/server/services/payment-service';

export async function GET(request: Request) {
  try {
    const ctx = await requireTenantContext('payments.read');
    const { searchParams } = new URL(request.url);

    const result = await listPayments({
      organizationId: ctx.organizationId,
      orderId: searchParams.get('orderId') || undefined,
      page: parseInt(searchParams.get('page') || '1', 10),
      pageSize: parseInt(searchParams.get('pageSize') || '25', 10),
    });

    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
