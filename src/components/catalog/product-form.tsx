'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { CategoryPicker } from '@/components/catalog/category-picker';
import { BundleItemPicker, type BundleItemDraft } from '@/components/catalog/bundle-item-picker';
import {
  ProductImageUpload,
  uploadPendingProductImages,
  type PendingProductImage,
} from '@/components/catalog/product-image-upload';
import { toMinorUnits } from '@/lib/money';
import { cn } from '@/lib/utils';

type Category = { id: string; name: string };
type Location = { id: string; name: string };

function optionalString(value: FormDataEntryValue | null): string | undefined {
  const text = String(value ?? '').trim();
  return text || undefined;
}

function formatProductApiError(data: {
  error?: string;
  details?: {
    fieldErrors?: Record<string, string[]>;
    formErrors?: string[];
  };
  issues?: { field: string; reason: string }[];
}) {
  if (process.env.NODE_ENV === 'development' && data.issues?.length) {
    return data.issues.map((issue) => `${issue.field}: ${issue.reason}`).join(' · ');
  }

  const fieldErrors = data.details?.fieldErrors;
  if (fieldErrors) {
    const first = Object.entries(fieldErrors).find(([, messages]) => messages?.length);
    if (first) return `${first[0]}: ${first[1][0]}`;
  }

  if (data.details?.formErrors?.length) {
    return data.details.formErrors[0];
  }

  return data.error || 'Failed to create product';
}

export function ProductForm({
  categories,
  locations,
  currency,
}: {
  categories: Category[];
  locations: Location[];
  currency: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'information' | 'media' | 'pricing' | 'inventory'>(
    'information'
  );
  const [categoryId, setCategoryId] = useState('');
  const [catalogKind, setCatalogKind] = useState<'SIMPLE' | 'BUNDLE'>('SIMPLE');
  const [isFeatured, setIsFeatured] = useState(false);
  const [bundleItems, setBundleItems] = useState<BundleItemDraft[]>([]);
  const [pendingImages, setPendingImages] = useState<PendingProductImage[]>([]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = new FormData(e.currentTarget);
    const name = optionalString(form.get('name'));
    const sellingPriceMajor = parseFloat(form.get('sellingPrice') as string);
    const costPriceMajor = optionalString(form.get('costPrice'))
      ? parseFloat(form.get('costPrice') as string)
      : undefined;
    const compareAtPriceMajor = optionalString(form.get('compareAtPrice'))
      ? parseFloat(form.get('compareAtPrice') as string)
      : undefined;
    const initialStock = optionalString(form.get('initialStock'))
      ? parseInt(form.get('initialStock') as string, 10)
      : undefined;

    if (!name) {
      setError('Product name is required.');
      setTab('information');
      setLoading(false);
      return;
    }

    if (!Number.isFinite(sellingPriceMajor) || sellingPriceMajor <= 0) {
      setError('Selling price is required.');
      setTab('pricing');
      setLoading(false);
      return;
    }

    if (catalogKind === 'BUNDLE' && bundleItems.length === 0) {
      setError('Add at least one product to the bundle.');
      setTab('information');
      setLoading(false);
      return;
    }

    const payload = {
      name,
      description: optionalString(form.get('description')),
      productType: optionalString(form.get('productType')) || 'PHYSICAL',
      catalogKind,
      isFeatured,
      brand: optionalString(form.get('brand')),
      categoryId: categoryId || undefined,
      status: optionalString(form.get('status')) || 'DRAFT',
      trackInventory: form.get('trackInventory') === 'on',
      sellingPrice: toMinorUnits(sellingPriceMajor),
      costPrice:
        costPriceMajor != null && Number.isFinite(costPriceMajor)
          ? toMinorUnits(costPriceMajor)
          : undefined,
      compareAtPrice:
        compareAtPriceMajor != null && Number.isFinite(compareAtPriceMajor)
          ? toMinorUnits(compareAtPriceMajor)
          : undefined,
      currency,
      sku: optionalString(form.get('sku')),
      barcode: optionalString(form.get('barcode')),
      barcodeType: optionalString(form.get('barcodeType')),
      lowStockThreshold: optionalString(form.get('lowStockThreshold'))
        ? parseInt(form.get('lowStockThreshold') as string, 10)
        : undefined,
      initialStock,
      stockLocationId: optionalString(form.get('stockLocationId')),
      bundleItems:
        catalogKind === 'BUNDLE'
          ? bundleItems.map((item) => ({ productId: item.productId, quantity: item.quantity }))
          : undefined,
    };

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(formatProductApiError(data));
        setLoading(false);
        return;
      }

      const productId = data.product.id as string;
      const readyImages = pendingImages.filter((img) => img.status === 'ready');

      if (readyImages.length > 0) {
        try {
          await uploadPendingProductImages(productId, pendingImages);
        } catch (uploadErr) {
          setError(
            uploadErr instanceof Error
              ? `Product created, but image upload failed: ${uploadErr.message}`
              : 'Product created, but image upload failed.'
          );
          setLoading(false);
          router.push(`/app/products/${productId}`);
          router.refresh();
          return;
        }
      }

      router.push(`/app/products/${productId}`);
      router.refresh();
    } catch {
      setError('Network error.');
      setLoading(false);
    }
  }

  const tabs = [
    { id: 'information' as const, label: 'Information' },
    { id: 'media' as const, label: 'Media' },
    { id: 'pricing' as const, label: 'Pricing' },
    { id: 'inventory' as const, label: 'Inventory' },
  ];

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="flex gap-1 border-b border-hairline overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition whitespace-nowrap ${
              tab === t.id
                ? 'border-accent text-ink'
                : 'border-transparent text-stone-2 hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card className={cn('space-y-4', tab !== 'information' && 'hidden')}>
        <h2 className="text-sm font-medium text-ink">Product information</h2>
        <Input name="name" label="Name" required placeholder="e.g. VIVORA Hydrating Face Cream" />
        <div>
          <label className="block text-sm font-medium text-stone-2 mb-1.5">Description</label>
          <textarea
            name="description"
            rows={4}
            className="w-full rounded-sm border border-hairline bg-white px-4 py-3 text-sm"
            placeholder="Describe your product…"
          />
        </div>
        <Input name="brand" label="Brand" placeholder="Optional" />
        <CategoryPicker
          categories={categories}
          value={categoryId}
          onChange={setCategoryId}
        />
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-2 mb-1.5">Product kind</label>
            <select
              value={catalogKind}
              onChange={(e) => setCatalogKind(e.target.value as 'SIMPLE' | 'BUNDLE')}
              className="w-full h-11 rounded-sm border border-hairline px-3 text-sm bg-white"
            >
              <option value="SIMPLE">Simple</option>
              <option value="BUNDLE">Bundle</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-2 mb-1.5">Merchandising</label>
            <label className="flex items-center gap-2 text-sm min-h-[44px]">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded"
              />
              Feature on storefront home
            </label>
          </div>
        </div>
        {catalogKind === 'BUNDLE' && (
          <BundleItemPicker value={bundleItems} onChange={setBundleItems} />
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-2 mb-1.5">Type</label>
            <select
              name="productType"
              className="w-full h-11 rounded-sm border border-hairline px-3 text-sm bg-white"
            >
              <option value="PHYSICAL">Physical</option>
              <option value="DIGITAL">Digital</option>
              <option value="SERVICE">Service</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-2 mb-1.5">Status</label>
            <select
              name="status"
              className="w-full h-11 rounded-sm border border-hairline px-3 text-sm bg-white"
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className={cn('space-y-4', tab !== 'media' && 'hidden')}>
        <ProductImageUpload
          mode="create"
          pendingImages={pendingImages}
          onPendingChange={setPendingImages}
          disabled={loading}
        />
      </Card>

      <Card className={cn('space-y-4', tab !== 'pricing' && 'hidden')}>
        <h2 className="text-sm font-medium text-ink">Pricing</h2>
        <p className="text-sm text-stone-2">Prices in {currency}</p>
        <Input
          name="sellingPrice"
          label="Selling price"
          type="number"
          step="0.01"
          min="0"
          required
          placeholder="0.00"
        />
        <Input
          name="costPrice"
          label="Cost price"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
        />
        <Input
          name="compareAtPrice"
          label="Compare-at price"
          type="number"
          step="0.01"
          min="0"
          placeholder="Was price (optional)"
        />
      </Card>

      <Card className={cn('space-y-4', tab !== 'inventory' && 'hidden')}>
        <h2 className="text-sm font-medium text-ink">Inventory</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="trackInventory" defaultChecked className="rounded" />
          Track inventory for this product
        </label>
        <Input name="sku" label="SKU" placeholder="Auto-generated if empty" />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input name="barcode" label="Barcode" placeholder="EAN / UPC / internal" />
          <div>
            <label className="block text-sm font-medium text-stone-2 mb-1.5">Barcode type</label>
            <select
              name="barcodeType"
              className="w-full h-11 rounded-sm border border-hairline px-3 text-sm bg-white"
            >
              <option value="">—</option>
              <option value="EAN">EAN</option>
              <option value="UPC">UPC</option>
              <option value="GTIN">GTIN</option>
              <option value="INTERNAL">Internal</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-2 mb-1.5">Stock location</label>
          <select
            name="stockLocationId"
            className="w-full h-11 rounded-sm border border-hairline px-3 text-sm bg-white"
            defaultValue={locations[0]?.id}
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input name="initialStock" label="Initial stock" type="number" min="0" placeholder="0" />
          <Input
            name="lowStockThreshold"
            label="Low stock threshold"
            type="number"
            min="0"
            placeholder="Alert when below"
          />
        </div>
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Create product'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
