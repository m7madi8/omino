import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  BarChart3,
  Bot,
  CreditCard,
  Megaphone,
  Package,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Store,
  Users,
  Warehouse,
  Workflow,
} from 'lucide-react';
import { auth } from '@/lib/auth';
import { PageHeader } from '@/components/app/dashboard/page-header';
import { Card } from '@/components/ui/card';
import { sessionHasPermission } from '@/lib/permissions/check';
import { MODULE_NAV } from '@/lib/permissions/constants';
import { prisma } from '@/lib/db';
import { t } from '@/lib/i18n';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pos: ShoppingCart,
  store: Store,
  products: Package,
  inventory: Warehouse,
  customers: Users,
  payments: CreditCard,
  analytics: BarChart3,
  ai: Bot,
  automations: Workflow,
  marketing: Megaphone,
  team: Users,
  settings: Settings,
  collections: Package,
};

export default async function AdvancedHubPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect('/login');

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { locale: true },
  });
  const locale = org?.locale === 'ar' ? 'ar' : 'en';

  const items = MODULE_NAV.filter(
    (item) =>
      !['overview', 'orders'].includes(item.slug) &&
      (!item.permission || sessionHasPermission(session.user, item.permission))
  );

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        eyebrow={t('nav.advanced', locale)}
        title={t('advanced.title', locale)}
        description={t('advanced.description', locale)}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = ICONS[item.slug] ?? Package;
          return (
            <Link key={item.slug} href={item.href} prefetch={false}>
              <Card className="p-4 hover:border-accent/40 transition-colors touch-manipulation min-h-[72px] flex items-center gap-3">
                <span className="flex items-center justify-center w-10 h-10 rounded-md bg-paper-2 text-accent shrink-0">
                  <Icon className="w-5 h-5" />
                </span>
                <span className="font-medium">{item.label}</span>
              </Card>
            </Link>
          );
        })}
        <Link href="/app/delivery-zones" prefetch={false}>
          <Card className="p-4 hover:border-accent/40 transition-colors touch-manipulation min-h-[72px] flex items-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 rounded-md bg-paper-2 text-accent shrink-0">
              <Package className="w-5 h-5" />
            </span>
            <span className="font-medium">{t('delivery.zones', locale)}</span>
          </Card>
        </Link>
      </div>
    </div>
  );
}
