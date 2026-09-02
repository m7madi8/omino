'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatMoney } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { MarketingOverview } from '@/types/marketing';

export function MarketingDashboard() {
  const [overview, setOverview] = useState<MarketingOverview | null>(null);
  const [templates, setTemplates] = useState<{ id: string; name: string; description: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/marketing').then((r) => r.json()),
      fetch('/api/marketing?view=templates').then((r) => r.json()),
    ]).then(([overviewRes, templatesRes]) => {
      setOverview(overviewRes.overview);
      setTemplates(templatesRes.templates ?? []);
      setLoading(false);
    });
  }, []);

  async function createFromTemplate(templateId: string) {
    const res = await fetch('/api/marketing/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId }),
    });
    if (res.ok) {
      const data = await res.json();
      window.location.href = `/app/marketing/campaigns/${data.campaign.id}`;
    }
  }

  if (loading) return <p className="text-sm text-stone-2">Loading marketing…</p>;

  if (!overview) {
    return (
      <Card title="Marketing">
        <p className="text-sm text-stone-2">Marketing data could not be loaded.</p>
      </Card>
    );
  }

  const hasActivity = overview.attributedOrders > 0 || overview.activeCampaigns > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-stone mb-2">Marketing</p>
          <h1 className="text-3xl font-display">Grow repeat business</h1>
          <p className="mt-1 text-sm text-stone-2">Audiences, campaigns, and promotions that drive measurable sales.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/app/marketing/campaigns/new">
            <Button>Create campaign</Button>
          </Link>
        </div>
      </div>

      {!hasActivity ? (
        <Card title="Get started">
          <p className="text-sm text-stone-2 leading-relaxed">
            Turn customers into repeat business. Build your first audience, launch an offer, and measure what actually drives sales.
          </p>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Active campaigns" value={overview.activeCampaigns} />
        <MetricCard label="Draft campaigns" value={overview.draftCampaigns} />
        <MetricCard label="Audience reach" value={overview.totalAudience} />
        <MetricCard label="Attributed revenue" value={formatMoney(overview.attributedRevenueMinor, 'USD')} isText />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Performance" className="lg:col-span-2">
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-stone-2">Orders attributed</p>
              <p className="text-2xl font-display mt-1">{overview.attributedOrders}</p>
            </div>
            <div>
              <p className="text-stone-2">Conversion rate</p>
              <p className="text-2xl font-display mt-1">{overview.conversionRate}%</p>
            </div>
            <div>
              <p className="text-stone-2">Top campaign</p>
              <p className="mt-1 font-medium">{overview.topCampaign?.name ?? '—'}</p>
            </div>
          </div>
        </Card>

        <Card title="Quick links">
          <div className="space-y-2 text-sm">
            <Link href="/app/marketing/campaigns" className="block text-accent hover:underline">Campaigns →</Link>
            <Link href="/app/marketing/audiences" className="block text-accent hover:underline">Audiences →</Link>
            <Link href="/app/marketing/promotions" className="block text-accent hover:underline">Promotions →</Link>
          </div>
        </Card>
      </div>

      <Card title="Campaign templates">
        <div className="grid gap-3 sm:grid-cols-2">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => createFromTemplate(t.id)}
              className="text-left p-4 rounded-md border border-hairline hover:border-accent/40 transition"
            >
              <p className="font-medium">{t.name}</p>
              <p className="text-sm text-stone-2 mt-1">{t.description}</p>
            </button>
          ))}
        </div>
      </Card>

      {overview.recentActivity.length > 0 && (
        <Card title="Recent activity">
          <ul className="space-y-2 text-sm">
            {overview.recentActivity.map((a, i) => (
              <li key={i} className="flex justify-between gap-4">
                <span>{a.message}</span>
                <span className="text-stone-2 shrink-0">{new Date(a.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function MetricCard({ label, value, isText }: { label: string; value: string | number; isText?: boolean }) {
  return (
    <div className="rounded-md border border-hairline bg-white p-5 shadow-soft">
      <p className="text-xs font-mono uppercase tracking-wider text-stone-2">{label}</p>
      <p className={`mt-2 ${isText ? 'text-lg' : 'text-2xl'} font-display tabular-nums`}>{value}</p>
    </div>
  );
}
