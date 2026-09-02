'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Menu, ShoppingBag, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { StorefrontCategory, StorefrontStore } from '@/types/storefront';
import { buildStoreNavCategories } from '@/lib/storefront/nav-categories';
import { HeaderSearch } from '@/components/storefront/header-search';
import { SocialContactIcons } from '@/components/storefront/social-contact-icons';
import { useStoreCart } from '@/components/storefront/store-cart-context';
import { useStorefrontLocale } from '@/components/providers/storefront-locale-provider';

function NavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  function handleMouseEnter(e: React.MouseEvent<HTMLAnchorElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const fromLeft = e.clientX - rect.left < rect.width / 2;
    e.currentTarget.style.setProperty('--sf-underline-origin', fromLeft ? 'left' : 'right');
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      className="sf-nav-link text-[13px] tracking-[0.02em] transition-colors sf-muted hover:sf-ink"
    >
      {children}
    </Link>
  );
}

function StoreLogo({
  store,
  storeSlug,
  size = 'default',
  onClick,
}: {
  store: StorefrontStore;
  storeSlug: string;
  size?: 'default' | 'compact' | 'menu';
  onClick?: () => void;
}) {
  const sizes = {
    default: { img: 'h-8 max-w-[9rem]', text: 'text-lg' },
    compact: { img: 'h-7 max-w-[7rem]', text: 'text-base' },
    menu: { img: 'h-12 max-w-[10rem]', text: 'text-2xl' },
  }[size];

  return (
    <Link
      href={`/store/${storeSlug}`}
      onClick={onClick}
      className="flex items-center gap-3 min-w-0 min-h-[44px] group motion-safe:transition-opacity motion-safe:hover:opacity-85"
      aria-label={`${store.name} home`}
    >
      {store.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={store.logoUrl} alt="" className={cn('w-auto object-contain', sizes.img)} />
      ) : (
        <span className={cn('font-display tracking-tight truncate sf-ink', sizes.text)}>
          {store.name}
        </span>
      )}
    </Link>
  );
}

export function StoreHeader({
  store,
  storeSlug,
  categories,
}: {
  store: StorefrontStore;
  storeSlug: string;
  categories: StorefrontCategory[];
}) {
  const { t } = useStorefrontLocale();
  const pathname = usePathname();
  const { cart, cartPulse, badgeBump, openDrawer } = useStoreCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { primary: primaryCategories, overflow: overflowCategories } = buildStoreNavCategories(
    categories,
    storeSlug
  );

  const shopHref = `/store/${storeSlug}/products`;

  const mobileNavItems = [
    { href: shopHref, label: t('sf.nav.shopAll') },
    ...primaryCategories,
    ...overflowCategories,
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={cn(
          'sf-header sticky top-0 z-50 w-full border-b sf-border bg-white/95 backdrop-blur-md transition-shadow duration-300',
          scrolled && 'shadow-[0_1px_0_0_var(--sf-border),0_8px_24px_-12px_rgba(0,0,0,0.08)]'
        )}
      >
        <div
          className={cn(
            'max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-4 transition-[height] duration-300',
            scrolled ? 'h-[3.25rem]' : 'h-14 sm:h-16'
          )}
        >
          <div className="min-w-0 flex-1 lg:flex-none">
            <StoreLogo store={store} storeSlug={storeSlug} size="compact" />
          </div>

          <nav
            className="hidden lg:flex items-center justify-center gap-0.5 flex-1"
            aria-label={t('sf.nav.menu')}
          >
            <NavLink href={shopHref}>{t('sf.nav.shop')}</NavLink>
            {primaryCategories.map((cat) => (
              <NavLink key={cat.href} href={cat.href}>
                {cat.label}
              </NavLink>
            ))}
            {overflowCategories.length > 0 && (
              <div
                className="relative"
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <button
                  type="button"
                  className="sf-nav-link text-[13px] tracking-[0.02em] inline-flex items-center gap-1 min-h-[44px] px-2 transition-colors sf-muted hover:sf-ink"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                >
                  {t('sf.nav.more')}
                  <ChevronDown
                    className={cn('w-3.5 h-3.5 transition-transform', dropdownOpen && 'rotate-180')}
                  />
                </button>
                <div
                  className={cn(
                    'absolute top-full start-1/2 -translate-x-1/2 pt-2 min-w-[11rem] transition-all duration-200',
                    dropdownOpen
                      ? 'opacity-100 visible translate-y-0'
                      : 'opacity-0 invisible -translate-y-1'
                  )}
                >
                  <div className="sf-surface border sf-border py-2 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.18)]">
                    {overflowCategories.map((cat) => (
                      <Link
                        key={cat.href}
                        href={cat.href}
                        className="block px-4 py-2.5 text-sm sf-muted hover:sf-ink hover:bg-[color-mix(in_srgb,var(--sf-secondary)_20%,transparent)] transition-colors"
                      >
                        {cat.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </nav>

          <div className="flex items-center justify-end gap-0.5 sm:gap-1 shrink-0">
            <div className="hidden md:block">
              <HeaderSearch storeSlug={storeSlug} />
            </div>
            <button
              type="button"
              data-sf-cart-trigger
              onClick={openDrawer}
              className={cn(
                'relative min-w-[44px] min-h-[44px] inline-flex items-center justify-center transition-colors sf-muted hover:sf-ink',
                cartPulse && 'motion-safe:sf-cart-pulse'
              )}
              aria-label={
                cart?.itemCount
                  ? t('sf.openCartWithCount', { n: String(cart.itemCount) })
                  : t('sf.cart')
              }
            >
              <ShoppingBag className="w-[18px] h-[18px]" strokeWidth={1.5} />
              {cart && cart.itemCount > 0 && (
                <motion.span
                  key={cart.itemCount}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: badgeBump ? [1, 1.25, 1] : 1, opacity: 1 }}
                  transition={{ duration: 0.35 }}
                  className="absolute top-2 end-1.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-mono flex items-center justify-center sf-btn-primary"
                >
                  {cart.itemCount}
                </motion.span>
              )}
            </button>
            <button
              type="button"
              className="lg:hidden min-w-[44px] min-h-[44px] inline-flex items-center justify-center transition-colors sf-muted hover:sf-ink"
              onClick={() => setMenuOpen(true)}
              aria-label={t('sf.nav.openMenu')}
              aria-expanded={menuOpen}
            >
              <Menu className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label={t('sf.nav.menu')}>
            <motion.button
              type="button"
              className="absolute inset-0 bg-black/45"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setMenuOpen(false)}
              aria-label={t('sf.nav.closeMenu')}
            />
            <motion.div
              className="absolute inset-y-0 end-0 w-full max-w-[min(100%,22rem)] bg-white flex flex-col shadow-2xl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            >
              <div className="flex items-center justify-between px-4 h-14 border-b sf-border shrink-0">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] sf-muted">{t('sf.nav.menu')}</span>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center sf-muted"
                  aria-label={t('sf.nav.closeMenu')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-6 border-b sf-border shrink-0 space-y-4">
                <div className="flex flex-col items-start gap-3">
                  {store.logoUrl ? (
                    <Link href={`/store/${storeSlug}`} onClick={() => setMenuOpen(false)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={store.logoUrl}
                        alt={store.name}
                        className="h-14 w-auto max-w-[12rem] object-contain"
                      />
                    </Link>
                  ) : (
                    <StoreLogo
                      store={store}
                      storeSlug={storeSlug}
                      size="menu"
                      onClick={() => setMenuOpen(false)}
                    />
                  )}
                  {store.logoUrl && (
                    <p className="font-display text-xl sf-ink leading-tight">{store.name}</p>
                  )}
                  {store.description && (
                    <p className="text-sm sf-muted leading-relaxed line-clamp-3">{store.description}</p>
                  )}
                </div>
              </div>

              <div className="px-4 py-3 border-b sf-border shrink-0">
                <HeaderSearch storeSlug={storeSlug} variant="expanded" />
              </div>

              <nav className="flex-1 overflow-y-auto px-4 py-2" aria-label="Mobile store navigation">
                <ul>
                  {mobileNavItems.map((item, i) => (
                    <motion.li
                      key={item.href}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 + i * 0.04, duration: 0.3 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          'flex items-center min-h-[48px] text-base font-medium sf-ink border-b sf-border transition-colors active:bg-[color-mix(in_srgb,var(--sf-secondary)_30%,#fff)]',
                          pathname === item.href && 'text-[var(--sf-primary)]'
                        )}
                      >
                        {item.label}
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </nav>

              {(store.contactLinks.length > 0 || store.contactEmail || store.contactPhone) && (
                <div className="shrink-0 border-t sf-border px-6 py-5 space-y-4 bg-[color-mix(in_srgb,var(--sf-surface)_60%,#fff)]">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] sf-muted">{t('sf.nav.connect')}</p>
                  {store.contactLinks.length > 0 && (
                    <SocialContactIcons links={store.contactLinks} className="gap-2" />
                  )}
                  <div className="space-y-2 text-sm">
                    {store.contactEmail && (
                      <a href={`mailto:${store.contactEmail}`} className="block sf-muted hover:sf-ink transition-colors">
                        {store.contactEmail}
                      </a>
                    )}
                    {store.contactPhone && (
                      <a href={`tel:${store.contactPhone}`} className="block sf-muted hover:sf-ink transition-colors">
                        {store.contactPhone}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
