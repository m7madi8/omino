'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { StockBadge } from '@/components/catalog/status-badge';
import { formatMoney } from '@/lib/money';
import type { StockMovementType } from '@/types/prisma-enums';

const MOVEMENT_LABELS: Record<StockMovementType, string> = {
  PURCHASE: 'Purchase',
  SALE: 'Sale',
  RETURN: 'Return',
  ADJUSTMENT: 'Adjustment',
  TRANSFER_IN: 'Transfer in',
  TRANSFER_OUT: 'Transfer out',
  DAMAGE: 'Damage',
  INITIAL: 'Initial stock',
  RESERVATION: 'Reservation',
  RELEASE: 'Release',
};

type VariantDetail = {
  id: string;
  sku: string;
  name: string | null;
  sellingPrice: number;
  currency: string;
  barcode: string | null;
  lowStockThreshold: number | null;
  product: {
    id: string;
    name: string;
    images: { url: string }[];
    category: { name: string } | null;
  };
  optionValues: { optionValue: { value: string; option: { name: string } } }[];
  stockLevels: {
    id: string;
    quantityOnHand: number;
    quantityReserved: number;
    quantityIncoming: number;
    lowStockThreshold: number | null;
    stockLocation: { id: string; name: string };
  }[];
  stockMovements: {
    id: string;
    type: StockMovementType;
    quantity: number;
    balanceAfter: number;
    reason: string | null;
    createdAt: string;
    stockLocation: { name: string };
    user: { fullName: string | null; email: string } | null;
  }[];
};

export function InventoryDetailClient({ variant }: { variant: VariantDetail }) {
  const totalOnHand = variant.stockLevels.reduce((s, l) => s + l.quantityOnHand, 0);
  const totalReserved = variant.stockLevels.reduce((s, l) => s + l.quantityReserved, 0);
  const available = Math.max(0, totalOnHand - totalReserved);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Link href="/app/inventory" className="p-2 -ml-2 rounded-sm hover:bg-paper-2">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl">{variant.product.name}</h1>
          <p className="text-sm text-stone-2 mt-1 font-mono">{variant.sku}</p>
          {variant.optionValues.length > 0 && (
            <p className="text-sm text-stone mt-1">
              {variant.optionValues.map((o) => o.optionValue.value).join(' / ')}
            </p>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-xs text-stone-2 uppercase tracking-wide">On hand</p>
          <p className="text-2xl font-mono mt-1">{totalOnHand}</p>
        </Card>
        <Card>
          <p className="text-xs text-stone-2 uppercase tracking-wide">Reserved</p>
          <p className="text-2xl font-mono mt-1">{totalReserved}</p>
        </Card>
        <Card>
          <p className="text-xs text-stone-2 uppercase tracking-wide">Available</p>
          <p className="text-2xl font-mono mt-1">
            <StockBadge
              available={available}
              isLowStock={
                variant.lowStockThreshold != null && available <= variant.lowStockThreshold
              }
            />
          </p>
        </Card>
      </div>

      <Card title="By location">
        {variant.stockLevels.map((l) => (
          <div
            key={l.id}
            className="flex justify-between py-3 border-b border-hairline last:border-0 text-sm"
          >
            <span>{l.stockLocation.name}</span>
            <span className="font-mono">
              {l.quantityOnHand} on hand · {l.quantityReserved} reserved
            </span>
          </div>
        ))}
        {variant.stockLevels.length === 0 && (
          <p className="text-stone-2 text-sm">No stock at any location.</p>
        )}
      </Card>

      <Card title="Activity" description="Recent stock movements">
        <div className="space-y-3">
          {variant.stockMovements.length === 0 ? (
            <p className="text-stone-2 text-sm">No movements recorded.</p>
          ) : (
            variant.stockMovements.map((m) => (
              <div
                key={m.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b border-hairline last:border-0 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {MOVEMENT_LABELS[m.type]}{' '}
                    <span className={m.quantity > 0 ? 'text-good' : 'text-danger'}>
                      {m.quantity > 0 ? '+' : ''}
                      {m.quantity}
                    </span>
                  </p>
                  <p className="text-xs text-stone-2 mt-0.5">
                    {m.reason || '—'} · {m.stockLocation.name}
                  </p>
                </div>
                <div className="text-xs text-stone text-right">
                  <p>Balance: {m.balanceAfter}</p>
                  <p>{new Date(m.createdAt).toLocaleString()}</p>
                  {m.user && <p>{m.user.fullName || m.user.email}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Link href={`/app/products/${variant.product.id}`} className="text-sm text-accent hover:underline">
        View product →
      </Link>
    </div>
  );
}
