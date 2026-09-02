'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatMoney } from '@/lib/money';

export function CampaignDetail({ id }: { id: string }) {
  const [data, setData] = useState<{
    campaign: {
      id: string;
      name: string;
      description: string | null;
      status: string;
      trackingCode: string | null;
      messageTitle: string | null;
      messageBody: string | null;
      audience: { name: string; estimatedCount: number | null } | null;
      promotion: { name: string } | null;
      events: { type: string; createdAt: string }[];
    };
    attribution: { conversionCount: number; revenueMinor: number };
    audienceSample: { id: string; name: string; email: string | null }[];
  } | null>(null);

  useEffect(() => {
    fetch(`/api/marketing/campaigns/${id}`).then((r) => r.json()).then(setData);
  }, [id]);

  async function action(act: string) {
    await fetch(`/api/marketing/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: act }),
    });
    const refreshed = await fetch(`/api/marketing/campaigns/${id}`).then((r) => r.json());
    setData(refreshed);
  }

  if (!data) return <p className="text-sm text-stone-2">Loading…</p>;
  const { campaign, attribution, audienceSample } = data;

  return (
    <div className="space-y-6">
      <Link href="/app/marketing/campaigns" className="text-sm text-accent hover:underline">← Campaigns</Link>
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display">{campaign.name}</h1>
          <p className="text-sm text-stone-2 mt-1">{campaign.status} · {campaign.trackingCode ?? 'No tracking code'}</p>
        </div>
        <div className="flex gap-2">
          {campaign.status === 'DRAFT' && <Button onClick={() => action('activate')}>Activate</Button>}
          {campaign.status === 'ACTIVE' && <Button variant="ghost" onClick={() => action('pause')}>Pause</Button>}
          {campaign.status === 'DRAFT' && <Button variant="ghost" onClick={() => action('schedule')}>Schedule</Button>}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Overview">
          <div className="text-sm space-y-2">
            <p>{campaign.description ?? 'No description'}</p>
            <p><span className="text-stone-2">Audience:</span> {campaign.audience?.name ?? '—'}</p>
            <p><span className="text-stone-2">Promotion:</span> {campaign.promotion?.name ?? '—'}</p>
          </div>
        </Card>
        <Card title="Performance">
          <div className="text-sm space-y-2">
            <p>Orders: {attribution.conversionCount}</p>
            <p>Revenue: {formatMoney(attribution.revenueMinor, 'USD')}</p>
          </div>
        </Card>
        <Card title="Audience sample">
          <ul className="text-sm space-y-1">
            {audienceSample.map((c) => (
              <li key={c.id}>{c.name}</li>
            ))}
            {!audienceSample.length && <li className="text-stone-2">No sample customers</li>}
          </ul>
        </Card>
      </div>

      <Card title="Activity">
        <ul className="text-sm space-y-1">
          {campaign.events.map((e, i) => (
            <li key={i}>{e.type} · {new Date(e.createdAt).toLocaleString()}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
