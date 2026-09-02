'use client';

import Link from 'next/link';
import { formatMoney } from '@/lib/money';
import { formatArabicDate, getGreetingKey } from '@/lib/i18n';
import { useMerchant } from '@/components/providers/merchant-provider';
import { formatLocaleForIntl } from '@/lib/merchant/palestine-mode';
import type { BusinessInsight } from '@/server/services/business-insights-service';
import type { TodayDashboardData } from '@/server/services/analytics/today-dashboard-service';
import { StatStrip } from '@/components/app/dashboard/stat-strip';
import { SectionBlock } from '@/components/app/dashboard/section-block';
import { DataList, DataListRow } from '@/components/app/dashboard/data-list';
import { PageChrome } from '@/components/app/dashboard/page-chrome';
import { ShareStoreWhatsAppButton } from '@/components/merchant/share-store-whatsapp';

export function TodayDashboard({
  data,
  insights,
  storePublicSlug,
  storeName,
}: {
  data: TodayDashboardData;
  insights: BusinessInsight[];
  storePublicSlug?: string | null;
  storeName?: string;
}) {
  const { t, locale, dir } = useMerchant();
  const hour = new Date().getHours();
  const greeting = t(getGreetingKey(hour));
  const dateLabel = formatArabicDate(new Date(), locale);
  const moneyLocale = formatLocaleForIntl(locale);

  const statItems = [
    {
      label: t('today.salesToday'),
      value: formatMoney(data.revenueMinor, data.currency, moneyLocale),
      sublabel: dateLabel,
    },
    {
      label: t('today.inStore'),
      value: formatMoney(data.posRevenueMinor, data.currency, moneyLocale),
      href: '/app/pos',
    },
    {
      label: t('today.online'),
      value: formatMoney(data.onlineRevenueMinor + data.manualRevenueMinor, data.currency, moneyLocale),
      href: '/app/orders',
    },
  ];

  const alertItems = [];
  if (data.lowStockCount > 0) {
    alertItems.push({
      label: `${data.lowStockCount} ${t('today.lowStock')}`,
      href: '/app/inventory',
    });
  }
  if (data.inDeliveryCount > 0) {
    alertItems.push({
      label: `${data.inDeliveryCount} ${t('today.inDelivery')}`,
      href: '/app/orders',
    });
  }
  if (data.codPendingCount > 0) {
    alertItems.push({
      label: `${formatMoney(data.codPendingMinor, data.currency, moneyLocale)} ${t('today.codPending')}`,
      href: '/app/orders?cod=pending',
    });
  }

  return (
    <PageChrome
      width="narrow"
      eyebrow={greeting}
      title={t('nav.today')}
      actions={
        storePublicSlug && storeName ? (
          <ShareStoreWhatsAppButton storeName={storeName} publicSlug={storePublicSlug} />
        ) : undefined
      }
    >
      <div dir={dir} className="space-y-6">
        <StatStrip items={statItems} />

        {alertItems.length > 0 && (
          <StatStrip
            items={alertItems.map((a) => ({
              label: a.label,
              value: '→',
              href: a.href,
            }))}
          />
        )}

        <SectionBlock title={t('today.needsAttention')}>
          <DataList
            empty={
              <p className="p-4 text-sm text-stone-2">{t('today.noAlerts')}</p>
            }
          >
            {insights.map((insight) => (
              <DataListRow
                key={insight.id}
                title={insight.title}
                subtitle={insight.description}
                href={insight.href}
              />
            ))}
          </DataList>
        </SectionBlock>
      </div>
    </PageChrome>
  );
}
