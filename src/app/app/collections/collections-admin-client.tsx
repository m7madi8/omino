'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Collection = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  isFeatured: boolean;
  _count: { products: number };
};

export default function CollectionsAdminPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/collections')
      .then((r) => r.json())
      .then((d) => {
        if (d.collections) setCollections(d.collections);
        setLoading(false);
      });
  }, []);

  async function createCollection() {
    if (!name.trim()) return;
    const res = await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (res.ok) {
      setCollections((prev) => [...prev, { ...data.collection, _count: { products: 0 } }]);
      setName('');
      setMessage('Collection created');
    } else {
      setMessage(data.error || 'Failed');
    }
  }

  async function publish(id: string) {
    const res = await fetch(`/api/collections/${id}/publish`, { method: 'POST' });
    if (res.ok) {
      setCollections((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'ACTIVE' } : c))
      );
      setMessage('Collection published');
    }
  }

  if (loading) return <p className="text-stone-2">Loading collections…</p>;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-stone mb-2">Commerce</p>
        <h1 className="text-3xl font-display">Collections</h1>
        <p className="mt-2 text-stone-2">Curated product groups for your storefront</p>
      </div>

      <Card title="New collection" description="Manual collections — add products after creating">
        <div className="flex gap-3">
          <Input
            label="Collection name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Summer essentials"
          />
          <div className="flex items-end">
            <Button onClick={createCollection}>Create</Button>
          </div>
        </div>
      </Card>

      <Card title="Your collections">
        {collections.length === 0 ? (
          <p className="text-stone-2 py-8 text-center">No collections yet. Create your first collection above.</p>
        ) : (
          <ul className="divide-y divide-hairline">
            {collections.map((c) => (
              <li key={c.id} className="py-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-stone-2">
                    /collections/{c.slug} · {c._count.products} products · {c.status.toLowerCase()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {c.status !== 'ACTIVE' && (
                    <Button variant="ghost" onClick={() => publish(c.id)}>
                      Publish
                    </Button>
                  )}
                  <Link href={`/app/collections/${c.id}`}>
                    <Button variant="ghost">Edit</Button>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {message && <p className="text-sm text-stone-2">{message}</p>}
    </div>
  );
}
