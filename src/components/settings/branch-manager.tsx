'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Branch = {
  id: string;
  name: string;
  slug: string;
  isDefault: boolean;
  address?: string | null;
};

export function BranchManager({
  storeId,
  storeName,
  initialBranches,
  onChanged,
}: {
  storeId: string;
  storeName: string;
  initialBranches: Branch[];
  onChanged: () => void;
}) {
  const [branches, setBranches] = useState(initialBranches);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function addBranch(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError('');
    const res = await fetch('/api/branches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId, name: name.trim(), address: address.trim() || null }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || 'Could not add branch');
      return;
    }

    setBranches((prev) => [...prev, data.branch]);
    setName('');
    setAddress('');
    onChanged();
  }

  async function setDefault(branchId: string) {
    const res = await fetch(`/api/branches/${branchId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDefault: true }),
    });
    if (res.ok) {
      setBranches((prev) =>
        prev.map((b) => ({ ...b, isDefault: b.id === branchId }))
      );
      onChanged();
    }
  }

  return (
    <div className="border border-hairline rounded-sm p-4 space-y-4">
      <div>
        <p className="font-medium">{storeName}</p>
        <p className="text-xs text-stone-2 mt-0.5">{branches.length} branch(es)</p>
      </div>

      <ul className="space-y-2">
        {branches.map((b) => (
          <li
            key={b.id}
            className="flex flex-wrap items-center justify-between gap-2 text-sm border border-hairline/60 rounded-sm px-3 py-2"
          >
            <div>
              <span className="font-medium">{b.name}</span>
              {b.isDefault && (
                <span className="ms-2 text-[10px] font-mono uppercase tracking-wider text-stone bg-paper-2 px-1.5 py-0.5 rounded-sm">
                  Default
                </span>
              )}
              {b.address && <p className="text-xs text-stone-2 mt-0.5">{b.address}</p>}
            </div>
            {!b.isDefault && (
              <button
                type="button"
                onClick={() => setDefault(b.id)}
                className="text-xs text-accent hover:underline"
              >
                Set as default
              </button>
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={addBranch} className="space-y-3 pt-2 border-t border-hairline">
        <p className="text-xs font-mono uppercase tracking-[0.12em] text-stone">Add branch</p>
        <Input
          label="Branch name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Downtown, Ramallah"
        />
        <Input
          label="Address (optional)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Street, city"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={saving || !name.trim()}>
          {saving ? 'Adding…' : 'Add branch'}
        </Button>
      </form>
    </div>
  );
}
