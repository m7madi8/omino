import type { MerchantLocale } from '@/lib/merchant/palestine-mode';
import { t } from '@/lib/i18n';
import type { MessageKey } from '@/lib/i18n/messages/en';

export type SimpleNavLink = {
  slug: string;
  href: string;
  labelKey: string;
  type: 'link';
};

export type SimpleNavAction = {
  slug: 'add';
  labelKey: string;
  type: 'action';
};

export type SimpleNavItem = SimpleNavLink | SimpleNavAction;

export const SIMPLE_NAV_ITEMS: SimpleNavItem[] = [
  { slug: 'today', href: '/app/today', labelKey: 'nav.today', type: 'link' },
  { slug: 'orders', href: '/app/orders', labelKey: 'nav.orders', type: 'link' },
  { slug: 'add', labelKey: 'nav.add', type: 'action' },
];

export const ADVANCED_NAV_ENTRY = {
  href: '/app/advanced',
  labelKey: 'nav.advanced',
};

export function getSimpleNavLabels(locale: MerchantLocale) {
  return SIMPLE_NAV_ITEMS.map((item) => ({
    ...item,
    label: t(item.labelKey as MessageKey, locale),
  }));
}
