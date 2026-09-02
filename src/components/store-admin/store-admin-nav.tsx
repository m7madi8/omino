'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

const STORE_NAV = [
  { href: '/app/store', label: 'Overview', match: (p: string) => p === '/app/store' },
  { href: '/app/store?tab=identity', label: 'Identity', match: (p: string) => false },
  { href: '/app/store?tab=homepage', label: 'Homepage', match: (p: string) => false },
  { href: '/app/store?tab=hero', label: 'Navigation', match: (p: string) => false },
  { href: '/app/store/themes', label: 'Themes', match: (p: string) => p.startsWith('/app/store/themes') },
  { href: '/app/store?tab=appearance', label: 'Appearance', match: (p: string) => false },
  { href: '/app/store?tab=seo', label: 'SEO', match: (p: string) => false },
  { href: '/app/store?tab=contact', label: 'Commerce', match: (p: string) => false },
  { href: '/app/store?tab=policies', label: 'Policies', match: (p: string) => false },
  { href: '/app/store?tab=overview', label: 'Settings', match: (p: string) => false },
];

export function StoreAdminNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');

  return (
    <nav
      className="flex gap-1 overflow-x-auto pb-1 -mx-1 scrollbar-thin border-b border-hairline mb-8"
      aria-label="Store settings"
    >
      {STORE_NAV.map((item) => {
        const isThemes = item.href === '/app/store/themes';
        const active = isThemes
          ? pathname.startsWith('/app/store/themes')
          : item.href === '/app/store'
            ? pathname === '/app/store' && !tab
            : item.href.includes(`tab=${tab}`) && pathname === '/app/store';

        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              'shrink-0 px-3 py-2 text-sm font-medium rounded-sm transition-colors min-h-[40px] inline-flex items-center',
              active ? 'bg-ink text-paper' : 'text-stone-2 hover:text-ink hover:bg-paper'
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
