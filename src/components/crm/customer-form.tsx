'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { CustomerMatch } from '@/types/customer';

export function CustomerFormClient({
  mode,
  customerId,
  initial,
}: {
  mode: 'create' | 'edit';
  customerId?: string;
  initial?: {
    firstName?: string | null;
    lastName?: string | null;
    name?: string;
    email?: string | null;
    phone?: string | null;
    notes?: string | null;
    status?: string;
  };
}) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(initial?.firstName || '');
  const [lastName, setLastName] = useState(initial?.lastName || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [status, setStatus] = useState(initial?.status || 'ACTIVE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [matches, setMatches] = useState<CustomerMatch[]>([]);

  async function checkDuplicates() {
    const params = new URLSearchParams({ match: 'true' });
    if (email) params.set('email', email);
    if (phone) params.set('phone', phone);
    if (firstName || lastName) params.set('name', `${firstName} ${lastName}`.trim());
    const res = await fetch(`/api/customers?${params}`);
    const data = await res.json();
    if (res.ok) setMatches(data.matches || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      email: email || undefined,
      phone: phone || undefined,
      notes: notes || undefined,
      status: mode === 'edit' ? status : undefined,
      source: 'MANUAL' as const,
    };

    const res = await fetch(
      mode === 'create' ? '/api/customers' : `/api/customers/${customerId}`,
      {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();
    setLoading(false);

    if (res.status === 409 && data.error === 'DUPLICATE_CUSTOMER') {
      setMatches(data.matches || []);
      setError('A similar customer already exists. Review matches below or use the existing record.');
      return;
    }

    if (!res.ok) {
      setError(data.error || 'Failed to save customer');
      return;
    }

    router.push(`/app/customers/${mode === 'create' ? data.customer.id : customerId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-stone-2">First name</label>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            onBlur={mode === 'create' ? checkDuplicates : undefined}
            className="w-full h-11 px-3 mt-1 rounded-sm border border-hairline"
          />
        </div>
        <div>
          <label className="text-sm text-stone-2">Last name</label>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            onBlur={mode === 'create' ? checkDuplicates : undefined}
            className="w-full h-11 px-3 mt-1 rounded-sm border border-hairline"
          />
        </div>
      </div>
      <div>
        <label className="text-sm text-stone-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={mode === 'create' ? checkDuplicates : undefined}
          className="w-full h-11 px-3 mt-1 rounded-sm border border-hairline"
        />
      </div>
      <div>
        <label className="text-sm text-stone-2">Phone</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onBlur={mode === 'create' ? checkDuplicates : undefined}
          className="w-full h-11 px-3 mt-1 rounded-sm border border-hairline"
        />
      </div>
      {mode === 'edit' && (
        <div>
          <label className="text-sm text-stone-2">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full h-11 px-3 mt-1 rounded-sm border border-hairline bg-white"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>
      )}
      <div>
        <label className="text-sm text-stone-2">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 mt-1 rounded-sm border border-hairline"
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {matches.length > 0 && (
        <div className="rounded-sm border border-amber-200 bg-amber-50 p-3 text-sm">
          <p className="font-medium mb-2">Possible duplicates</p>
          {matches.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => router.push(`/app/customers/${m.id}`)}
              className="block w-full text-left py-1 hover:text-accent"
            >
              {m.displayName} — {m.matchReason}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {mode === 'create' ? 'Create customer' : 'Save changes'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
