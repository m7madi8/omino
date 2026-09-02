import { notFound } from 'next/navigation';
import { resolveStoreByPublicSlug, toStorefrontStore } from '@/server/services/storefront-service';
import { CartView } from '@/components/storefront/cart-view';

export default async function CartPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;

  let raw;
  try {
    raw = await resolveStoreByPublicSlug(storeSlug);
  } catch {
    notFound();
  }

  const store = toStorefrontStore(raw);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display">Your cart</h1>
      <CartView storeSlug={storeSlug} currency={store.currency} />
    </div>
  );
}
