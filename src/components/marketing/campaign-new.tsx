'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type Template = { id: string; name: string; description: string };

export function CampaignNewPage() {
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    fetch('/api/marketing?view=templates').then((r) => r.json()).then((d) => setTemplates(d.templates ?? []));
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

  return (
    <div className="space-y-6">
      <Link href="/app/marketing/campaigns" className="text-sm text-accent hover:underline">← Campaigns</Link>
      <h1 className="text-2xl font-display">New campaign</h1>
      <p className="text-sm text-stone-2">Templates create draft campaigns — nothing launches automatically.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => createFromTemplate(t.id)}
            className="text-left p-4 rounded-md border border-hairline hover:border-accent/40"
          >
            <p className="font-medium">{t.name}</p>
            <p className="text-sm text-stone-2 mt-1">{t.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
