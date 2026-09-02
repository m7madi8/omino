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
import { useState } from 'react';
import { MODULE_NAV } from '@/lib/permissions/constants';
import { sessionHasPermission } from '@/lib/permissions/check';
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

  const navItems = MODULE_NAV.filter(
    (item) => !item.permission || sessionHasPermission(user, item.permission)
  );

  async function handleSignOut() {
    await signOut({ callbackUrl: '/main' });
  }

  return (
    <div className="min-h-svh bg-paper flex">
      {sidebarOpen && (
        <button
          className="fixed inset-0 bg-ink/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        />
      )}

      <aside
        className={cn(
          'fixed lg:sticky top-0 z-50 h-svh w-64 bg-ink text-paper flex flex-col transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-5 border-b border-hairline-dark">
          <Link href="/app" className="inline-flex items-center" aria-label="OMINO">
            <img
              src="/main/img/omino-lockup-paper.png"
              alt="OMINO"
              width={683}
              height={235}
              className="h-6 w-auto"
            />
          </Link>
          <button className="lg:hidden p-1" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5 scrollbar-thin">
          {navItems.map((item) => {
            const Icon = ICONS[item.slug] || LayoutDashboard;
            const active =
              item.href === '/app'
                ? pathname === '/app'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.slug}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors',
                  active
                    ? 'bg-paper/10 text-paper'
                    : 'text-stone hover:bg-paper/5 hover:text-paper'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
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
            className="lg:hidden p-2 -ml-2 rounded-sm hover:bg-paper-2"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <ContextSwitcher user={user} />

            {sessionHasPermission(user, 'ai.use') && (
              <Link
                href={`/app/ai${pathname !== '/app/ai' ? `?from=${encodeURIComponent(pathname)}` : ''}`}
                className="p-2 rounded-sm hover:bg-paper-2 text-stone-2"
                title="OMINO AI"
              >
                <Bot className="w-5 h-5" />
              </Link>
            )}

            <button
              className="p-2 rounded-sm hover:bg-paper-2 text-stone-2 relative hidden"
              disabled
              aria-hidden
              title="Notifications (coming soon)"
            >
              <Bell className="w-5 h-5" />
            </button>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-sm hover:bg-paper-2"
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
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-hairline rounded-sm shadow-lift z-50 py-1">
                    <div className="px-3 py-2 border-b border-hairline text-xs text-stone-2">
                      {user.roleSlug}
                    </div>
                    <Link
                      href="/app/settings"
                      className="block px-3 py-2 text-sm hover:bg-paper-2"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-paper-2 flex items-center gap-2 text-danger"
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
