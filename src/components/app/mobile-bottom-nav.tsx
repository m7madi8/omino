'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Menu,
  Package,
  ShoppingBag,
  ShoppingCart,
  Store,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type MobileNavItem = {
  slug: string;
  label: string;
  href: string;
};

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  overview: LayoutDashboard,
  orders: ShoppingBag,
  products: Package,
  pos: ShoppingCart,
  store: Store,
};

type MobileBottomNavProps = {
  items: MobileNavItem[];
  onOpenMenu: () => void;
};

export function MobileBottomNav({ items, onOpenMenu }: MobileBottomNavProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === '/app' ? pathname === '/app' : pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-hairline bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary navigation"
    >
      <ul className="flex items-stretch justify-around h-14 max-w-lg mx-auto">
        {items.map((item) => {
          const Icon = ICONS[item.slug] ?? LayoutDashboard;
          const active = isActive(item.href);
          return (
            <li key={item.slug} className="flex-1 min-w-0">
              <Link
                href={item.href}
                prefetch={false}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 h-full px-1',
                  'touch-manipulation active:scale-95 transition-transform duration-75',
                  active ? 'text-accent' : 'text-stone-2'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className={cn('w-5 h-5', active && 'stroke-[2.5px]')} />
                <span className="text-[10px] font-medium truncate max-w-full px-0.5">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
        <li className="flex-1 min-w-0">
          <button
            type="button"
            onClick={onOpenMenu}
            className="flex flex-col items-center justify-center gap-0.5 h-full w-full px-1 text-stone-2 touch-manipulation active:scale-95 transition-transform duration-75"
            aria-label="Open full menu"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium">Menu</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}

/** Pick high-frequency routes for thumb reach on mobile. */
export function pickMobileBottomNavItems(
  navItems: ReadonlyArray<{ slug: string; label: string; href: string }>
): MobileNavItem[] {
  const priority = ['overview', 'orders', 'products', 'pos', 'store'];
  const picked: MobileNavItem[] = [];

  for (const slug of priority) {
    const item = navItems.find((n) => n.slug === slug);
    if (item) picked.push({ slug: item.slug, label: item.label, href: item.href });
    if (picked.length >= 4) break;
  }

  return picked;
}
