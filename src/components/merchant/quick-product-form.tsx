'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMerchant } from '@/components/providers/merchant-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { STANDARD_IMAGE_ACCEPT, validateImageFile } from '@/lib/storage/file-validation';
import { uploadProductImageFile } from '@/components/catalog/product-image-upload';
import {
  buildProductShareMessage,
  getStorefrontProductUrl,
  openWhatsAppShare,
} from '@/lib/merchant/whatsapp';
import { formatMoney } from '@/lib/money';
import { formatLocaleForIntl } from '@/lib/merchant/palestine-mode';

export function QuickProductForm({
  currency,
  storePublicSlug,
  storeName,
}: {
  currency: string;
  storePublicSlug: string | null;
  storeName: string | null;
}) {
  const { t, dir, locale } = useMerchant();
  const router = useRouter();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{
    productId: string;
    productSlug: string;
    name: string;
    priceMinor: number;
  } | null>(null);

  async function handleSubmit(publish: boolean) {
    setError('');
    setBusy(true);

    let imageFileToUpload: File | null = null;
    if (imageFile) {
      const validation = validateImageFile(imageFile, { maxBytes: 10 * 1024 * 1024 });
      if (!validation.ok) {
        setError(validation.message);
        setBusy(false);
        return;
      }
      imageFileToUpload = imageFile;
    }

    const priceMinor = Math.round(parseFloat(price || '0') * 100);
    const res = await fetch('/api/products/quick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        priceMinor,
        quantity: parseInt(quantity || '1', 10),
        publish,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message || data.error || t('common.error'));
      setBusy(false);
      return;
    }

    if (imageFileToUpload) {
      await uploadProductImageFile(data.product.id, imageFileToUpload, { isPrimary: true });
    }

    setBusy(false);

    setSuccess({
      productId: data.product.id,
      productSlug: data.product.slug,
      name: data.product.name,
      priceMinor,
    });
  }

  if (success) {
    const productUrl = storePublicSlug
      ? getStorefrontProductUrl(storePublicSlug, success.productSlug)
      : '#';
    const priceFormatted = formatMoney(
      success.priceMinor,
      currency,
      formatLocaleForIntl(locale)
    );

    return (
      <Card className="p-6 space-y-4 text-center">
        <div dir={dir}>
        <p className="text-lg font-display">{t('product.quick.success')} ✓</p>
        <div className="flex flex-col gap-2">
          <Button
            className="min-h-[44px]"
            onClick={() => router.push(`/app/products/${success.productId}`)}
          >
            {t('product.quick.publish')}
          </Button>
          {storePublicSlug && (
            <Button
              variant="secondary"
              className="min-h-[44px]"
              onClick={() =>
                openWhatsAppShare(
                  null,
                  buildProductShareMessage({
                    productName: success.name,
                    priceFormatted,
                    productUrl,
                    storeName: storeName || 'OMINO',
                    locale,
                  })
                )
              }
            >
              {t('product.quick.shareWhatsApp')}
            </Button>
          )}
          <Button variant="ghost" onClick={() => router.push('/app/today')}>
            {t('nav.today')}
          </Button>
        </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6 space-y-4">
      <div dir={dir}>
      <h1 className="text-xl font-display">{t('product.quick.title')}</h1>

      <label className="block space-y-2">
        <span className="text-sm text-stone-2">{t('product.quick.image')}</span>
        <input
          type="file"
          accept={STANDARD_IMAGE_ACCEPT}
          className="block w-full text-sm"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        />
      </label>

      <Input
        label={t('product.quick.name')}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        label={t('product.quick.price')}
        inputMode="decimal"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      <Input
        label={t('product.quick.quantity')}
        inputMode="numeric"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button
        className="w-full min-h-[44px] touch-manipulation"
        disabled={busy || !name || !price}
        onClick={() => handleSubmit(true)}
      >
        {t('product.quick.save')}
      </Button>

      <Link
        href="/app/products/new"
        className="block text-center text-sm text-stone-2 underline-offset-2 hover:underline"
      >
        {t('product.quick.advanced')}
      </Link>
      </div>
    </Card>
  );
}
