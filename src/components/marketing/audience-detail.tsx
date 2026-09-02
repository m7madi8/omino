'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function AudienceDetail({ id }: { id: string }) {
  const [audience, setAudience] = useState<{
    name: string;
    description: string | null;
    estimatedCount: number | null;
    rules: unknown;
  } | null>(null);
  const [sample, setSample] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch(`/api/marketing/audiences/${id}`).then((r) => r.json()).then((d) => {
      setAudience(d.audience);
      setSample(d.sample ?? []);
    });
  }, [id]);

  async function refresh() {
    const res = await fetch(`/api/marketing/audiences/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'refresh_count' }),
    });
    const data = await res.json();
    if (res.ok && audience) setAudience({ ...audience, estimatedCount: data.estimatedCount });
  }

  if (!audience) return <p className="text-sm text-stone-2">Loading…</p>;

  return (
    <div className="space-y-6">
      <Link href="/app/marketing/audiences" className="text-sm text-accent hover:underline">← Audiences</Link>
      <h1 className="text-2xl font-display">{audience.name}</h1>
      <Card title="Audience">
        <p className="text-sm text-stone-2">{audience.description}</p>
        <p className="mt-3 font-mono">~{audience.estimatedCount ?? 0} customers</p>
        <Button className="mt-3" variant="ghost" onClick={refresh}>Refresh count</Button>
      </Card>
      <Card title="Sample customers">
        <ul className="text-sm space-y-1">
          {sample.map((c) => <li key={c.id}>{c.name}</li>)}
        </ul>
      </Card>
    </div>
  );
}
