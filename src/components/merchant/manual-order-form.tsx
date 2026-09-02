'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMerchant } from '@/components/providers/merchant-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';

type ProductOption = { id: string; name: string; sellingPrice: number };

export function ManualOrderForm() {
  const { t, dir } = useMerchant();
  const router = useRouter();
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    variantId: '',
    quantity: '1',
    address: '',
    city: '',
    paymentMethod: 'COD' as 'COD' | 'CASH',
    notes: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/pos/products')
      .then((r) => r.json())
      .then((d) => {
        setProducts(
          (d.items || []).map((p: { variantId: string; name: string; sellingPrice: number }) => ({
            id: p.variantId,
            name: p.name,
            sellingPrice: p.sellingPrice,
          }))
        );
      })
      .catch(() => {});
  }, []);

  async function submit() {
    setBusy(true);
    setError('');
    const res = await fetch('/api/orders/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        quantity: parseInt(form.quantity, 10),
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.message || data.error || t('common.error'));
      return;
    }
    router.push('/app/orders');
    router.refresh();
  }

  return (
    <Card className="p-4 sm:p-6 space-y-4 max-w-lg mx-auto">
      <div dir={dir}>
      <h1 className="text-xl font-display">{t('manualOrder.title')}</h1>
      <Input
        label={t('manualOrder.customerName')}
        value={form.customerName}
        onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
      />
      <Input
        label={t('manualOrder.phone')}
        inputMode="tel"
        value={form.phone}
        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
      />
      <Select
        label={t('manualOrder.product')}
        value={form.variantId}
        onChange={(e) => setForm((f) => ({ ...f, variantId: e.target.value }))}
        options={[
          { value: '', label: '—' },
          ...products.map((p) => ({ value: p.id, label: p.name })),
        ]}
      />
      <Input
        label={t('manualOrder.quantity')}
        inputMode="numeric"
        value={form.quantity}
        onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
      />
      <Input
        label={t('manualOrder.address')}
        value={form.address}
        onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
      />
      <Input
        label="City"
        value={form.city}
        onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
      />
      <Select
        label={t('manualOrder.payment')}
        value={form.paymentMethod}
        onChange={(e) =>
          setForm((f) => ({ ...f, paymentMethod: e.target.value as 'COD' | 'CASH' }))
        }
        options={[
          { value: 'COD', label: t('manualOrder.paymentCod') },
          { value: 'CASH', label: t('manualOrder.paymentCash') },
        ]}
      />
      <Input
        label={t('manualOrder.notes')}
        value={form.notes}
        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button
        className="w-full min-h-[44px]"
        disabled={busy || !form.customerName || !form.phone || !form.variantId}
        onClick={submit}
      >
        {t('manualOrder.create')}
      </Button>
      </div>
    </Card>
  );
}
