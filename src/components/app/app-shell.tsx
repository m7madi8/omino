'use client';

import {
  BarChart3,
  Bot,
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
  Store,
  Users,
  Warehouse,
  Workflow,
  X,
  Bell,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useMemo, useState } from 'react';
import { AppNavLink } from '@/components/app/app-nav-link';
import { AppRoutePrefetch } from '@/components/app/app-route-prefetch';
import { NavigationProgress } from '@/components/app/navigation-progress';
import { MODULE_NAV } from '@/lib/permissions/constants';
import { sessionHasPermission } from '@/lib/permissions/check';
import { sessionIsPlatformAdmin } from '@/lib/platform/admin';
import { cn } from '@/lib/utils';
import type { SessionUser } from '@/types';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  overview: LayoutDashboard,
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
};

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navItems = useMemo(
    () => MODULE_NAV.filter((item) => !item.permission || sessionHasPermission(user, item.permission)),
    [user]
  );

  const prefetchHrefs = useMemo(() => navItems.map((item) => item.href), [navItems]);

  async function handleSignOut() {
    await signOut({ callbackUrl: '/main' });
  }

  const isPlatformAdmin = sessionIsPlatformAdmin(user);
  const roleLabel = isPlatformAdmin ? 'OMINO Platform Owner' : user.roleSlug;

  return (
    <div className="min-h-svh bg-paper flex">
      <NavigationProgress />
      <AppRoutePrefetch hrefs={prefetchHrefs} />

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-ink/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        />
      )}

      <aside
        className={cn(
          'fixed lg:sticky top-0 z-50 h-svh w-64 bg-ink text-paper flex flex-col',
          'transition-transform duration-150 ease-out lg:translate-x-0 will-change-transform',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-5 border-b border-hairline-dark">
          <Link href="/app" prefetch className="inline-flex items-center" aria-label="OMINO">
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
            className="lg:hidden p-1 touch-manipulation active:opacity-70"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isPlatformAdmin && (
          <div className="mx-3 mt-3 px-3 py-2 rounded-sm bg-accent/20 border border-accent/30 text-[11px] font-mono uppercase tracking-wider text-accent-soft">
            Platform Owner
          </div>
        )}

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5 scrollbar-thin overscroll-contain">
          {navItems.map((item) => {
            const Icon = ICONS[item.slug] || LayoutDashboard;
            return (
              <AppNavLink
                key={item.slug}
                href={item.href}
                label={item.label}
                icon={<Icon className="w-4 h-4" />}
                onNavigate={() => setSidebarOpen(false)}
              />
            );
          })}
        </nav>

        <div className="p-4 border-t border-hairline-dark text-xs text-stone space-y-1">
          <p className="truncate">{user.organizationName}</p>
          <p className="truncate text-stone/70">{user.storeName}</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-hairline px-4 sm:px-6 h-16 flex items-center gap-4">
          <button
            type="button"
            className="lg:hidden p-2 -ml-2 rounded-sm hover:bg-paper-2 touch-manipulation active:scale-95 transition-transform duration-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <ContextSwitcher user={user} />

            {sessionHasPermission(user, 'ai.use') && (
              <Link
                href={`/app/ai${pathname !== '/app/ai' ? `?from=${encodeURIComponent(pathname)}` : ''}`}
                prefetch
                className="p-2 rounded-sm hover:bg-paper-2 text-stone-2 touch-manipulation active:scale-95 transition-transform duration-100"
                title="OMINO AI"
              >
                <Bot className="w-5 h-5" />
              </Link>
            )}

            <button
              type="button"
              className="p-2 rounded-sm hover:bg-paper-2 text-stone-2 relative hidden"
              disabled
              aria-hidden
              title="Notifications (coming soon)"
            >
              <Bell className="w-5 h-5" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-sm hover:bg-paper-2 touch-manipulation active:scale-[0.98] transition-transform duration-100"
              >
                <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-medium">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:block text-sm max-w-[120px] truncate">
                  {user.name || user.email}
                </span>
                <ChevronDown className="w-4 h-4 text-stone" />
              </button>

              {userMenuOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-hairline rounded-sm shadow-lift z-50 py-1">
                    <div className="px-3 py-2 border-b border-hairline text-xs text-stone-2">
                      {roleLabel}
                    </div>
                    <Link
                      href="/app/settings"
                      prefetch
                      className="block px-3 py-2 text-sm hover:bg-paper-2 touch-manipulation"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-paper-2 flex items-center gap-2 text-danger touch-manipulation"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function ContextSwitcher({ user }: { user: SessionUser }) {
  return (
    <div className="hidden md:flex items-center gap-2 text-xs">
      <span className="px-2.5 py-1.5 rounded-sm bg-paper-2 text-stone-2 border border-hairline truncate max-w-[140px]">
        {user.organizationName}
      </span>
      <span className="px-2.5 py-1.5 rounded-sm bg-paper-2 text-stone-2 border border-hairline truncate max-w-[120px]">
        {user.storeName || 'Store'}
      </span>
      <span className="px-2.5 py-1.5 rounded-sm bg-paper-2 text-stone-2 border border-hairline truncate max-w-[120px]">
        {user.branchName || 'Branch'}
      </span>
    </div>
  );
}
