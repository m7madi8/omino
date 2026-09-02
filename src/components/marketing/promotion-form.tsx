'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function PromotionForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(10);
  const [minOrder, setMinOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch('/api/marketing/promotions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        couponCode: couponCode || undefined,
        discountType: 'PERCENT',
        discountValue: discountPercent * 100,
        minOrderMinor: minOrder > 0 ? minOrder * 100 : undefined,
        status: 'DRAFT',
      }),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      router.push(`/app/marketing/promotions/${data.promotion.id}`);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <Link href="/app/marketing/promotions" className="text-sm text-accent hover:underline">← Promotions</Link>
      <h1 className="text-2xl font-display">New promotion</h1>
      <Card title="Offer details">
        <div className="space-y-4 text-sm">
          <label className="block">
            <span className="text-stone-2">Name</span>
            <input className="mt-1 w-full border border-hairline rounded-sm px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-stone-2">Coupon code</span>
            <input className="mt-1 w-full border border-hairline rounded-sm px-3 py-2 font-mono uppercase" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} />
          </label>
          <label className="block">
            <span className="text-stone-2">Discount (%)</span>
            <input type="number" className="mt-1 w-full border border-hairline rounded-sm px-3 py-2" value={discountPercent} onChange={(e) => setDiscountPercent(Number(e.target.value))} />
          </label>
          <label className="block">
            <span className="text-stone-2">Minimum order ($)</span>
            <input type="number" className="mt-1 w-full border border-hairline rounded-sm px-3 py-2" value={minOrder} onChange={(e) => setMinOrder(Number(e.target.value))} />
          </label>
        </div>
      </Card>
      <Button onClick={save} disabled={!name || saving}>{saving ? 'Saving…' : 'Create promotion'}</Button>
    </div>
  );
}
