import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { sessionHasPermission } from '@/lib/permissions/check';
import { listOrders } from '@/server/services/order-service';
import { PageHeader } from '@/components/app/dashboard/page-header';
import { MerchantOrdersSection } from '@/components/merchant/merchant-orders-section';
import { OrdersLiveRefresh } from '@/components/realtime/orders-live-refresh';
import { t } from '@/lib/i18n';
import { prisma } from '@/lib/db';

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; tab?: string; cod?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect('/login');
  if (!sessionHasPermission(session.user, 'orders.read')) redirect('/app');

  const params = await searchParams;
  const tab = params.tab;
  const source =
    tab === 'online' ? 'ONLINE' : tab === 'pos' ? 'POS' : tab === 'manual' ? 'MANUAL' : undefined;

  const { items: orders } = await listOrders({
    organizationId: session.user.organizationId,
    source,
    codPending: params.cod === 'pending',
    search: params.q,
    page: Number(params.page || '1'),
    pageSize: 50,
  });

  const orderEvents = await prisma.orderEvent.findMany({
    where: {
      organizationId: session.user.organizationId,
      orderId: { in: orders.map((o) => o.id) },
      eventType: { in: ['delivery.out_for_delivery', 'delivery.delivered'] },
    },
    select: { orderId: true, eventType: true },
  });

  const eventsByOrder = orderEvents.reduce<Record<string, { eventType: string }[]>>(
    (acc, e) => {
      acc[e.orderId] = acc[e.orderId] || [];
      acc[e.orderId].push({ eventType: e.eventType });
      return acc;
    },
    {}
  );

  const locale = session.user.locale;

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
      <OrdersLiveRefresh organizationId={session.user.organizationId} />
      <PageHeader
        eyebrow={t('nav.orders', locale)}
        title={t('nav.orders', locale)}
        actions={
          sessionHasPermission(session.user, 'orders.write') ? (
            <Link
              href="/app/orders/new"
              className="inline-flex items-center justify-center h-9 px-3 text-sm rounded-sm bg-ink text-paper hover:bg-ink-2"
            >
              {t('orders.new', locale)}
            </Link>
          ) : undefined
        }
      />
      <MerchantOrdersSection
        orders={orders.map((o) => ({
          ...o,
          events: eventsByOrder[o.id] || [],
        }))}
        currency={session.user.currency}
      />
    </div>
  );
}
