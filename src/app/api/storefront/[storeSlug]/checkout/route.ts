import { z } from 'zod';
import { handleStorefrontError } from '@/lib/api/storefront';
import { allowedCountrySchema } from '@/lib/geo/allowed-countries';
import { ensureGuestSessionToken } from '@/lib/storefront/session';
import {
  checkoutOnline,
  getShippingMethodsForStore,
  resolveStoreByPublicSlug,
} from '@/server/services/storefront-service';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const store = await resolveStoreByPublicSlug(storeSlug);
    const methods = await getShippingMethodsForStore(store.id, store.organizationId);
    return Response.json({ methods });
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
    const token = await ensureGuestSessionToken(storeSlug);

    const body = z
      .object({
        fullName: z.string().min(2).max(120),
        email: z.string().email(),
        phone: z.string().optional(),
        address: z.string().min(3).max(300),
        city: z.string().min(2).max(100),
        country: allowedCountrySchema,
        notes: z.string().max(500).optional(),
        shippingMethodId: z.string().uuid(),
        paymentMethod: z.literal('COD'),
        idempotencyKey: z.string().uuid(),
      })
      .parse(await request.json());

    const order = await checkoutOnline(
      {
        id: store.id,
        organizationId: store.organizationId,
        name: store.name,
        currency: store.currency,
        taxRateBps: store.taxRateBps,
        status: store.status,
      },
      token,
      body
    );

    return Response.json({
      orderNumber: order.orderNumber,
      accessToken: order.accessToken,
      totalMinor: order.totalMinor,
      currency: order.currency,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
    }
    return handleStorefrontError(err);
  }
}
