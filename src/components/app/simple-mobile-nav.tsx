'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMerchant } from '@/components/providers/merchant-provider';
import { AddActionSheet, AddFloatingButton } from '@/components/app/add-action-sheet';
import { useState } from 'react';

type SimpleMobileNavProps = {
  canAddProduct: boolean;
  canAddOrder: boolean;
  canPos: boolean;
  onOpenAdvanced: () => void;
};

export function SimpleMobileNav({
  canAddProduct,
  canAddOrder,
  canPos,
  onOpenAdvanced,
}: SimpleMobileNavProps) {
  const pathname = usePathname();
  const { t, dir } = useMerchant();
  const [addOpen, setAddOpen] = useState(false);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-hairline bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
        aria-label="Primary navigation"
        dir={dir}
      >
        <ul className="flex items-end justify-around h-16 max-w-lg mx-auto px-2">
          <li className="flex-1 min-w-0">
            <Link
              href="/app/today"
              prefetch={false}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 h-14 touch-manipulation',
                isActive('/app/today') || pathname === '/app' ? 'text-accent' : 'text-stone-2'
              )}
              aria-current={isActive('/app/today') || pathname === '/app' ? 'page' : undefined}
            >
              <Calendar className="w-5 h-5" />
              <span className="text-[10px] font-medium">{t('nav.today')}</span>
            </Link>
          </li>
          <li className="flex-1 min-w-0">
            <Link
              href="/app/orders"
              prefetch={false}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 h-14 touch-manipulation',
                isActive('/app/orders') ? 'text-accent' : 'text-stone-2'
              )}
              aria-current={isActive('/app/orders') ? 'page' : undefined}
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="text-[10px] font-medium">{t('nav.orders')}</span>
            </Link>
          </li>
          <li className="flex-1 min-w-0 flex justify-center">
            <AddFloatingButton onClick={() => setAddOpen(true)} />
          </li>
          <li className="flex-1 min-w-0">
            <button
              type="button"
              onClick={onOpenAdvanced}
              className="flex flex-col items-center justify-center gap-0.5 h-14 w-full text-stone-2 touch-manipulation"
            >
              <span className="text-lg leading-none">⋯</span>
              <span className="text-[10px] font-medium">{t('nav.advanced')}</span>
            </button>
          </li>
        </ul>
      </nav>
      <AddActionSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        canAddProduct={canAddProduct}
        canAddOrder={canAddOrder}
        canPos={canPos}
      />
    </>
  );
}
