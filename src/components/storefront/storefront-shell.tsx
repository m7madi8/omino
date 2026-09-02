'use client';

import { usePathname } from 'next/navigation';
import { LayoutGroup } from 'framer-motion';
import type { StorefrontCategory, StorefrontStore } from '@/types/storefront';
import { StoreCartProvider } from '@/components/storefront/store-cart-context';
import { StoreHeader } from '@/components/storefront/store-header';
import { StoreFooter } from '@/components/storefront/store-footer';
import { AnnouncementBar } from '@/components/storefront/announcement-bar';
import { StorefrontAnalyticsTracker } from '@/components/storefront/storefront-analytics-tracker';
import { CartDrawer } from '@/components/storefront/cart-drawer';
import { StorePageTransition } from '@/components/storefront/store-page-transition';
import { StoreThemeProvider } from '@/components/storefront/themes/theme-context';
import { StorefrontLocaleProvider } from '@/components/providers/storefront-locale-provider';
import { cn } from '@/lib/utils';

export function StorefrontShell({
  store,
  storeSlug,
  categories,
  children,
}: {
  store: StorefrontStore;
  storeSlug: string;
  categories: StorefrontCategory[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHome = pathname === `/store/${storeSlug}` || pathname === `/store/${storeSlug}/`;

  return (
    <StorefrontLocaleProvider locale={store.locale}>
    <StoreThemeProvider
      experience={store.experience}
      primaryColor={store.primaryColor}
      secondaryColor={store.secondaryColor}
    >
      <StoreCartProvider storeSlug={storeSlug}>
        <LayoutGroup id={`storefront-${storeSlug}`}>
        <StorefrontAnalyticsTracker storeSlug={storeSlug} storeId={store.id} />
        <AnnouncementBar storeSlug={storeSlug} config={store.experience.announcement} />
        <StoreHeader store={store} storeSlug={storeSlug} categories={categories} />
        <main
          className={cn(
            'flex-1 w-full',
            isHome ? '' : 'max-w-6xl mx-auto px-4 py-8 sm:py-10'
          )}
        >
          <StorePageTransition>{children}</StorePageTransition>
        </main>
        <StoreFooter store={store} storeSlug={storeSlug} categories={categories} />
        <CartDrawer storeSlug={storeSlug} currency={store.currency} />
      </LayoutGroup>
    </StoreCartProvider>
    </StoreThemeProvider>
    </StorefrontLocaleProvider>
  );
}
