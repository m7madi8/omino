'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bot,
  Loader2,
  MessageSquarePlus,
  Send,
  Sparkles,
  Trash2,
  Check,
  X,
  Activity,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SessionUser } from '@/types';

type Conversation = {
  id: string;
  title: string;
  agentType: string | null;
  updatedAt: string;
  messageCount: number;
  lastMessage: string | null;
};

type Message = {
  id: string;
  role: string;
  content: string;
  createdAt: string;
};

type PendingAction = {
  id: string;
  toolName: string;
  dryRunResult: Record<string, unknown>;
};

const SUGGESTED_PROMPTS = [
  'How is my business doing?',
  'What sold best this month?',
  'Show me low-stock products.',
  'Who are my best customers?',
  'What should I focus on this week?',
];

const AGENT_LABELS: Record<string, string> = {
  ANALYST: 'Analyst',
  OPERATIONS: 'Operations',
  CUSTOMER: 'Customer',
  GROWTH: 'Growth',
};

function mapAiError(code?: string): string | null {
  const messages: Record<string, string> = {
    AI_DISABLED: 'AI is currently disabled.',
    AI_NOT_CONFIGURED: 'AI is not configured. Contact your administrator.',
    AI_AUTH_ERROR: 'AI authentication failed. Check server configuration.',
    AI_RATE_LIMITED: 'Too many AI requests. Please wait a moment.',
    RATE_LIMITED: 'Too many requests. Please wait a moment.',
    AI_TIMEOUT: 'AI request timed out. Please try again.',
    AI_UNAVAILABLE: 'AI service is temporarily unavailable.',
    AI_PROVIDER_ERROR: 'AI service error. Please try again.',
  };
  return code ? messages[code] ?? null : null;
}

export function AiChat({ user }: { user: SessionUser }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [agentType, setAgentType] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const canExecute = user.permissions.includes('ai.execute');

  const loadConversations = useCallback(async () => {
    const res = await fetch('/api/ai/conversations');
    if (!res.ok) return;
    const data = await res.json();
    setConversations(data.conversations);
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    const res = await fetch(`/api/ai/conversations/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.conversation.messages);
    setAgentType(data.conversation.agentType);
    setPendingActions(
      (data.conversation.pendingActions ?? []).map((a: PendingAction) => ({
        id: a.id,
        toolName: a.toolName,
        dryRunResult: a.dryRunResult as Record<string, unknown>,
      }))
    );
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (activeId) loadConversation(activeId);
  }, [activeId, loadConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, statusText]);

  async function startConversation() {
    setError(null);
    const res = await fetch('/api/ai/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      setError('Could not start a conversation.');
      return;
    }
    const data = await res.json();
    setActiveId(data.conversation.id);
    setMessages([]);
    setPendingActions([]);
    await loadConversations();
  }

  async function sendMessage(text?: string) {
    const message = (text ?? input).trim();
    if (!message || loading) return;

    setError(null);
    setInput('');
    setLoading(true);
    setStatusText('Thinking…');

    let conversationId = activeId;
    if (!conversationId) {
      const createRes = await fetch('/api/ai/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!createRes.ok) {
        setError('Could not start a conversation.');
        setLoading(false);
        setStatusText(null);
        return;
      }
      const created = await createRes.json();
      conversationId = created.conversation.id;
      setActiveId(conversationId);
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        role: 'USER',
        content: message,
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      const res = await fetch(`/api/ai/conversations/${conversationId}/messages?stream=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(mapAiError(data.error) ?? 'Something went wrong.');
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setError('Streaming not supported.');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let streamedContent = '';
      const tempAssistantId = `stream-${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        {
          id: tempAssistantId,
          role: 'ASSISTANT',
          content: '',
          createdAt: new Date().toISOString(),
        },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const eventBlock of events) {
          const lines = eventBlock.split('\n');
          const eventLine = lines.find((l) => l.startsWith('event: '));
          const dataLine = lines.find((l) => l.startsWith('data: '));
          if (!eventLine || !dataLine) continue;

          const event = eventLine.slice(7);
          const data = JSON.parse(dataLine.slice(6)) as Record<string, unknown>;

          if (event === 'status' && typeof data.message === 'string') {
            setStatusText(data.message);
          } else if (event === 'content' && typeof data.delta === 'string') {
            streamedContent += data.delta;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempAssistantId ? { ...m, content: streamedContent } : m
              )
            );
          } else if (event === 'error') {
            setError(mapAiError(data.error as string) ?? 'Something went wrong.');
            return;
          } else if (event === 'done') {
            const result = data.result as { agentType?: string };
            if (result?.agentType) setAgentType(result.agentType);
          }
        }
      }

      await loadConversation(conversationId!);
      await loadConversations();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setStatusText(null);
    }
  }

  async function handleAction(actionId: string, action: 'confirm' | 'cancel') {
    if (action === 'confirm' && !canExecute) {
      setError('You do not have permission to execute AI actions.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ai/actions/${actionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Action failed.');
        return;
      }
      if (activeId) await loadConversation(activeId);
    } finally {
      setLoading(false);
    }
  }

  async function deleteConversation(id: string) {
    await fetch(`/api/ai/conversations/${id}`, { method: 'DELETE' });
    if (activeId === id) {
      setActiveId(null);
      setMessages([]);
    }
    await loadConversations();
  }

  return (
    <div className="flex h-[calc(100svh-4rem)] lg:h-[calc(100svh-5rem)] -m-4 lg:-m-6">
      {/* Conversations sidebar */}
      <aside className="hidden md:flex w-72 flex-col border-r border-hairline bg-paper-2/50">
        <div className="p-4 border-b border-hairline flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="font-medium text-sm">Conversations</span>
          </div>
          <Button size="sm" variant="ghost" onClick={startConversation} aria-label="New conversation">
            <MessageSquarePlus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={cn(
                'w-full text-left rounded-sm px-3 py-2.5 text-sm transition-colors group',
                activeId === c.id ? 'bg-ink text-paper' : 'hover:bg-paper-2 text-ink'
              )}
            >
              <div className="font-medium truncate">{c.title}</div>
              <div className={cn('text-xs truncate mt-0.5', activeId === c.id ? 'text-paper/70' : 'text-muted')}>
                {c.lastMessage ?? 'No messages yet'}
              </div>
            </button>
          ))}
          {conversations.length === 0 && (
            <p className="text-sm text-muted px-3 py-4">No conversations yet.</p>
          )}
        </div>
        <div className="p-3 border-t border-hairline">
          <Link
            href="/app/ai/activity"
            className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors px-2 py-1.5"
          >
            <Activity className="h-4 w-4" />
            AI Activity
          </Link>
        </div>
      </aside>

      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 py-3 border-b border-hairline bg-paper">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-sm bg-ink flex items-center justify-center">
              <Bot className="h-5 w-5 text-paper" />
            </div>
            <div>
              <h1 className="font-medium text-sm">OMINO Intelligence</h1>
              <p className="text-xs text-muted">
                {agentType ? AGENT_LABELS[agentType] ?? agentType : 'Business AI'}
                {user.storeName ? ` · ${user.storeName}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="md:hidden" onClick={startConversation}>
              <MessageSquarePlus className="h-4 w-4" />
            </Button>
            {activeId && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteConversation(activeId)}
                aria-label="Clear conversation"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.length === 0 && !loading && (
            <div className="max-w-lg mx-auto text-center pt-12">
              <Sparkles className="h-10 w-10 text-accent mx-auto mb-4" />
              <h2 className="text-lg font-medium mb-2">Ask OMINO anything about your business</h2>
              <p className="text-sm text-muted mb-8">
                Real data from sales, inventory, customers, and orders — never guesses.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="text-sm px-3 py-2 rounded-sm border border-hairline hover:bg-paper-2 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={cn('flex', m.role === 'USER' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[85%] md:max-w-[70%] rounded-sm px-4 py-3 text-sm whitespace-pre-wrap',
                  m.role === 'USER'
                    ? 'bg-ink text-paper'
                    : 'bg-paper-2 border border-hairline text-ink'
                )}
              >
                {m.content}
              </div>
            </div>
          ))}

          {statusText && loading && (
            <div className="flex items-center gap-2 text-sm text-muted px-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {statusText}
            </div>
          )}

          {pendingActions.map((action) => (
            <div
              key={action.id}
              className="max-w-lg mx-auto rounded-sm border border-accent/30 bg-accent/5 p-4 space-y-3"
            >
              <p className="text-sm font-medium">Confirm action: {action.toolName.replace(/_/g, ' ')}</p>
              <pre className="text-xs bg-paper rounded-sm p-3 overflow-x-auto border border-hairline">
                {JSON.stringify(action.dryRunResult, null, 2)}
              </pre>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAction(action.id, 'confirm')}
                  disabled={loading || !canExecute}
                >
                  <Check className="h-4 w-4" />
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleAction(action.id, 'cancel')}
                  disabled={loading}
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
              {!canExecute && (
                <p className="text-xs text-muted">Requires ai.execute permission.</p>
              )}
            </div>
          ))}

          {error && (
            <div className="max-w-lg mx-auto text-sm text-danger bg-danger/10 border border-danger/20 rounded-sm px-4 py-3 flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-danger hover:opacity-70">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="p-4 border-t border-hairline bg-paper">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2 max-w-3xl mx-auto"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about sales, inventory, customers…"
              disabled={loading}
              className="flex-1 h-11 px-4 rounded-sm border border-hairline bg-paper text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>

      {/* Context panel */}
      <aside className="hidden xl:flex w-64 flex-col border-l border-hairline bg-paper-2/30 p-4 text-sm">
        <h3 className="font-medium mb-3">Business context</h3>
        <dl className="space-y-2 text-muted">
          <div>
            <dt className="text-xs uppercase tracking-wide">Organization</dt>
            <dd className="text-ink">{user.organizationName}</dd>
          </div>
          {user.storeName && (
            <div>
              <dt className="text-xs uppercase tracking-wide">Store</dt>
              <dd className="text-ink">{user.storeName}</dd>
            </div>
          )}
          {user.branchName && (
            <div>
              <dt className="text-xs uppercase tracking-wide">Branch</dt>
              <dd className="text-ink">{user.branchName}</dd>
            </div>
          )}
        </dl>
        <div className="mt-6">
          <h3 className="font-medium mb-2">Suggested</h3>
          <div className="space-y-1">
            {SUGGESTED_PROMPTS.slice(0, 3).map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className="block w-full text-left text-xs text-muted hover:text-ink py-1"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
