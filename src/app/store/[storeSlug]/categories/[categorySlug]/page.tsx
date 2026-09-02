import { notFound } from 'next/navigation';
import {
  listStorefrontCategories,
  listStorefrontProducts,
  resolveStoreByPublicSlug,
  toStorefrontStore,
} from '@/server/services/storefront-service';
import { ProductBentoGrid } from '@/components/storefront/product-bento-grid';
import { CategoryChips } from '@/components/storefront/category-chips';

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ storeSlug: string; categorySlug: string }>;
}) {
  const { storeSlug, categorySlug } = await params;

  let raw;
  try {
    raw = await resolveStoreByPublicSlug(storeSlug);
  } catch {
    notFound();
  }

  const store = toStorefrontStore(raw);
  const [productsResult, categories] = await Promise.all([
    listStorefrontProducts(raw.id, raw.organizationId, { categorySlug }),
    listStorefrontCategories(raw.id, raw.organizationId),
  ]);
  const { items, total } = productsResult;
  const categoryName =
    categories.find((c) => c.slug === categorySlug)?.name ?? categorySlug.replace(/-/g, ' ');

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display sf-ink capitalize tracking-tight">
            {categoryName}
          </h1>
          <p className="sf-muted mt-2">{total} products</p>
        </div>
        <CategoryChips categories={categories} storeSlug={storeSlug} />
      </div>
      <ProductBentoGrid products={items} storeSlug={storeSlug} currency={store.currency} layoutId />
      {!items.length && <p className="text-center sf-muted py-12">No products in this category.</p>}
    </div>
  );
}
