'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { StoreThemeId } from '@/lib/themes/types';
import { THEME_REGISTRY } from '@/lib/themes/registry';

type ThemeSummary = {
  id: StoreThemeId;
  version: string;
  name: string;
  description: string;
  philosophy: string;
  bestFor: string[];
  tags: string[];
  categories: string[];
  previewGradient: string;
};

type ThemesResponse = {
  themes: ThemeSummary[];
  store: { publicSlug: string; name: string };
  publishedTheme: { id: StoreThemeId; name: string };
  draftTheme: { id: StoreThemeId; name: string };
  hasUnpublishedChanges: boolean;
  recommendation?: { themeId: StoreThemeId; reason: string } | null;
};

type Device = 'desktop' | 'tablet' | 'mobile';

const DEVICE_WIDTH: Record<Device, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '390px',
};

const FILTERS = ['All', 'Minimal', 'Editorial', 'Luxury', 'Modern', 'Bold', 'Product-first'] as const;

export function ThemesLibrary() {
  const [data, setData] = useState<ThemesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('All');
  const [selected, setSelected] = useState<StoreThemeId | null>(null);
  const [device, setDevice] = useState<Device>('desktop');
  const [applying, setApplying] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmApply, setConfirmApply] = useState<StoreThemeId | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/store/themes')
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        if (!selected && d.draftTheme?.id) setSelected(d.draftTheme.id);
      })
      .finally(() => setLoading(false));
  }, [selected]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!data?.themes) return [];
    return data.themes.filter((t) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q));
      const matchesFilter =
        filter === 'All' ||
        t.categories.includes(filter.toLowerCase() as never) ||
        t.tags.some((tag) => tag.toLowerCase() === filter.toLowerCase());
      return matchesSearch && matchesFilter;
    });
  }, [data?.themes, search, filter]);

  const selectedTheme = selected ? THEME_REGISTRY[selected] : null;

  async function startPreview(themeId: StoreThemeId) {
    setPreviewing(true);
    setSelected(themeId);
    setMessage('');
    const res = await fetch('/api/store/themes/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ themeId, mode: 'draft' }),
    });
    setPreviewing(false);
    if (!res.ok) {
      setMessage('Preview failed');
      return;
    }
  }

  async function applyTheme(themeId: StoreThemeId) {
    setApplying(true);
    setMessage('');
    const res = await fetch('/api/store/themes/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ themeId }),
    });
    setApplying(false);
    setConfirmApply(null);
    if (res.ok) {
      setMessage('Theme applied to draft. Publish to make it live.');
      load();
    } else {
      setMessage('Failed to apply theme');
    }
  }

  if (loading && !data) {
    return <p className="text-stone-2">Loading themes…</p>;
  }

  if (!data) return <p className="text-stone-2">Unable to load themes.</p>;

  const previewUrl = `/store/${data.store.publicSlug}`;

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-display text-ink tracking-tight">Themes</h1>
        <p className="text-stone-2 max-w-2xl">
          Choose the visual direction that defines your storefront.
        </p>
      </header>

      {message && (
        <p className="text-sm text-stone-2 bg-paper border border-hairline rounded-sm px-4 py-3">
          {message}
        </p>
      )}

      <Card className="p-6 space-y-3">
        <p className="text-xs font-mono uppercase tracking-[0.15em] text-stone">Current theme</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-2xl font-display">{data.draftTheme.name}</p>
            <p className="text-sm text-stone-2 mt-1">
              Published: {data.publishedTheme.name}
              {data.hasUnpublishedChanges && ' · Unpublished draft changes'}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}
          >
            View storefront
          </Button>
        </div>
      </Card>

      <section className="space-y-4">
        <h2 className="text-xl font-display">Explore themes</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search themes…"
            className="sm:max-w-xs"
          />
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-sm border transition',
                  filter === f
                    ? 'bg-ink text-paper border-ink'
                    : 'border-hairline text-stone-2 hover:text-ink'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((theme) => {
            const isCurrent = data.draftTheme.id === theme.id;
            const isPublished = data.publishedTheme.id === theme.id;
            return (
              <Card
                key={theme.id}
                className={cn(
                  'overflow-hidden transition-shadow hover:shadow-soft',
                  selected === theme.id && 'ring-2 ring-accent'
                )}
              >
                <div
                  className="aspect-[16/10] relative"
                  style={{ background: theme.previewGradient }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-display text-2xl tracking-[0.2em] text-ink/80">
                      {theme.name}
                    </span>
                  </div>
                  {isCurrent && (
                    <span className="absolute top-3 start-3 text-[10px] font-mono uppercase tracking-wider bg-ink text-paper px-2 py-1 rounded-sm">
                      Draft
                    </span>
                  )}
                  {isPublished && (
                    <span className="absolute top-3 end-3 text-[10px] font-mono uppercase tracking-wider bg-paper/90 text-ink px-2 py-1 rounded-sm border border-hairline">
                      Live
                    </span>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-display text-lg">{theme.name}</h3>
                    <p className="text-sm text-stone-2 mt-1 line-clamp-2">{theme.description}</p>
                  </div>
                  <p className="text-xs text-stone font-mono">{theme.tags.join(' / ')}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={previewing}
                      onClick={() => startPreview(theme.id)}
                    >
                      Preview
                    </Button>
                    {confirmApply === theme.id ? (
                      <div className="flex gap-2 w-full flex-wrap">
                        <Button
                          type="button"
                          size="sm"
                          disabled={applying}
                          onClick={() => applyTheme(theme.id)}
                        >
                          Confirm apply
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setConfirmApply(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        disabled={applying || isCurrent}
                        onClick={() => setConfirmApply(theme.id)}
                      >
                        {isCurrent ? 'In use' : 'Apply theme'}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {selectedTheme && (
        <section className="space-y-4 border-t border-hairline pt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-display">{selectedTheme.name}</h2>
              <p className="text-sm text-stone-2 mt-1">{selectedTheme.philosophy}</p>
            </div>
            <div className="flex gap-1 rounded-sm border border-hairline p-1 bg-paper">
              {(['desktop', 'tablet', 'mobile'] as Device[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDevice(d)}
                  className={cn(
                    'px-3 py-1.5 text-xs rounded-sm capitalize transition',
                    device === d ? 'bg-ink text-paper' : 'text-stone-2 hover:text-ink'
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <p className="text-sm text-stone-2">
            Best for: {selectedTheme.bestFor.join(', ')}
          </p>

          <div className="rounded-md border border-hairline bg-stone/5 p-4 overflow-x-auto">
            <div
              className="mx-auto transition-all duration-300 border border-hairline overflow-hidden rounded-sm shadow-soft bg-paper"
              style={{ width: DEVICE_WIDTH[device], maxWidth: '100%', height: 'min(70vh, 640px)' }}
            >
              <iframe
                key={`${selected}-${device}`}
                src={previewUrl}
                title={`${selectedTheme.name} preview`}
                className="w-full h-full border-0"
              />
            </div>
          </div>

          {confirmApply === selected ? (
            <Card className="p-5 space-y-3 border-accent/30">
              <p className="font-medium">Apply this theme to your storefront?</p>
              <p className="text-sm text-stone-2">
                Your content, products, images, and brand settings will remain unchanged. Only the
                storefront presentation will change.
              </p>
              <div className="flex gap-2">
                <Button type="button" disabled={applying} onClick={() => selected && applyTheme(selected)}>
                  Apply theme
                </Button>
                <Button type="button" variant="ghost" onClick={() => setConfirmApply(null)}>
                  Cancel
                </Button>
              </div>
            </Card>
          ) : null}
        </section>
      )}
    </div>
  );
}
