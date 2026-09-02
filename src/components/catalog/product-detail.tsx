'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProductStatusBadge, StockBadge } from '@/components/catalog/status-badge';
import {
  ProductImageUpload,
  type ExistingProductImage,
} from '@/components/catalog/product-image-upload';
import { formatMoney } from '@/lib/money';
import type { ProductStatus } from '@/types/prisma-enums';

type ProductDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: ProductStatus;
  productType: string;
  catalogKind?: 'SIMPLE' | 'BUNDLE';
  isFeatured?: boolean;
  brand: string | null;
  category: { name: string } | null;
  bundleItems?: {
    quantity: number;
    includedProduct: { id: string; name: string; slug: string };
  }[];
  images: { id: string; url: string; altText: string | null; isPrimary: boolean }[];
  variants: {
    id: string;
    sku: string;
    name: string | null;
    sellingPrice: number;
    costPrice: number | null;
    compareAtPrice: number | null;
    currency: string;
    barcode: string | null;
    barcodeType: string | null;
    lowStockThreshold: number | null;
    isDefault: boolean;
    stockLevels: {
      quantityOnHand: number;
      quantityReserved: number;
      stockLocation: { id: string; name: string };
    }[];
    optionValues: {
      optionValue: { value: string; option: { name: string } };
    }[];
  }[];
};

export function ProductDetailClient({
  product,
  canWrite,
}: {
  product: ProductDetail;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<'overview' | 'variants' | 'inventory' | 'images'>('overview');
  const [images, setImages] = useState<ExistingProductImage[]>(
    product.images.map((img) => ({
      id: img.id,
      url: img.url,
      altText: img.altText,
      isPrimary: img.isPrimary,
    }))
  );

  const defaultVariant = product.variants.find((v) => v.isDefault) || product.variants[0];
  const totalOnHand = product.variants.reduce(
    (s, v) => s + v.stockLevels.reduce((a, l) => a + l.quantityOnHand, 0),
    0
  );
  const totalReserved = product.variants.reduce(
    (s, v) => s + v.stockLevels.reduce((a, l) => a + l.quantityReserved, 0),
    0
  );
  const available = Math.max(0, totalOnHand - totalReserved);

  async function handleStatusChange(status: ProductStatus) {
    const res = await fetch(`/api/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) router.refresh();
  }

  async function handleFeaturedChange(isFeatured: boolean) {
    const res = await fetch(`/api/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFeatured }),
    });
    if (res.ok) router.refresh();
  }

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'variants' as const, label: 'Variants' },
    { id: 'inventory' as const, label: 'Inventory' },
    { id: 'images' as const, label: 'Images' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Link href="/app/products" className="p-2 -ml-2 rounded-sm hover:bg-paper-2">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl truncate">{product.name}</h1>
            <ProductStatusBadge status={product.status} />
          </div>
          {product.brand && <p className="text-stone-2 mt-1">{product.brand}</p>}
        </div>
        {canWrite && (
          <div className="flex gap-2">
            {product.status !== 'ACTIVE' && (
              <Button size="sm" onClick={() => handleStatusChange('ACTIVE')}>
                Activate
              </Button>
            )}
            {product.status !== 'ARCHIVED' && (
              <Button size="sm" variant="ghost" onClick={() => handleStatusChange('ARCHIVED')}>
                Archive
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-1 border-b border-hairline overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition ${
              tab === t.id
                ? 'border-accent text-ink'
                : 'border-transparent text-stone-2 hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <h2 className="text-lg font-display mb-4">Details</h2>
            <dl className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-stone">Type</dt>
                <dd className="font-medium capitalize">
                  {product.catalogKind === 'BUNDLE' ? 'Bundle' : product.productType.toLowerCase()}
                </dd>
              </div>
              <div>
                <dt className="text-stone">Category</dt>
                <dd className="font-medium">{product.category?.name || '—'}</dd>
              </div>
              {canWrite && (
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 text-sm min-h-[44px]">
                    <input
                      type="checkbox"
                      defaultChecked={product.isFeatured}
                      onChange={(e) => handleFeaturedChange(e.target.checked)}
                      className="rounded"
                    />
                    Feature on storefront home
                  </label>
                </div>
              )}
              <div>
                <dt className="text-stone">SKU</dt>
                <dd className="font-mono">{defaultVariant?.sku}</dd>
              </div>
              <div>
                <dt className="text-stone">Price</dt>
                <dd className="font-mono">
                  {defaultVariant
                    ? formatMoney(defaultVariant.sellingPrice, defaultVariant.currency)
                    : '—'}
                </dd>
              </div>
            </dl>
            {product.description && (
              <p className="mt-4 text-sm text-stone-2 leading-relaxed">{product.description}</p>
            )}
            {product.catalogKind === 'BUNDLE' && product.bundleItems && product.bundleItems.length > 0 && (
              <div className="mt-6 pt-4 border-t border-hairline">
                <h3 className="text-sm font-medium text-ink mb-2">Bundle contents</h3>
                <ul className="space-y-1 text-sm text-stone-2">
                  {product.bundleItems.map((item) => (
                    <li key={item.includedProduct.id}>
                      {item.includedProduct.name} × {item.quantity}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
          <Card>
            <h2 className="text-lg font-display mb-4">Stock summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-2">On hand</span>
                <span className="font-mono">{totalOnHand}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-2">Reserved</span>
                <span className="font-mono">{totalReserved}</span>
              </div>
              <div className="flex justify-between border-t border-hairline pt-3">
                <span className="font-medium">Available</span>
                <StockBadge
                  available={available}
                  isLowStock={
                    defaultVariant?.lowStockThreshold != null &&
                    available <= defaultVariant.lowStockThreshold
                  }
                />
              </div>
            </div>
            <Link href="/app/inventory" className="block mt-4">
              <Button variant="ghost" size="sm" className="w-full">
                View inventory
              </Button>
            </Link>
          </Card>
        </div>
      )}

      {tab === 'variants' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline text-left text-stone-2">
                  <th className="pb-3 font-medium">Variant</th>
                  <th className="pb-3 font-medium">SKU</th>
                  <th className="pb-3 font-medium">Options</th>
                  <th className="pb-3 font-medium text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {product.variants.map((v) => (
                  <tr key={v.id} className="border-b border-hairline last:border-0">
                    <td className="py-3">{v.name || product.name}</td>
                    <td className="py-3 font-mono text-xs">{v.sku}</td>
                    <td className="py-3 text-stone-2">
                      {v.optionValues.map((o) => o.optionValue.value).join(' / ') || '—'}
                    </td>
                    <td className="py-3 text-right font-mono">
                      {formatMoney(v.sellingPrice, v.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'inventory' && (
        <Card>
          {product.variants.flatMap((v) =>
            v.stockLevels.map((l) => (
              <div
                key={`${v.id}-${l.stockLocation.id}`}
                className="flex justify-between items-center py-3 border-b border-hairline last:border-0"
              >
                <div>
                  <p className="font-medium text-sm">{v.sku}</p>
                  <p className="text-xs text-stone-2">{l.stockLocation.name}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-mono">{l.quantityOnHand} on hand</p>
                  <p className="text-xs text-stone">{l.quantityReserved} reserved</p>
                </div>
              </div>
            ))
          )}
          {product.variants.every((v) => v.stockLevels.length === 0) && (
            <p className="text-stone-2 text-sm">No stock recorded yet.</p>
          )}
        </Card>
      )}

      {tab === 'images' && (
        <Card className="space-y-4">
          {canWrite ? (
            <ProductImageUpload
              mode="edit"
              productId={product.id}
              existingImages={images}
              onExistingChange={setImages}
            />
          ) : images.length === 0 ? (
            <p className="text-stone-2 text-sm">No images uploaded.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="aspect-square rounded-md border border-hairline overflow-hidden bg-paper-2"
                >
                  <img
                    src={img.url}
                    alt={img.altText || product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
