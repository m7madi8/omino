'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Workflow, Play, Pause, Copy, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Automation = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  triggerType: string | null;
  lastExecution: { startedAt: string; status: string } | null;
  executionCount: number;
  successRate: number | null;
  updatedAt: string;
};

type Template = {
  id: string;
  name: string;
  description: string;
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-50 text-green-700',
  DRAFT: 'bg-stone-100 text-stone-600',
  PAUSED: 'bg-amber-50 text-amber-700',
  ARCHIVED: 'bg-stone-100 text-stone-400',
};

export function AutomationsList() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [autoRes, metaRes] = await Promise.all([
      fetch('/api/automations'),
      fetch('/api/automations?meta=true'),
    ]);
    if (autoRes.ok) {
      const data = await autoRes.json();
      setAutomations(data.automations);
    }
    if (metaRes.ok) {
      const data = await metaRes.json();
      setTemplates(data.templates ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createFromTemplate(templateId: string) {
    const res = await fetch('/api/automations/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId }),
    });
    if (res.ok) {
      const data = await res.json();
      window.location.href = `/app/automations/${data.automation.id}`;
    }
  }

  async function toggleStatus(id: string, action: 'activate' | 'pause') {
    await fetch(`/api/automations/${id}/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    await load();
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading automations…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium">Automations</h1>
          <p className="text-sm text-muted mt-1">
            Automate repetitive work so your business keeps moving.
          </p>
        </div>
        <Link href="/app/automations/new">
          <Button>
            <Plus className="h-4 w-4" />
            Create automation
          </Button>
        </Link>
      </div>

      {automations.length === 0 ? (
        <div className="border border-dashed border-hairline rounded-sm p-12 text-center">
          <Workflow className="h-10 w-10 text-accent mx-auto mb-4" />
          <h2 className="font-medium mb-2">No automations yet</h2>
          <p className="text-sm text-muted mb-6 max-w-md mx-auto">
            Automate the repetitive work so your business keeps moving without
            you having to watch every step.
          </p>
          <Link href="/app/automations/new">
            <Button>Create automation</Button>
          </Link>
        </div>
      ) : (
        <div className="border border-hairline rounded-sm divide-y divide-hairline">
          {automations.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-4 p-4 hover:bg-paper-2/50 transition-colors"
            >
              <Link href={`/app/automations/${a.id}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-sm font-medium',
                      STATUS_STYLES[a.status] ?? 'bg-paper-2'
                    )}
                  >
                    {a.status}
                  </span>
                  <span className="font-medium truncate">{a.name}</span>
                </div>
                <p className="text-xs text-muted mt-1 truncate">
                  {a.triggerType?.replace(/\./g, ' · ') ?? 'No trigger'}
                  {a.executionCount > 0 && ` · ${a.executionCount} runs`}
                  {a.successRate != null && ` · ${a.successRate}% success`}
                </p>
              </Link>
              <div className="flex items-center gap-1">
                {a.status === 'DRAFT' || a.status === 'PAUSED' ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleStatus(a.id, 'activate')}
                    title="Activate"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                ) : a.status === 'ACTIVE' ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleStatus(a.id, 'pause')}
                    title="Pause"
                  >
                    <Pause className="h-4 w-4" />
                  </Button>
                ) : null}
                <Link href={`/app/automations/${a.id}`}>
                  <Button size="sm" variant="ghost">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {templates.length > 0 && (
        <div>
          <h2 className="text-sm font-medium mb-3">Suggested templates</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => createFromTemplate(t.id)}
                className="text-left p-4 border border-hairline rounded-sm hover:bg-paper-2 transition-colors"
              >
                <p className="font-medium text-sm">{t.name}</p>
                <p className="text-xs text-muted mt-1">{t.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
