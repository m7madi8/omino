'use client';

import { Package, Plus, ShoppingCart, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMerchant } from '@/components/providers/merchant-provider';
import { cn } from '@/lib/utils';

type AddActionSheetProps = {
  open: boolean;
  onClose: () => void;
  canAddProduct: boolean;
  canAddOrder: boolean;
  canPos: boolean;
};

export function AddActionSheet({
  open,
  onClose,
  canAddProduct,
  canAddOrder,
  canPos,
}: AddActionSheetProps) {
  const router = useRouter();
  const { t, dir } = useMerchant();

  if (!open) return null;

  const actions = [
    {
      key: 'product',
      label: t('add.product'),
      icon: Package,
      href: '/app/products/quick',
      enabled: canAddProduct,
    },
    {
      key: 'manual',
      label: t('add.manualOrder'),
      icon: ShoppingBag,
      href: '/app/orders/new',
      enabled: canAddOrder,
    },
    {
      key: 'pos',
      label: t('add.posSale'),
      icon: ShoppingCart,
      href: '/app/pos?mode=simple',
      enabled: canPos,
    },
  ].filter((a) => a.enabled);

  function navigate(href: string) {
    onClose();
    router.push(href);
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-50 bg-ink/40 lg:hidden"
        onClick={onClose}
        aria-label={t('common.cancel')}
      />
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 lg:hidden',
          'rounded-t-xl bg-white border-t border-hairline shadow-lift',
          'pb-[calc(1rem+env(safe-area-inset-bottom))]'
        )}
        dir={dir}
        role="dialog"
        aria-modal="true"
        aria-label={t('add.title')}
      >
        <div className="w-10 h-1 rounded-full bg-hairline mx-auto mt-3 mb-4" />
        <p className="text-center font-display text-lg px-4 mb-4">{t('add.title')}</p>
        <ul className="px-4 space-y-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <li key={action.key}>
                <button
                  type="button"
                  onClick={() => navigate(action.href)}
                  className="w-full flex items-center gap-4 p-4 rounded-md border border-hairline bg-paper hover:bg-paper-2 touch-manipulation min-h-[56px] active:scale-[0.99] transition-transform"
                >
                  <span className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/10 text-accent">
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="text-base font-medium">{action.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-3 py-3 text-sm text-stone-2 touch-manipulation min-h-[44px]"
        >
          {t('common.cancel')}
        </button>
      </div>
    </>
  );
}

export function AddFloatingButton({ onClick }: { onClick: () => void }) {
  const { t } = useMerchant();
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-0.5 -mt-5 touch-manipulation"
      aria-label={t('nav.add')}
    >
      <span className="flex items-center justify-center w-12 h-12 rounded-full bg-accent text-white shadow-lift active:scale-95 transition-transform">
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </span>
      <span className="text-[10px] font-medium text-accent">{t('nav.add')}</span>
    </button>
  );
}
