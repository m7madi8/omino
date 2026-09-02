'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { COUNTRIES, CURRENCIES } from '@/lib/permissions/constants';
import { BranchManager } from '@/components/settings/branch-manager';
import { PageChrome } from '@/components/app/dashboard/page-chrome';
import { useMerchant } from '@/components/providers/merchant-provider';

type OrgData = {
  organization: {
    name: string;
    currency: string;
    country: string | null;
    locale?: string;
    merchantExperienceMode?: string;
  };
  stores: {
    id: string;
    name: string;
    branches: { id: string; name: string; slug: string; isDefault: boolean; address?: string | null }[];
  }[];
};

export default function SettingsPage() {
  const { t, dir } = useMerchant();
  const [data, setData] = useState<OrgData | null>(null);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [country, setCountry] = useState('PS');
  const [locale, setLocale] = useState<'ar' | 'en'>('en');
  const [experienceMode, setExperienceMode] = useState<'simple' | 'standard'>('standard');
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
          setLocale(json.organization.locale === 'ar' ? 'ar' : 'en');
          setExperienceMode(
            json.organization.merchantExperienceMode === 'simple' ? 'simple' : 'standard'
          );
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
      body: JSON.stringify({ name, currency, country, locale, merchantExperienceMode: experienceMode }),
    });
    setSaving(false);
    if (res.ok) setMessage(t('common.save'));
    else setMessage(t('common.error'));
  }

  if (!data) {
    return (
      <PageChrome width="narrow" title={t('settings.title')}>
        <div className="space-y-4" dir={dir}>
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </PageChrome>
    );
  }

  return (
    <PageChrome
      width="narrow"
      title={t('settings.title')}
      description={t('settings.experienceMode')}
    >
      <div className="space-y-6" dir={dir}>

      <Card title={t('settings.businessProfile')}>
        <div className="space-y-4">
          <Input label={t('settings.businessName')} value={name} onChange={(e) => setName(e.target.value)} />
          <Select
            label={t('settings.country')}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            options={COUNTRIES.map((c) => ({ value: c.code, label: c.label }))}
          />
          <Select
            label={t('settings.currency')}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            options={CURRENCIES.map((c) => ({ value: c.code, label: c.label }))}
          />
          <Select
            label={t('settings.language')}
            value={locale}
            onChange={(e) => setLocale(e.target.value as 'ar' | 'en')}
            options={[
              { value: 'ar', label: t('lang.ar') },
              { value: 'en', label: t('lang.en') },
            ]}
          />
          <Select
            label={t('settings.experienceMode')}
            value={experienceMode}
            onChange={(e) => setExperienceMode(e.target.value as 'simple' | 'standard')}
            options={[
              { value: 'simple', label: t('settings.simpleDesc') },
              { value: 'standard', label: t('settings.standardDesc') },
            ]}
          />
          {message && <p className="text-sm text-good">{message}</p>}
          <Button onClick={save} disabled={saving}>
            {saving ? t('settings.saving') : t('settings.saveChanges')}
          </Button>
        </div>
      </Card>

      {data?.stores && (
        <Card title={t('settings.storesBranches')} description={t('settings.storesBranchesDesc')}>
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
    </PageChrome>
  );
}
