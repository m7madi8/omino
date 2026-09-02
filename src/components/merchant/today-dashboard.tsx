'use client';

import Link from 'next/link';
import { formatMoney } from '@/lib/money';
import { formatArabicDate, getGreetingKey } from '@/lib/i18n';
import { useMerchant } from '@/components/providers/merchant-provider';
import { formatLocaleForIntl } from '@/lib/merchant/palestine-mode';
import type { BusinessInsight } from '@/server/services/business-insights-service';
import type { TodayDashboardData } from '@/server/services/analytics/today-dashboard-service';
import { Card } from '@/components/ui/card';

export function TodayDashboard({
  data,
  insights,
}: {
  data: TodayDashboardData;
  insights: BusinessInsight[];
}) {
  const { t, locale, dir } = useMerchant();
  const hour = new Date().getHours();
  const greeting = t(getGreetingKey(hour));
  const dateLabel = formatArabicDate(new Date(), locale);
  const moneyLocale = formatLocaleForIntl(locale);

  return (
    <div className="max-w-lg mx-auto lg:max-w-2xl space-y-5" dir={dir}>
      <header className="space-y-1">
        <p className="text-sm text-stone-2">{greeting} 👋</p>
        <h1 className="text-2xl sm:text-3xl font-display">{t('nav.today')}</h1>
        <p className="text-sm text-stone-2">{dateLabel}</p>
      </header>

      <Card className="p-5 sm:p-6 text-center space-y-2">
        <p className="text-4xl sm:text-5xl font-display font-semibold tracking-tight">
          {formatMoney(data.revenueMinor, data.currency, moneyLocale)}
        </p>
        <p className="text-sm text-stone-2">{t('today.salesToday')}</p>
        <div className="flex justify-center gap-6 pt-2 text-sm">
          <div>
            <p className="font-medium">{formatMoney(data.posRevenueMinor, data.currency, moneyLocale)}</p>
            <p className="text-stone-2">{t('today.inStore')}</p>
          </div>
          <div>
            <p className="font-medium">{formatMoney(data.onlineRevenueMinor + data.manualRevenueMinor, data.currency, moneyLocale)}</p>
            <p className="text-stone-2">{t('today.online')}</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        {data.lowStockCount > 0 && (
          <StatChip
            label={`${data.lowStockCount} ${t('today.lowStock')}`}
            href="/app/inventory"
          />
        )}
        {data.inDeliveryCount > 0 && (
          <StatChip
            label={`${data.inDeliveryCount} ${t('today.inDelivery')}`}
            href="/app/orders"
          />
        )}
        {data.codPendingCount > 0 && (
          <StatChip
            label={`${formatMoney(data.codPendingMinor, data.currency, moneyLocale)} ${t('today.codPending')}`}
            href="/app/orders?cod=pending"
          />
        )}
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-lg">{t('today.needsAttention')}</h2>
        {insights.length === 0 ? (
          <Card className="p-4 text-sm text-stone-2">{t('today.noAlerts')}</Card>
        ) : (
          insights.map((insight) => (
            <Card key={insight.id} className="p-4 space-y-2">
              <p className="font-medium">{insight.title}</p>
              <p className="text-sm text-stone-2">{insight.description}</p>
              <Link
                href={insight.href}
                className="inline-flex items-center justify-center h-9 px-3 text-sm rounded-sm bg-paper-2 text-ink hover:bg-hairline"
              >
                  {insight.kind === 'LOW_STOCK'
                    ? t('today.viewProduct')
                    : insight.kind === 'COD_PENDING'
                      ? t('today.reviewOrders')
                      : t('today.viewCustomer')}
              </Link>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}

function StatChip({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} prefetch={false}>
      <Card className="p-3 text-sm hover:border-accent/30 transition-colors touch-manipulation min-h-[56px] flex items-center">
        {label}
      </Card>
    </Link>
  );
}
