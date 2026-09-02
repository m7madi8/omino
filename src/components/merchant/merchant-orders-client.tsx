'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatMoney } from '@/lib/money';
import { useMerchant } from '@/components/providers/merchant-provider';
import { formatLocaleForIntl } from '@/lib/merchant/palestine-mode';
import {
  getNextOrderAction,
  getOrderStageLabelKey,
  resolveMerchantOrderStage,
  type OrderLifecycleAction,
} from '@/lib/merchant/order-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { OrderSource, OrderStatus, PaymentStatus, FulfillmentStatus } from '@/types/prisma-enums';

export type MerchantOrderRow = {
  id: string;
  orderNumber: string;
  source: OrderSource;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  customerName: string | null;
  totalMinor: number;
  paidMinor: number;
  currency: string;
  createdAt: string;
  events?: { eventType: string }[];
};

const ACTION_LABEL_KEYS: Record<OrderLifecycleAction, string> = {
  confirm: 'orders.confirm',
  process: 'orders.processing',
  out_for_delivery: 'orders.outForDelivery',
  deliver: 'orders.delivered',
  collect_cod: 'orders.collectCod',
  cancel: 'orders.cancel',
};

const TABS = [
  { key: 'all', source: undefined as OrderSource | undefined },
  { key: 'online', source: 'ONLINE' as OrderSource },
  { key: 'pos', source: 'POS' as OrderSource },
  { key: 'manual', source: 'MANUAL' as OrderSource },
];

export function MerchantOrdersClient({
  initialOrders,
  currency,
}: {
  initialOrders: MerchantOrderRow[];
  currency: string;
}) {
  const { t, locale, dir } = useMerchant();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [busyId, setBusyId] = useState<string | null>(null);
  const activeTab = searchParams.get('tab') || (searchParams.get('cod') ? 'all' : 'all');
  const codFilter = searchParams.get('cod') === 'pending';

  const filtered = initialOrders.filter((o) => {
    if (codFilter) {
      return (
        o.paymentStatus === 'PENDING' &&
        o.status !== 'CANCELLED' &&
        o.status !== 'COMPLETED'
      );
    }
    const tab = TABS.find((tabItem) => tabItem.key === activeTab);
    if (!tab || tab.key === 'all') return true;
    return o.source === tab.source;
  });

  const runAction = useCallback(
    async (orderId: string, action: OrderLifecycleAction) => {
      setBusyId(orderId);
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      setBusyId(null);
      if (res.ok) router.refresh();
    },
    [router]
  );

  const tabLabel = (key: string) => {
    if (key === 'all') return t('orders.all');
    if (key === 'online') return t('orders.online');
    if (key === 'pos') return t('orders.pos');
    return t('orders.manual');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4" dir={dir}>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/app/orders?tab=${tab.key}`}
            prefetch={false}
            className={cn(
              'shrink-0 px-3 py-2 rounded-full text-sm border touch-manipulation min-h-[44px] flex items-center',
              activeTab === tab.key && !codFilter
                ? 'bg-accent text-white border-accent'
                : 'bg-white border-hairline text-stone-2'
            )}
          >
            {tabLabel(tab.key)}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center text-stone-2">{t('orders.empty')}</Card>
      ) : (
        <ul className="space-y-3">
          {filtered.map((order) => {
            const stage = resolveMerchantOrderStage(order);
            const nextAction = getNextOrderAction(stage);
            const isCod =
              order.paymentStatus === 'PENDING' && order.status !== 'COMPLETED';

            return (
              <li key={order.id}>
                <Card className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-sm">{order.orderNumber}</p>
                      <p className="font-medium truncate">{order.customerName || '—'}</p>
                      <p className="text-xs text-stone-2 mt-1">
                        {t(getOrderStageLabelKey(stage))}
                        {isCod ? ` · ${t('orders.codBadge')}` : ''}
                      </p>
                    </div>
                    <p className="font-medium shrink-0">
                      {formatMoney(order.totalMinor, order.currency || currency, formatLocaleForIntl(locale))}
                    </p>
                  </div>
                  {nextAction && (
                    <Button
                      size="sm"
                      className="w-full min-h-[44px] touch-manipulation"
                      disabled={busyId === order.id}
                      onClick={() => runAction(order.id, nextAction)}
                    >
                      {t(ACTION_LABEL_KEYS[nextAction] as Parameters<typeof t>[0])}
                    </Button>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
