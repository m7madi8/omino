'use client';

import {
  BarChart3,
  Bot,
  Calendar,
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Store,
  Users,
  Warehouse,
  Workflow,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useMemo, useState } from 'react';
import { AppNavLink } from '@/components/app/app-nav-link';
import { NavigationProgress } from '@/components/app/navigation-progress';
import { MobileBottomNav, pickMobileBottomNavItems } from '@/components/app/mobile-bottom-nav';
import { SimpleMobileNav } from '@/components/app/simple-mobile-nav';
import { MerchantProvider, useMerchant } from '@/components/providers/merchant-provider';
import { MODULE_NAV } from '@/lib/permissions/constants';
import { sessionHasPermission } from '@/lib/permissions/check';
import { sessionIsPlatformAdmin } from '@/lib/platform/admin';
import { ADVANCED_NAV_ENTRY } from '@/lib/merchant/simple-nav';
import type { MessageKey } from '@/lib/i18n/messages/en';
import { cn } from '@/lib/utils';
import type { SessionUser } from '@/types';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  overview: LayoutDashboard,
  today: Calendar,
  pos: ShoppingCart,
  store: Store,
  products: Package,
  inventory: Warehouse,
  orders: ShoppingBag,
  customers: Users,
  payments: CreditCard,
  analytics: BarChart3,
  ai: Bot,
  automations: Workflow,
  marketing: Megaphone,
  team: Users,
  settings: Settings,
  advanced: SlidersHorizontal,
};

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  return (
    <MerchantProvider
      locale={user.locale}
      experienceMode={user.merchantExperienceMode}
    >
      <AppShellInner user={user}>{children}</AppShellInner>
    </MerchantProvider>
  );
}

function AppShellInner({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isSimple, t, dir } = useMerchant();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navItems = useMemo(
    () =>
      MODULE_NAV.filter(
        (item) => !item.permission || sessionHasPermission(user, item.permission)
      ),
    [user]
  );

  const mobileNavItems = useMemo(() => pickMobileBottomNavItems(navItems), [navItems]);

  const simpleSidebarItems = useMemo(
    () => [
      { slug: 'today', label: t('nav.today'), href: '/app/today', permission: undefined },
      { slug: 'orders', label: t('nav.orders'), href: '/app/orders', permission: 'orders.read' as const },
      {
        slug: 'advanced',
        label: t('nav.advanced'),
        href: ADVANCED_NAV_ENTRY.href,
        permission: undefined,
      },
    ].filter((item) => !item.permission || sessionHasPermission(user, item.permission)),
    [user, t]
  );

  const sidebarItems = isSimple ? simpleSidebarItems : navItems;

  async function handleSignOut() {
    await signOut({ callbackUrl: '/main' });
  }

  const isPlatformAdmin = sessionIsPlatformAdmin(user);
  const roleLabel = isPlatformAdmin ? t('nav.platformOwner') : user.roleSlug;

  const canAddProduct = sessionHasPermission(user, 'products.write');
  const canAddOrder = sessionHasPermission(user, 'orders.write');
  const canPos = sessionHasPermission(user, 'pos.sell');

  function navLabel(item: { label: string; labelKey?: string }) {
    return item.labelKey ? t(item.labelKey as MessageKey) : item.label;
  }

  return (
    <div className="min-h-svh bg-paper flex overflow-x-hidden" dir={dir}>
      <NavigationProgress />

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-ink/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label={t('shell.closeMenu')}
        />
      )}

      <aside
        className={cn(
          'fixed lg:sticky top-0 z-50 h-svh w-[min(100vw-3rem,16rem)] sm:w-64 bg-ink text-paper flex flex-col',
          'transition-transform duration-150 ease-out lg:translate-x-0 will-change-transform',
          dir === 'rtl'
            ? sidebarOpen
              ? 'translate-x-0'
              : 'translate-x-full lg:translate-x-0'
            : sidebarOpen
              ? 'translate-x-0'
              : '-translate-x-full lg:translate-x-0'
        )}
        aria-label={t('shell.dashboardNav')}
        dir={dir}
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-hairline-dark shrink-0">
          <Link href={isSimple ? '/app/today' : '/app'} prefetch={false} className="inline-flex items-center" aria-label="OMINO">
            <img
              src="/main/img/omino-lockup-paper.png"
              alt="OMINO"
              width={683}
              height={235}
              className="h-6 w-auto"
            />
          </Link>
          <button
            type="button"
            className="lg:hidden p-2 -mr-1 touch-manipulation active:opacity-70 min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={() => setSidebarOpen(false)}
            aria-label={t('shell.closeMenu')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isPlatformAdmin && (
          <div className="mx-3 mt-3 px-3 py-2 rounded-sm bg-accent/20 border border-accent/30 text-[11px] font-mono uppercase tracking-wider text-accent-soft shrink-0">
            {t('nav.platformOwner')}
          </div>
        )}

        <nav className="flex-1 overflow-y-auto overscroll-contain p-3 space-y-0.5 scrollbar-thin">
          {sidebarItems.map((item) => {
            const Icon = ICONS[item.slug] || LayoutDashboard;
            return (
              <AppNavLink
                key={item.slug}
                href={item.href}
                label={navLabel(item)}
                icon={<Icon className="w-4 h-4" />}
                compact
                onNavigate={() => setSidebarOpen(false)}
              />
            );
          })}
          {isSimple && (
            <div className="pt-4 mt-4 border-t border-hairline-dark/50">
              <p className="px-3 pb-2 text-[10px] uppercase tracking-wider text-stone/60">
                {t('nav.advanced')}
              </p>
              {navItems
                .filter((item) => !['overview', 'orders'].includes(item.slug))
                .map((item) => {
                  const Icon = ICONS[item.slug] || LayoutDashboard;
                  return (
                    <AppNavLink
                      key={item.slug}
                      href={item.href}
                      label={navLabel(item)}
                      icon={<Icon className="w-4 h-4" />}
                      compact
                      onNavigate={() => setSidebarOpen(false)}
                    />
                  );
                })}
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-hairline-dark text-xs text-stone space-y-1 shrink-0">
          <p className="truncate font-medium text-paper/90">{user.organizationName}</p>
          <p className="truncate text-stone/70">
            {[user.storeName, user.branchName].filter(Boolean).join(' · ')}
          </p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 w-full">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-hairline px-3 sm:px-6 h-14 sm:h-16 flex items-center gap-2 sm:gap-4 shrink-0">
          {!isSimple && (
            <button
              type="button"
              className="lg:hidden p-2.5 -ml-1 rounded-sm hover:bg-paper-2 touch-manipulation active:scale-95 transition-transform duration-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
              onClick={() => setSidebarOpen(true)}
              aria-label={t('shell.openMenu')}
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="lg:hidden min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{user.storeName || user.organizationName}</p>
            <p className="text-[11px] text-stone-2 truncate">{user.organizationName}</p>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 ms-auto shrink-0">
            <ContextSwitcher user={user} />

            {sessionHasPermission(user, 'ai.use') && !isSimple && (
              <Link
                href={`/app/ai${pathname !== '/app/ai' ? `?from=${encodeURIComponent(pathname)}` : ''}`}
                prefetch={false}
                className="p-2.5 rounded-sm hover:bg-paper-2 text-stone-2 touch-manipulation active:scale-95 transition-transform duration-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                title={t('shell.ominoAi')}
                aria-label={t('shell.ominoAi')}
              >
                <Bot className="w-5 h-5" />
              </Link>
            )}

            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-sm hover:bg-paper-2 touch-manipulation active:scale-[0.98] transition-transform duration-100 min-h-[44px]"
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
              >
                <div className="w-9 h-9 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-medium">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:block text-sm max-w-[120px] truncate">
                  {user.name || user.email}
                </span>
                <ChevronDown className="hidden md:block w-4 h-4 text-stone" />
              </button>

              {userMenuOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                    aria-label={t('shell.closeUserMenu')}
                  />
                  <div
                    role="menu"
                    className="absolute end-0 top-full mt-1 w-52 max-w-[calc(100vw-1.5rem)] bg-white border border-hairline rounded-sm shadow-lift z-50 py-1"
                  >
                    <div className="px-3 py-2 border-b border-hairline text-xs text-stone-2">
                      {roleLabel}
                    </div>
                    <Link
                      href="/app/settings"
                      prefetch={false}
                      role="menuitem"
                      className="block px-3 py-3 text-sm hover:bg-paper-2 touch-manipulation min-h-[44px]"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      {t('nav.settings')}
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleSignOut}
                      className="w-full text-start px-3 py-3 text-sm hover:bg-paper-2 flex items-center gap-2 text-danger touch-manipulation min-h-[44px]"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('nav.signOut')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main
          className={cn(
            'flex-1 w-full min-w-0 overflow-x-hidden',
            'p-3 sm:p-6 lg:p-8',
            'pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-8'
          )}
        >
          {children}
        </main>

        {isSimple ? (
          <SimpleMobileNav
            canAddProduct={canAddProduct}
            canAddOrder={canAddOrder}
            canPos={canPos}
            onOpenAdvanced={() => setSidebarOpen(true)}
          />
        ) : (
          <MobileBottomNav items={mobileNavItems} onOpenMenu={() => setSidebarOpen(true)} />
        )}
      </div>
    </div>
  );
}

function ContextSwitcher({ user }: { user: SessionUser }) {
  const { t } = useMerchant();
  return (
    <div className="hidden md:flex items-center gap-2 text-xs max-w-[50vw]">
      <span className="px-2.5 py-1.5 rounded-sm bg-paper-2 text-stone-2 border border-hairline truncate max-w-[140px]">
        {user.organizationName}
      </span>
      <span className="px-2.5 py-1.5 rounded-sm bg-paper-2 text-stone-2 border border-hairline truncate max-w-[120px]">
        {user.storeName || t('shell.defaultStore')}
      </span>
    </div>
  );
}
