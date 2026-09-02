'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/money';

type Campaign = {
  id: string;
  name: string;
  status: string;
  audienceName: string | null;
  revenueMinor: number;
  conversionCount: number;
  updatedAt: string;
};

export function CampaignsList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/marketing/campaigns')
      .then((r) => r.json())
      .then((d) => {
        setCampaigns(d.campaigns ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-sm text-stone-2">Loading campaigns…</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div>
          <Link href="/app/marketing" className="text-sm text-accent hover:underline">← Marketing</Link>
          <h1 className="text-2xl font-display mt-2">Campaigns</h1>
        </div>
        <Link href="/app/marketing/campaigns/new">
          <Button>New campaign</Button>
        </Link>
      </div>

      {!campaigns.length ? (
        <p className="text-sm text-stone-2">No campaigns yet. Create one from a template or start fresh.</p>
      ) : (
        <div className="space-y-2">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href={`/app/marketing/campaigns/${c.id}`}
              className="flex items-center justify-between p-4 rounded-md border border-hairline bg-white hover:border-accent/30"
            >
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-sm text-stone-2">{c.audienceName ?? 'No audience'} · {c.status}</p>
              </div>
              <div className="text-right text-sm">
                <p className="font-mono">{formatMoney(c.revenueMinor, 'USD')}</p>
                <p className="text-stone-2">{c.conversionCount} conversions</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
