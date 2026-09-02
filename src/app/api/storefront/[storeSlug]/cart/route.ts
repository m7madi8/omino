import { z } from 'zod';
import { handleStorefrontError } from '@/lib/api/storefront';
import { ensureGuestSessionToken } from '@/lib/storefront/session';
import {
  addToStorefrontCart,
  getOrCreateGuestCart,
  resolveStoreByPublicSlug,
  setCartShipping,
  updateStorefrontCartItem,
  applyStorefrontCoupon,
  removeStorefrontCoupon,
} from '@/server/services/storefront-service';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const store = await resolveStoreByPublicSlug(storeSlug);
    const token = await ensureGuestSessionToken(storeSlug);
    const cart = await getOrCreateGuestCart(
      { id: store.id, organizationId: store.organizationId, currency: store.currency, taxRateBps: store.taxRateBps },
      token
    );
    return Response.json({ cart });
  } catch (err) {
    return handleStorefrontError(err);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const store = await resolveStoreByPublicSlug(storeSlug);
    if (store.status !== 'ACTIVE') {
      return Response.json({ error: 'STORE_UNAVAILABLE' }, { status: 503 });
    }

    const token = await ensureGuestSessionToken(storeSlug);
    const body = await request.json();
    const ctx = {
      id: store.id,
      organizationId: store.organizationId,
      taxRateBps: store.taxRateBps,
    };

    if (body.action === 'add') {
      const data = z
        .object({ variantId: z.string().uuid(), quantity: z.number().int().positive().optional() })
        .parse(body);
      const cart = await addToStorefrontCart(ctx, token, data);
      return Response.json({ cart });
    }

    if (body.action === 'update') {
      const data = z.object({ itemId: z.string().uuid(), quantity: z.number().int() }).parse(body);
      const cart = await updateStorefrontCartItem(ctx, token, data.itemId, data.quantity);
      return Response.json({ cart });
    }

    if (body.action === 'shipping') {
      const data = z.object({ shippingMethodId: z.string().uuid() }).parse(body);
      const cart = await setCartShipping(ctx, token, data.shippingMethodId);
      return Response.json({ cart });
    }

    if (body.action === 'coupon') {
      if (body.remove) {
        const cart = await removeStorefrontCoupon(ctx, token);
        return Response.json({ cart });
      }
      const data = z.object({ code: z.string().min(1).max(50) }).parse(body);
      const cart = await applyStorefrontCoupon(ctx, token, data.code);
      return Response.json({ cart });
    }

    return Response.json({ error: 'UNKNOWN_ACTION' }, { status: 400 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
    }
    return handleStorefrontError(err);
  }
}
