'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import {
  postgresFilterForTable,
  REALTIME_TABLES,
  tenantChannelName,
  type RealtimeScope,
} from '@/lib/realtime/channels';
import type {
  PostgresChangePayload,
  RealtimeConnectionStatus,
  RealtimeTable,
} from '@/lib/realtime/types';

type UseRealtimeSubscriptionOptions = {
  organizationId: string;
  storeId?: string | null;
  scope: RealtimeScope;
  enabled?: boolean;
  onChange: (payload: PostgresChangePayload) => void;
};

async function fetchRealtimeToken(): Promise<string | null> {
  const res = await fetch('/api/realtime/token', { credentials: 'include' });
  if (!res.ok) return null;
  const data = (await res.json()) as { accessToken?: string };
  return data.accessToken ?? null;
}

export function useRealtimeSubscription({
  organizationId,
  storeId,
  scope,
  enabled = true,
  onChange,
}: UseRealtimeSubscriptionOptions) {
  const [status, setStatus] = useState<RealtimeConnectionStatus>('disabled');
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      const client = channelRef.current;
      channelRef.current = null;
      void client.unsubscribe();
    }
  }, []);

  useEffect(() => {
    if (!enabled || !organizationId) {
      setStatus('disabled');
      cleanup();
      return;
    }

    let cancelled = false;
    let client: ReturnType<typeof createBrowserSupabaseClient> = null;

    async function connect() {
      setStatus('connecting');
      const token = await fetchRealtimeToken();
      if (cancelled) return;

      client = createBrowserSupabaseClient(token ?? undefined);
      if (!client || !token) {
        setStatus('disabled');
        return;
      }

      const channelName = tenantChannelName(organizationId, scope, storeId);
      const tables = REALTIME_TABLES[scope] ?? [];
      let channel = client.channel(channelName);

      for (const table of tables) {
        channel = channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
            filter: postgresFilterForTable(table as RealtimeTable, organizationId, storeId),
          },
          (payload) => {
            onChangeRef.current({
              eventType: payload.eventType as PostgresChangePayload['eventType'],
              table: table as RealtimeTable,
              new: (payload.new as Record<string, unknown>) ?? null,
              old: (payload.old as Record<string, unknown>) ?? null,
            });
          }
        );
      }

      channel.subscribe((subscribeStatus) => {
        if (cancelled) return;
        if (subscribeStatus === 'SUBSCRIBED') {
          setStatus('connected');
        } else if (subscribeStatus === 'CHANNEL_ERROR' || subscribeStatus === 'TIMED_OUT') {
          setStatus('offline');
        } else if (subscribeStatus === 'CLOSED') {
          setStatus('reconnecting');
        }
      });

      channelRef.current = channel;
    }

    void connect();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [organizationId, storeId, scope, enabled, cleanup]);

  return { status };
}
