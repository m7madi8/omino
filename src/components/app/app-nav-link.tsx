'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { cn } from '@/lib/utils';

type AppNavLinkProps = {
  href: string;
  label: string;
  icon: React.ReactNode;
  onNavigate?: () => void;
  compact?: boolean;
};

export function AppNavLink({ href, label, icon, onNavigate, compact }: AppNavLinkProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const active =
    href === '/app' ? pathname === '/app' : pathname === href || pathname.startsWith(`${href}/`);

  function prefetchRoute() {
    router.prefetch(href);
  }

  return (
    <Link
      href={href}
      prefetch={false}
      scroll={!href.includes('#')}
      onMouseEnter={prefetchRoute}
      onFocus={prefetchRoute}
      onTouchStart={prefetchRoute}
      onClick={() => {
        onNavigate?.();
        if (!active) {
          startTransition(() => {});
        }
      }}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-sm touch-manipulation select-none',
        'transition-[background-color,color,opacity,transform] duration-100 ease-out',
        'active:scale-[0.98]',
        compact ? 'px-3 py-3 text-sm min-h-[44px]' : 'px-3 py-2.5 text-sm',
        active
          ? 'bg-paper/10 text-paper'
          : 'text-stone hover:bg-paper/5 hover:text-paper',
        isPending && !active && 'opacity-60'
      )}
    >
      <span className="w-4 h-4 shrink-0 flex items-center justify-center">{icon}</span>
      {label}
    </Link>
  );
}
