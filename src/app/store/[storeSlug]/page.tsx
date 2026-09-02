import Link from 'next/link';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import {
  listStorefrontCatalogSections,
  listStorefrontFeaturedProducts,
  resolveStoreByPublicSlug,
  toStorefrontStore,
} from '@/server/services/storefront-service';
import { ProductCardSkeleton } from '@/components/storefront/skeleton';
import { HomepageSections } from '@/components/storefront/homepage-sections';

function HomeCatalogSkeleton() {
  return (
    <div className="space-y-12">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="space-y-6">
          <div className="h-8 w-48 sf-skeleton rounded-sm" />
          <div className="grid grid-cols-12 gap-4">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="col-span-6 sm:col-span-4">
                <ProductCardSkeleton />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function StoreHomePage({
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

  if (store.status === 'PAUSED') {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-display sf-ink">{store.name}</h1>
        <p className="mt-3 sf-muted">This store is temporarily paused.</p>
      </div>
    );
  }

  const [{ sections, categories }, featuredProducts] = await Promise.all([
    listStorefrontCatalogSections(raw.id, raw.organizationId, { limitPerSection: 5 }),
    listStorefrontFeaturedProducts(raw.id, raw.organizationId, 8),
  ]);

  const experienceSections = store.experience.sections;
  const hasHeroSection = experienceSections.some((s) => s.type === 'hero' && s.enabled);
  const showFallbackHeader = !hasHeroSection || !store.hero.enabled;

  return (
    <>
      {showFallbackHeader && (
        <section className="text-center max-w-2xl mx-auto space-y-4 py-10 sm:py-14 px-4">
          <h1 className="text-4xl font-display sf-ink">{store.name}</h1>
          {store.description && <p className="sf-muted text-lg">{store.description}</p>}
          <Link
            href={`/store/${storeSlug}/products`}
            className="sf-btn-primary sf-btn-hero inline-flex items-center justify-center min-h-[48px] px-8 rounded-[var(--sf-radius)] text-sm font-medium"
          >
            Shop now
          </Link>
        </section>
      )}

      <Suspense fallback={<HomeCatalogSkeleton />}>
        <HomepageSections
          sections={experienceSections}
          hero={store.hero}
          storeSlug={storeSlug}
          storeName={store.name}
          currency={store.currency}
          catalogSections={sections}
          categories={categories}
          featuredProducts={featuredProducts}
        />
      </Suspense>
    </>
  );
}
