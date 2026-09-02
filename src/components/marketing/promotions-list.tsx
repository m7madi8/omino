'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type Promotion = {
  id: string;
  name: string;
  status: string;
  discountType: string;
  discountValue: number;
  usageCount: number;
  couponCodes: string[];
};

export function PromotionsList() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/marketing/promotions')
      .then((r) => r.json())
      .then((d) => {
        setPromotions(d.promotions ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-sm text-stone-2">Loading promotions…</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div>
          <Link href="/app/marketing" className="text-sm text-accent hover:underline">← Marketing</Link>
          <h1 className="text-2xl font-display mt-2">Promotions</h1>
        </div>
        <Link href="/app/marketing/promotions/new">
          <Button>New promotion</Button>
        </Link>
      </div>

      {!promotions.length ? (
        <p className="text-sm text-stone-2">No promotions yet. Create discount codes for your store and campaigns.</p>
      ) : (
        <div className="space-y-2">
          {promotions.map((p) => (
            <Link
              key={p.id}
              href={`/app/marketing/promotions/${p.id}`}
              className="flex items-center justify-between p-4 rounded-md border border-hairline bg-white hover:border-accent/30"
            >
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-stone-2">
                  {p.couponCodes.join(', ') || 'No code'} · {p.status}
                </p>
              </div>
              <p className="text-sm font-mono">{p.usageCount} redemptions</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
