'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { COUNTRIES, CURRENCIES } from '@/lib/permissions/constants';
import { BranchManager } from '@/components/settings/branch-manager';

type OrgData = {
  organization: { name: string; currency: string; country: string | null };
  stores: {
    id: string;
    name: string;
    branches: { id: string; name: string; slug: string; isDefault: boolean; address?: string | null }[];
  }[];
};

export default function SettingsPage() {
  const [data, setData] = useState<OrgData | null>(null);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [country, setCountry] = useState('PS');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  function reloadOrg() {
    setReloadKey((k) => k + 1);
  }

  useEffect(() => {
    fetch('/api/organization')
      .then((r) => r.json())
      .then((json) => {
        if (json.organization) {
          setName(json.organization.name || '');
          setCurrency(json.organization.currency || 'USD');
          setCountry(json.organization.country || 'PS');
        }
        setData(json);
      });
  }, [reloadKey]);

  async function save() {
    setSaving(true);
    setMessage('');
    const res = await fetch('/api/organization', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, currency, country }),
    });
    setSaving(false);
    if (res.ok) setMessage('Settings saved.');
    else setMessage('Could not save settings.');
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-stone mb-2">Settings</p>
        <h1 className="text-3xl font-display">Organization settings</h1>
        <p className="mt-2 text-stone-2">Manage your business profile and preferences.</p>
      </div>

      <Card title="Business profile">
        <div className="space-y-4">
          <Input label="Business name" value={name} onChange={(e) => setName(e.target.value)} />
          <Select
            label="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            options={COUNTRIES.map((c) => ({ value: c.code, label: c.label }))}
          />
          <Select
            label="Currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            options={CURRENCIES.map((c) => ({ value: c.code, label: c.label }))}
          />
          {message && <p className="text-sm text-good">{message}</p>}
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </Card>

      {data?.stores && (
        <Card title="Stores & branches" description="Manage your retail locations and inventory points">
          <div className="space-y-4">
            {data.stores.map((store) => (
              <BranchManager
                key={store.id}
                storeId={store.id}
                storeName={store.name}
                initialBranches={store.branches}
                onChanged={reloadOrg}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
