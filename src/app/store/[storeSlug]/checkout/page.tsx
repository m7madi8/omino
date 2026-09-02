import { notFound } from 'next/navigation';
import { resolveStoreByPublicSlug, toStorefrontStore } from '@/server/services/storefront-service';
import { CheckoutForm } from '@/components/storefront/checkout-form';

export default async function CheckoutPage({
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

  if (store.status !== 'ACTIVE') {
    return <p className="text-center text-stone-2 py-20">Checkout is unavailable.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display">Checkout</h1>
      <CheckoutForm storeSlug={storeSlug} currency={store.currency} />
    </div>
  );
}
