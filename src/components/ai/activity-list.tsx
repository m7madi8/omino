'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Action = {
  id: string;
  toolName: string;
  status: string;
  user: { fullName: string | null; email: string };
  conversationTitle: string | null;
  createdAt: string;
  executedAt: string | null;
  error: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-amber-600 bg-amber-50',
  EXECUTED: 'text-green-700 bg-green-50',
  FAILED: 'text-danger bg-danger/10',
  CANCELLED: 'text-muted bg-paper-2',
  CONFIRMED: 'text-blue-700 bg-blue-50',
};

export function AiActivityList() {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ai/actions')
      .then((r) => r.json())
      .then((d) => setActions(d.actions ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/ai">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to AI
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Bot className="h-6 w-6" />
        <div>
          <h1 className="text-xl font-medium">AI Activity</h1>
          <p className="text-sm text-muted">Actions performed by OMINO AI on your behalf.</p>
        </div>
      </div>

      {loading && <p className="text-sm text-muted">Loading…</p>}

      {!loading && actions.length === 0 && (
        <p className="text-sm text-muted py-8 text-center border border-dashed border-hairline rounded-sm">
          No AI actions yet.
        </p>
      )}

      <div className="space-y-2">
        {actions.map((action) => (
          <div
            key={action.id}
            className="flex items-center justify-between p-4 rounded-sm border border-hairline bg-paper"
          >
            <div>
              <p className="font-medium text-sm">
                {action.toolName.replace(/_/g, ' ')}
              </p>
              <p className="text-xs text-muted mt-0.5">
                {action.user.fullName ?? action.user.email}
                {action.conversationTitle ? ` · ${action.conversationTitle}` : ''}
              </p>
            </div>
            <div className="text-right">
              <span
                className={`text-xs px-2 py-1 rounded-sm ${STATUS_COLORS[action.status] ?? 'bg-paper-2'}`}
              >
                {action.status}
              </span>
              <p className="text-xs text-muted mt-1">
                {new Date(action.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
