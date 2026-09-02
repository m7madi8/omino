'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { InventoryListItem } from '@/types/catalog';

export function StockAdjustDialog({
  item,
  onClose,
  onSuccess,
}: {
  item: InventoryListItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const quantityDelta = parseInt(delta, 10);
    if (!quantityDelta || quantityDelta === 0) {
      setError('Enter a non-zero adjustment');
      setLoading(false);
      return;
    }

    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'adjust',
        variantId: item.variantId,
        stockLocationId: item.stockLocationId,
        quantityDelta,
        reason,
        type: 'ADJUSTMENT',
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Adjustment failed');
      return;
    }

    onSuccess();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <button className="absolute inset-0 bg-ink/40" onClick={onClose} aria-label="Close" />
      <div className="relative w-full max-w-md bg-white rounded-md border border-hairline shadow-lift p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display">Adjust stock</h2>
          <button onClick={onClose} className="p-1 hover:bg-paper-2 rounded-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-3 rounded-sm bg-paper text-sm space-y-1">
          <p className="font-medium">{item.productName}</p>
          {item.variantName && <p className="text-stone-2">{item.variantName}</p>}
          <p className="text-xs font-mono text-stone">{item.sku}</p>
          <p className="text-xs text-stone-2 mt-2">
            {item.stockLocationName} · Current: {item.quantityOnHand} on hand
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Adjustment (+/- units)"
            type="number"
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
            placeholder="e.g. 5 or -3"
            required
          />
          <Input
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Received shipment, damaged goods…"
            required
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Save adjustment'}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
