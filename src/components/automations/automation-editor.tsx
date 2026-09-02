'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Trigger = { type: string; name: string; category: string };
type Action = { type: string; name: string };
type Step = {
  type: 'action' | 'delay';
  actionType?: string;
  input?: Record<string, unknown>;
  delay?: { hours?: number; minutes?: number };
};

export function AutomationEditor({ automationId }: { automationId?: string }) {
  const router = useRouter();
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState('order.completed');
  const [steps, setSteps] = useState<Step[]>([
    { type: 'action', actionType: 'send_notification', input: { title: '', body: '' } },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/automations?meta=true')
      .then((r) => r.json())
      .then((d) => {
        setTriggers(d.triggers ?? []);
        setActions(d.actions ?? []);
      });

    if (automationId) {
      fetch(`/api/automations/${automationId}`)
        .then((r) => r.json())
        .then((d) => {
          const a = d.automation;
          setName(a.name);
          setDescription(a.description ?? '');
          const config = a.currentVersion?.config;
          if (config) {
            setTriggerType(config.trigger?.type ?? 'order.completed');
            setSteps(config.steps ?? []);
          }
        });
    }
  }, [automationId]);

  async function save() {
    setSaving(true);
    setError(null);
    const config = { trigger: { type: triggerType }, steps };
    const url = automationId ? `/api/automations/${automationId}` : '/api/automations';
    const method = automationId ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, config }),
    });

    if (!res.ok) {
      setError('Failed to save automation.');
      setSaving(false);
      return;
    }

    const data = await res.json();
    router.push(`/app/automations/${data.automation.id}`);
  }

  function updateStep(index: number, patch: Partial<Step>) {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  return (
    <div className="max-w-2xl space-y-8">
      <Link href="/app/automations">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </Link>

      <div>
        <h1 className="text-xl font-medium">
          {automationId ? 'Edit automation' : 'New automation'}
        </h1>
        <p className="text-sm text-muted mt-1">
          Define when this workflow runs and what it does.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-muted">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full h-11 px-3 border border-hairline rounded-sm text-sm"
            placeholder="High value order follow-up"
          />
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-muted">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-hairline rounded-sm text-sm min-h-[80px]"
            placeholder="Optional description"
          />
        </div>
      </div>

      <section className="border border-hairline rounded-sm p-4 space-y-3">
        <h2 className="text-sm font-medium">WHEN</h2>
        <select
          value={triggerType}
          onChange={(e) => setTriggerType(e.target.value)}
          className="w-full h-10 px-3 border border-hairline rounded-sm text-sm"
        >
          {triggers.map((t) => (
            <option key={t.type} value={t.type}>
              {t.name} ({t.category})
            </option>
          ))}
        </select>
      </section>

      <section className="border border-hairline rounded-sm p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">THEN</h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              setSteps([
                ...steps,
                { type: 'action', actionType: 'send_notification', input: { title: '', body: '' } },
              ])
            }
          >
            Add step
          </Button>
        </div>

        {steps.map((step, i) => (
          <div key={i} className="p-3 bg-paper-2 rounded-sm space-y-2">
            {step.type === 'action' ? (
              <>
                <select
                  value={step.actionType}
                  onChange={(e) => updateStep(i, { actionType: e.target.value })}
                  className="w-full h-9 px-2 border border-hairline rounded-sm text-sm"
                >
                  {actions.map((a) => (
                    <option key={a.type} value={a.type}>
                      {a.name}
                    </option>
                  ))}
                </select>
                {step.actionType === 'send_notification' && (
                  <>
                    <input
                      placeholder="Notification title"
                      value={(step.input?.title as string) ?? ''}
                      onChange={(e) =>
                        updateStep(i, { input: { ...step.input, title: e.target.value } })
                      }
                      className="w-full h-9 px-2 border border-hairline rounded-sm text-sm"
                    />
                    <textarea
                      placeholder="Notification body"
                      value={(step.input?.body as string) ?? ''}
                      onChange={(e) =>
                        updateStep(i, { input: { ...step.input, body: e.target.value } })
                      }
                      className="w-full px-2 py-1 border border-hairline rounded-sm text-sm min-h-[60px]"
                    />
                  </>
                )}
                {step.actionType === 'add_customer_tag' && (
                  <input
                    placeholder="Tag name"
                    value={(step.input?.tagName as string) ?? ''}
                    onChange={(e) =>
                      updateStep(i, {
                        input: {
                          ...step.input,
                          tagName: e.target.value,
                          customerId: '{{order.customerId}}',
                        },
                      })
                    }
                    className="w-full h-9 px-2 border border-hairline rounded-sm text-sm"
                  />
                )}
              </>
            ) : (
              <p className="text-sm text-muted">Delay step</p>
            )}
          </div>
        ))}
      </section>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-2">
        <Button onClick={save} disabled={saving || !name.trim()}>
          {saving ? 'Saving…' : 'Save as draft'}
        </Button>
      </div>
    </div>
  );
}
