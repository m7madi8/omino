'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function AudienceForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [daysSinceOrder, setDaysSinceOrder] = useState(30);
  const [minSpend, setMinSpend] = useState(0);
  const [estimatedCount, setEstimatedCount] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const rules = {
    logic: 'AND' as const,
    rules: [
      ...(daysSinceOrder > 0
        ? [{ field: 'daysSinceLastOrder', operator: 'gte' as const, value: daysSinceOrder }]
        : []),
      ...(minSpend > 0
        ? [{ field: 'totalSpendMinor', operator: 'gte' as const, value: minSpend * 100 }]
        : []),
    ],
  };

  async function previewCount() {
    const res = await fetch(
      `/api/marketing/audiences?preview=count&rules=${encodeURIComponent(JSON.stringify(rules))}`
    );
    const data = await res.json();
    if (res.ok) setEstimatedCount(data.estimatedCount);
  }

  async function save() {
    setSaving(true);
    setError('');
    const res = await fetch('/api/marketing/audiences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, rules }),
    });
    setSaving(false);
    if (!res.ok) {
      setError('Could not create audience.');
      return;
    }
    const data = await res.json();
    router.push(`/app/marketing/audiences/${data.audience.id}`);
  }

  return (
    <div className="max-w-xl space-y-6">
      <Link href="/app/marketing/audiences" className="text-sm text-accent hover:underline">← Audiences</Link>
      <h1 className="text-2xl font-display">New audience</h1>

      <Card title="Segment rules">
        <div className="space-y-4 text-sm">
          <label className="block">
            <span className="text-stone-2">Name</span>
            <input className="mt-1 w-full border border-hairline rounded-sm px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-stone-2">Description</span>
            <textarea className="mt-1 w-full border border-hairline rounded-sm px-3 py-2" value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-stone-2">Last order more than (days ago)</span>
            <input type="number" className="mt-1 w-full border border-hairline rounded-sm px-3 py-2" value={daysSinceOrder} onChange={(e) => setDaysSinceOrder(Number(e.target.value))} />
          </label>
          <label className="block">
            <span className="text-stone-2">Minimum lifetime spend ($)</span>
            <input type="number" className="mt-1 w-full border border-hairline rounded-sm px-3 py-2" value={minSpend} onChange={(e) => setMinSpend(Number(e.target.value))} />
          </label>
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" onClick={previewCount}>Estimate audience</Button>
            {estimatedCount != null && (
              <span className="font-mono">~{estimatedCount} customers</span>
            )}
          </div>
        </div>
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}
      <Button onClick={save} disabled={!name || saving}>{saving ? 'Saving…' : 'Create audience'}</Button>
    </div>
  );
}
