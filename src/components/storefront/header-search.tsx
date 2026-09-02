'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function HeaderSearch({
  storeSlug,
  className,
  variant = 'icon',
}: {
  storeSlug: string;
  className?: string;
  variant?: 'icon' | 'expanded';
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(variant === 'expanded');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setOpen(variant === 'expanded');
    router.push(`/store/${storeSlug}/products?q=${encodeURIComponent(q)}`);
  }

  if (variant === 'expanded') {
    return (
      <form onSubmit={submit} className={cn('w-full', className)}>
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 sf-muted pointer-events-none" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
            className="h-11 w-full ps-10 pe-4 text-sm rounded-sm border sf-border bg-white sf-ink outline-none focus:ring-1 focus:ring-[var(--sf-primary)]"
          />
        </div>
      </form>
    );
  }

  return (
    <div className={cn('relative flex items-center', className)}>
      {open ? (
        <form onSubmit={submit} className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
            className="h-10 w-[9.5rem] sm:w-[12rem] px-3 text-sm rounded-sm border sf-border bg-white sf-ink outline-none focus:ring-1 focus:ring-[var(--sf-primary)]"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center sf-muted"
            aria-label="Close search"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center transition-colors sf-muted hover:sf-ink"
          aria-label="Open search"
        >
          <Search className="w-[18px] h-[18px]" />
        </button>
      )}
    </div>
  );
}
