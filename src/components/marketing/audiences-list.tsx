'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type Audience = {
  id: string;
  name: string;
  description: string | null;
  estimatedCount: number | null;
};

export function AudiencesList() {
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/marketing/audiences')
      .then((r) => r.json())
      .then((d) => {
        setAudiences(d.audiences ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-sm text-stone-2">Loading audiences…</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div>
          <Link href="/app/marketing" className="text-sm text-accent hover:underline">← Marketing</Link>
          <h1 className="text-2xl font-display mt-2">Audiences</h1>
        </div>
        <Link href="/app/marketing/audiences/new">
          <Button>New audience</Button>
        </Link>
      </div>

      {!audiences.length ? (
        <p className="text-sm text-stone-2">No audiences yet. Build a segment from customer and purchase data.</p>
      ) : (
        <div className="space-y-2">
          {audiences.map((a) => (
            <Link
              key={a.id}
              href={`/app/marketing/audiences/${a.id}`}
              className="flex items-center justify-between p-4 rounded-md border border-hairline bg-white hover:border-accent/30"
            >
              <div>
                <p className="font-medium">{a.name}</p>
                {a.description && <p className="text-sm text-stone-2">{a.description}</p>}
              </div>
              <p className="text-sm font-mono">{a.estimatedCount ?? 0} customers</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
