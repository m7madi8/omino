'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, Pause, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Execution = {
  id: string;
  status: string;
  eventType: string | null;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  error: string | null;
  steps: Array<{
    stepIndex: number;
    actionType: string | null;
    status: string;
    error: string | null;
  }>;
};

export function AutomationDetail({ automationId }: { automationId: string }) {
  const [automation, setAutomation] = useState<Record<string, unknown> | null>(null);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [autoRes, execRes] = await Promise.all([
      fetch(`/api/automations/${automationId}`),
      fetch(`/api/automations/${automationId}?executions=true`),
    ]);
    if (autoRes.ok) {
      const data = await autoRes.json();
      setAutomation(data.automation);
    }
    if (execRes.ok) {
      const data = await execRes.json();
      setExecutions(data.executions ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [automationId]);

  async function runAction(action: string) {
    await fetch(`/api/automations/${automationId}/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    await load();
  }

  if (loading || !automation) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  const config = (automation.currentVersion as { config?: Record<string, unknown> })?.config;
  const status = automation.status as string;

  return (
    <div className="max-w-3xl space-y-8">
      <Link href="/app/automations">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-sm font-medium',
                status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-stone-100 text-stone-600'
              )}
            >
              {status}
            </span>
          </div>
          <h1 className="text-xl font-medium">{automation.name as string}</h1>
          {typeof automation.description === 'string' && automation.description && (
            <p className="text-sm text-muted mt-1">{automation.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          {(status === 'DRAFT' || status === 'PAUSED') && (
            <Button size="sm" onClick={() => runAction('activate')}>
              <Play className="h-4 w-4" />
              Activate
            </Button>
          )}
          {status === 'ACTIVE' && (
            <Button size="sm" variant="ghost" onClick={() => runAction('pause')}>
              <Pause className="h-4 w-4" />
              Pause
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => runAction('duplicate')}>
            <Copy className="h-4 w-4" />
          </Button>
          <Link href={`/app/automations/${automationId}/edit`}>
            <Button size="sm" variant="ghost">
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <section className="border border-hairline rounded-sm p-4 space-y-3">
        <h2 className="text-sm font-medium">Workflow</h2>
        <div className="text-sm space-y-2">
          <p>
            <span className="text-muted">WHEN</span>{' '}
            {(config?.trigger as { type?: string })?.type?.replace(/\./g, ' · ')}
          </p>
          <p>
            <span className="text-muted">THEN</span>{' '}
            {((config?.steps as Array<{ actionType?: string }>) ?? [])
              .map((s) => s.actionType?.replace(/_/g, ' ') ?? 'step')
              .join(' → ')}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Execution history</h2>
        {executions.length === 0 ? (
          <p className="text-sm text-muted border border-dashed border-hairline rounded-sm p-6 text-center">
            No executions yet. Activate this automation to start processing events.
          </p>
        ) : (
          <div className="border border-hairline rounded-sm divide-y divide-hairline">
            {executions.map((ex) => (
              <div key={ex.id} className="p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{ex.status}</span>
                  <span className="text-xs text-muted">
                    {new Date(ex.startedAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted mt-1">
                  {ex.eventType ?? 'scheduled'}
                  {ex.durationMs != null && ` · ${ex.durationMs}ms`}
                </p>
                {ex.error && <p className="text-xs text-danger mt-1">{ex.error}</p>}
                {ex.steps.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {ex.steps.map((s) => (
                      <p key={s.stepIndex} className="text-xs text-muted">
                        Step {s.stepIndex + 1}: {s.actionType ?? 'delay'} — {s.status}
                        {s.error && ` (${s.error})`}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
