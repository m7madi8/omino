'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { useRealtimeSubscription } from '@/lib/realtime/use-realtime-subscription';

export function OrdersLiveRefresh({
  organizationId,
  storeId,
}: {
  organizationId: string;
  storeId?: string | null;
}) {
  const router = useRouter();

  const onChange = useCallback(() => {
    router.refresh();
  }, [router]);

  useRealtimeSubscription({
    organizationId,
    storeId,
    scope: 'orders',
    onChange,
  });

  return null;
}
