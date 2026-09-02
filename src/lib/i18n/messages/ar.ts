import { commonAr } from '@/lib/i18n/messages/domains/common';
import { shellAr } from '@/lib/i18n/messages/domains/shell';
import { productsAr } from '@/lib/i18n/messages/domains/products';
import { ordersAr, posAr } from '@/lib/i18n/messages/domains/orders';
import { storefrontAr } from '@/lib/i18n/messages/domains/storefront';
import {
  settingsAr,
  todayAr,
  authAr,
} from '@/lib/i18n/messages/domains/settings';
import type { MessageKey } from '@/lib/i18n/messages/en';

const ar: Record<MessageKey, string> = {
  ...commonAr,
  ...shellAr,
  ...productsAr,
  ...ordersAr,
  ...posAr,
  ...storefrontAr,
  ...settingsAr,
  ...todayAr,
  ...authAr,
};

export default ar;
