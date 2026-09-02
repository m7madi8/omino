import { cookies } from 'next/headers';
import { handleApiError } from '@/lib/api/tenant';
import { resolveStoreByPublicSlug } from '@/server/services/storefront-service';
import {
  getStorefrontAccountByCustomerId,
  listCustomerOrders,
  SESSION_COOKIE,
} from '@/server/services/storefront-customer-auth-service';
import { prisma } from '@/lib/db';

async function getSessionAccount(storeId: string) {
  const cookieStore = await cookies();
  const accountId = cookieStore.get(`${SESSION_COOKIE}_${storeId}`)?.value;
  if (!accountId) return null;
  return prisma.storefrontAccount.findFirst({
    where: { id: accountId, storeId },
    include: { customer: true },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const store = await resolveStoreByPublicSlug(storeSlug);
    const account = await getSessionAccount(store.id);

    if (!account) {
      return Response.json({ authenticated: false });
    }

    const orders = await listCustomerOrders(
      store.organizationId,
      account.customerId,
      store.id
    );

    return Response.json({
      authenticated: true,
      account: {
        id: account.id,
        email: account.email,
        name: account.customer.name,
        customerId: account.customerId,
      },
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        paymentStatus: o.paymentStatus,
        fulfillmentStatus: o.fulfillmentStatus,
        totalMinor: o.totalMinor,
        currency: o.currency,
        createdAt: o.createdAt.toISOString(),
        itemCount: o._count.items,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
