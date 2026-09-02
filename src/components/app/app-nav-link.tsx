'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { cn } from '@/lib/utils';

type AppNavLinkProps = {
  href: string;
  label: string;
  icon: React.ReactNode;
  onNavigate?: () => void;
};

export function AppNavLink({ href, label, icon, onNavigate }: AppNavLinkProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const active =
    href === '/app' ? pathname === '/app' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      prefetch
      scroll={!href.includes('#')}
      onClick={() => {
        onNavigate?.();
        if (!active) {
          startTransition(() => {});
        }
      }}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm',
        'transition-[background-color,color,opacity,transform] duration-100 ease-out',
        'active:scale-[0.98] select-none touch-manipulation',
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
