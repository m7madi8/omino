/** Storefront domain events — persisted for analytics and AI. */

import {
  recordStorefrontEvent,
  type StorefrontEventType,
} from '@/server/services/storefront-analytics-service';

export type { StorefrontEventType };

export type StorefrontEventPayload = {
  type: StorefrontEventType | string;
  organizationId: string;
  storeId: string;
  sessionId?: string;
  visitorId?: string;
  productId?: string;
  categoryId?: string;
  collectionId?: string;
  searchQuery?: string;
  orderId?: string;
  cartId?: string;
  payload?: Record<string, unknown>;
};

export async function emitStorefrontEvent(event: StorefrontEventPayload): Promise<void> {
  try {
    await recordStorefrontEvent(event);
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[storefront-event] failed to persist', event.type, err);
    }
  }
}
