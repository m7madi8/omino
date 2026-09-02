'use client';

import { cn } from '@/lib/utils';

export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex gap-1 overflow-x-auto scrollbar-thin border-b border-hairline -mx-1 px-1',
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'shrink-0 px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px]',
            'border-b-2 -mb-px',
            active === tab.id
              ? 'border-ink text-ink'
              : 'border-transparent text-stone-2 hover:text-ink'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
