'use client';

import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import { useEffect, useState } from 'react';
import { AuthShell } from '@/components/marketing/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  BUSINESS_TYPES,
  COUNTRIES,
  CURRENCIES,
} from '@/lib/permissions/constants';

const STEPS = ['welcome', 'business', 'location', 'store', 'complete'] as const;
type Step = (typeof STEPS)[number];

const STEP_LABELS: Record<Step, string> = {
  welcome: 'Welcome',
  business: 'Business',
  location: 'Location',
  store: 'Store setup',
  complete: 'Complete',
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function OnboardingPage() {
  const { data: session, status, update: updateSession } = useSession();
  const [step, setStep] = useState<Step>('welcome');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    businessName: '',
    businessType: 'retail',
    country: 'PS',
    currency: 'ILS',
    storeName: '',
    branchName: 'Main Branch',
  });

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.onboardingComplete) {
      window.location.assign('/app');
    }
  }, [status, session]);

  function setField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const stepIndex = STEPS.indexOf(step);

  async function fetchOnboardingStatus() {
    const res = await fetch('/api/onboarding');
    if (!res.ok) return false;
    const data = (await res.json()) as { onboardingComplete?: boolean };
    return Boolean(data.onboardingComplete);
  }

  async function syncSession(maxAttempts = 4): Promise<Session | null> {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const ready = await fetchOnboardingStatus();
      if (!ready) {
        await sleep(200);
        continue;
      }

      const updated = await updateSession({ refreshedAt: Date.now() });
      if (updated?.user?.onboardingComplete) return updated;

      await sleep(200);
    }

    return null;
  }

  async function complete() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: form.businessName,
          businessType: form.businessType,
          country: form.country,
          currency: form.currency,
          storeName: form.storeName || `${form.businessName} Store`,
          branchName: form.branchName,
        }),
      });

      if (!res.ok) {
        setError('Could not complete setup. Please try again.');
        setLoading(false);
        return;
      }

      const data = (await res.json()) as { onboardingComplete?: boolean };
      if (!data.onboardingComplete) {
        setError('Setup saved but is still syncing. Please try again.');
        setLoading(false);
        return;
      }

      const synced = await syncSession();
      if (!synced) {
        setError('Setup saved. Click "Go to Business OS" to continue.');
      }

      setStep('complete');
      setLoading(false);
    } catch {
      setError('Network error.');
      setLoading(false);
    }
  }

  async function goToApp() {
    setLoading(true);
    setError('');

    try {
      const synced = await syncSession();
      if (!synced?.user?.onboardingComplete) {
        setError('Could not open Business OS yet. Please try again.');
        setLoading(false);
        return;
      }

      window.location.assign('/app');
    } catch {
      setError('Could not open Business OS. Please try again.');
      setLoading(false);
    }
  }

  function next() {
    if (step === 'store') {
      void complete();
      return;
    }
    const nextStep = STEPS[stepIndex + 1];
    if (nextStep) setStep(nextStep);
  }

  function back() {
    const prevStep = STEPS[stepIndex - 1];
    if (prevStep) setStep(prevStep);
  }

  return (
    <AuthShell
      title={STEP_LABELS[step]}
      subtitle={`Step ${stepIndex + 1} of ${STEPS.length}`}
    >
      <div className="mb-6 flex gap-1">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= stepIndex ? 'bg-accent' : 'bg-hairline'
            }`}
          />
        ))}
      </div>

      {step === 'welcome' && (
        <div className="space-y-4">
          <p className="text-stone-2 leading-relaxed">
            Welcome to OMINO. Let&apos;s set up your business — this takes about two minutes.
          </p>
          <Button onClick={next} className="w-full">
            Get started
          </Button>
        </div>
      )}

      {step === 'business' && (
        <div className="space-y-4">
          <Input
            label="Business name"
            value={form.businessName}
            onChange={(e) => setField('businessName', e.target.value)}
            required
          />
          <Select
            label="Business type"
            value={form.businessType}
            onChange={(e) => setField('businessType', e.target.value)}
            options={BUSINESS_TYPES.map((t) => ({
              value: t,
              label: t.charAt(0).toUpperCase() + t.slice(1),
            }))}
          />
          <div className="flex gap-3">
            <Button variant="ghost" onClick={back} className="flex-1">
              Back
            </Button>
            <Button onClick={next} className="flex-1" disabled={!form.businessName.trim()}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 'location' && (
        <div className="space-y-4">
          <Select
            label="Country"
            value={form.country}
            onChange={(e) => setField('country', e.target.value)}
            options={COUNTRIES.map((c) => ({ value: c.code, label: c.label }))}
          />
          <Select
            label="Currency"
            value={form.currency}
            onChange={(e) => setField('currency', e.target.value)}
            options={CURRENCIES.map((c) => ({ value: c.code, label: c.label }))}
          />
          <div className="flex gap-3">
            <Button variant="ghost" onClick={back} className="flex-1">
              Back
            </Button>
            <Button onClick={next} className="flex-1">
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 'store' && (
        <div className="space-y-4">
          <Input
            label="Store name"
            placeholder={form.businessName ? `${form.businessName} Store` : 'My Store'}
            value={form.storeName}
            onChange={(e) => setField('storeName', e.target.value)}
          />
          <Input
            label="First branch name"
            value={form.branchName}
            onChange={(e) => setField('branchName', e.target.value)}
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-3">
            <Button variant="ghost" onClick={back} className="flex-1">
              Back
            </Button>
            <Button onClick={next} className="flex-1" disabled={loading}>
              {loading ? 'Creating…' : 'Complete setup'}
            </Button>
          </div>
        </div>
      )}

      {step === 'complete' && (
        <div className="space-y-4 text-center">
          <p className="text-stone-2 leading-relaxed">
            Your business is ready. Start adding products, open POS, or customize your store.
          </p>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button className="w-full" onClick={() => void goToApp()} disabled={loading}>
            {loading ? 'Opening…' : 'Go to Business OS'}
          </Button>
        </div>
      )}
    </AuthShell>
  );
}
