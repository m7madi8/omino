'use client';

import { Suspense } from 'react';
import { MerchantOrdersClient } from '@/components/merchant/merchant-orders-client';
import type { MerchantOrderRow } from '@/components/merchant/merchant-orders-client';

export function MerchantOrdersSection({
  orders,
  currency,
}: {
  orders: MerchantOrderRow[];
  currency: string;
}) {
  return (
    <Suspense fallback={null}>
      <MerchantOrdersClient initialOrders={orders} currency={currency} />
    </Suspense>
  );
}
