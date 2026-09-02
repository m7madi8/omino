import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import {
  listStorefrontCatalogSections,
  resolveStoreByPublicSlug,
  toStorefrontStore,
} from '@/server/services/storefront-service';
import { CategoryProductSections } from '@/components/storefront/category-product-sections';
import { ProductCardSkeleton } from '@/components/storefront/skeleton';

function CatalogSkeleton() {
  return (
    <div className="space-y-10">
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-11 w-24 rounded-full sf-skeleton shrink-0" />
        ))}
      </div>
      <div className="grid grid-cols-12 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="col-span-6 sm:col-span-4">
            <ProductCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeSlug: string }>;
  searchParams: Promise<{ q?: string; page?: string; category?: string }>;
}) {
  const { storeSlug } = await params;
  const sp = await searchParams;

  let raw;
  try {
    raw = await resolveStoreByPublicSlug(storeSlug);
  } catch {
    notFound();
  }

  const store = toStorefrontStore(raw);
  const { sections, total, categories } = await listStorefrontCatalogSections(
    raw.id,
    raw.organizationId,
    { search: sp.q }
  );

  const filteredTotal = sp.category
    ? sections.find((s) => s.category.slug === sp.category)?.products.length ?? 0
    : total;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display sf-ink tracking-tight">Products</h1>
          <p className="sf-muted mt-2">
            {filteredTotal} product{filteredTotal === 1 ? '' : 's'}
            {sp.category && categories.find((c) => c.slug === sp.category)
              ? ` · ${categories.find((c) => c.slug === sp.category)?.name}`
              : ''}
          </p>
        </div>
      </div>

      <form className="flex gap-2">
        {sp.category && <input type="hidden" name="category" value={sp.category} />}
        <input
          name="q"
          defaultValue={sp.q || ''}
          placeholder="Search products…"
          className="flex-1 h-11 min-h-[44px] px-4 rounded-sm border sf-border bg-[color-mix(in_srgb,var(--sf-surface)_80%,#fff)] text-sm outline-none focus:border-[var(--sf-primary)] sf-ink"
        />
        <button
          type="submit"
          className="h-11 min-h-[44px] px-5 rounded-sm sf-btn-primary text-sm font-medium"
        >
          Search
        </button>
      </form>

      <Suspense fallback={<CatalogSkeleton />}>
        <CategoryProductSections
          sections={sections}
          categories={categories}
          storeSlug={storeSlug}
          currency={store.currency}
        />
      </Suspense>
    </div>
  );
}
