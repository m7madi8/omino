'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function PromotionDetail({ id }: { id: string }) {
  const [promotion, setPromotion] = useState<{
    name: string;
    status: string;
    discountType: string;
    discountValue: number;
    coupons: { code: string; usageCount: number }[];
  } | null>(null);
  const [usage, setUsage] = useState({ redemptionCount: 0, totalDiscountMinor: 0 });

  useEffect(() => {
    fetch(`/api/marketing/promotions/${id}`).then((r) => r.json()).then((d) => {
      setPromotion(d.promotion);
      setUsage(d.usage);
    });
  }, [id]);

  async function setStatus(status: string) {
    await fetch(`/api/marketing/promotions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const refreshed = await fetch(`/api/marketing/promotions/${id}`).then((r) => r.json());
    setPromotion(refreshed.promotion);
  }

  if (!promotion) return <p className="text-sm text-stone-2">Loading…</p>;

  return (
    <div className="space-y-6">
      <Link href="/app/marketing/promotions" className="text-sm text-accent hover:underline">← Promotions</Link>
      <div className="flex justify-between gap-4">
        <h1 className="text-2xl font-display">{promotion.name}</h1>
        {promotion.status === 'DRAFT' && <Button onClick={() => setStatus('ACTIVE')}>Activate</Button>}
        {promotion.status === 'ACTIVE' && <Button variant="ghost" onClick={() => setStatus('PAUSED')}>Pause</Button>}
      </div>
      <Card title="Details">
        <p className="text-sm">Status: {promotion.status}</p>
        <p className="text-sm mt-1">Codes: {promotion.coupons.map((c) => c.code).join(', ') || '—'}</p>
        <p className="text-sm mt-1">Redemptions: {usage.redemptionCount}</p>
      </Card>
    </div>
  );
}
