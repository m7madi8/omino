import { StorefrontError } from '@/server/services/storefront-service';

export function handleStorefrontError(err: unknown) {
  if (err instanceof StorefrontError) {
    const status =
      err.code === 'STORE_NOT_FOUND' || err.code === 'PRODUCT_NOT_FOUND' || err.code === 'ORDER_NOT_FOUND'
        ? 404
        : err.code === 'INSUFFICIENT_STOCK' ||
            err.code === 'PRICE_CHANGED' ||
            err.code === 'PRODUCT_UNAVAILABLE'
          ? 409
          : err.code === 'STORE_UNAVAILABLE'
            ? 503
            : 400;
    return Response.json({ error: err.code, message: err.message }, { status });
  }
  if (err instanceof Error && err.message === 'SLUG_TAKEN') {
    return Response.json({ error: 'SLUG_TAKEN' }, { status: 409 });
  }
  console.error(err);
  return Response.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
}
