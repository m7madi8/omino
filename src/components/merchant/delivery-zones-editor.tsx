'use client';

import { useEffect, useState } from 'react';
import { useMerchant } from '@/components/providers/merchant-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { formatMoney } from '@/lib/money';
import { formatLocaleForIntl } from '@/lib/merchant/palestine-mode';

type Zone = {
  id: string;
  name: string;
  priceMinor: number;
  isActive: boolean;
};

export function DeliveryZonesEditor({ currency }: { currency: string }) {
  const { t, dir, locale } = useMerchant();
  const [zones, setZones] = useState<Zone[]>([]);
  const [name, setName] = useState('');
  const [fee, setFee] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch('/api/store/delivery-zones');
    const data = await res.json();
    if (res.ok) setZones(data.zones || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addZone() {
    const priceMinor = Math.round(parseFloat(fee || '0') * 100);
    const res = await fetch('/api/store/delivery-zones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, priceMinor, isActive: true }),
    });
    if (res.ok) {
      setName('');
      setFee('');
      await load();
    }
  }

  if (loading) return <p className="text-stone-2">{t('common.loading')}</p>;

  return (
    <div className="max-w-lg space-y-4" dir={dir}>
      <h2 className="font-display text-lg">{t('delivery.zones')}</h2>
      <ul className="space-y-2">
        {zones.map((zone) => (
          <li key={zone.id}>
            <Card className="p-3 flex items-center justify-between gap-3">
              <span>{zone.name}</span>
              <span className="text-sm font-medium">
                {formatMoney(zone.priceMinor, currency, formatLocaleForIntl(locale))}
              </span>
            </Card>
          </li>
        ))}
      </ul>
      <Card className="p-4 space-y-3">
        <Input label={t('delivery.zoneName')} value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          label={t('delivery.fee')}
          inputMode="decimal"
          value={fee}
          onChange={(e) => setFee(e.target.value)}
        />
        <Button className="w-full min-h-[44px]" disabled={!name} onClick={addZone}>
          {t('delivery.addZone')}
        </Button>
      </Card>
    </div>
  );
}
