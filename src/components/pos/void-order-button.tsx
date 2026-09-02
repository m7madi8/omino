'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function VoidOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  async function voidOrder() {
    if (reason.length < 3) return;
    setBusy(true);
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'void', reason }),
    });
    setBusy(false);
    if (res.ok) {
      router.refresh();
      setShow(false);
    }
  }

  if (!show) {
    return (
      <Button variant="danger" onClick={() => setShow(true)}>
        Void Order
      </Button>
    );
  }

  return (
    <div className="p-4 border border-danger/30 rounded-md bg-danger/5 space-y-3">
      <p className="text-sm font-medium text-danger">Void this order?</p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason for void (required)"
        className="w-full p-3 rounded-sm border border-hairline text-sm min-h-[80px]"
      />
      <div className="flex gap-2">
        <Button variant="ghost" onClick={() => setShow(false)} className="flex-1">
          Cancel
        </Button>
        <Button variant="danger" onClick={voidOrder} disabled={busy || reason.length < 3} className="flex-1">
          {busy ? 'Voiding…' : 'Confirm Void'}
        </Button>
      </div>
    </div>
  );
}
