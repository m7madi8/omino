'use client';

import { useEffect } from 'react';

export function StorefrontAnalyticsTracker({
  storeSlug,
  storeId,
  eventType = 'STORE_VIEWED',
}: {
  storeSlug: string;
  storeId: string;
  eventType?: string;
}) {
  useEffect(() => {
    const sessionKey = `omino-sf-session-${storeSlug}`;
    let sessionId = sessionStorage.getItem(sessionKey);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem(sessionKey, sessionId);
    }

    fetch(`/api/storefront/${storeSlug}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: eventType, sessionId }),
      keepalive: true,
    }).catch(() => {});
  }, [storeSlug, storeId, eventType]);

  return null;
}
