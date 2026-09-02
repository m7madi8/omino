import { commonEn } from '@/lib/i18n/messages/domains/common';
import { shellEn } from '@/lib/i18n/messages/domains/shell';
import { productsEn } from '@/lib/i18n/messages/domains/products';
import { ordersEn, posEn } from '@/lib/i18n/messages/domains/orders';
import { storefrontEn } from '@/lib/i18n/messages/domains/storefront';
import {
  settingsEn,
  todayEn,
  authEn,
} from '@/lib/i18n/messages/domains/settings';

const en = {
  ...commonEn,
  ...shellEn,
  ...productsEn,
  ...ordersEn,
  ...posEn,
  ...storefrontEn,
  ...settingsEn,
  ...todayEn,
  ...authEn,
} as const;

export type MessageKey = keyof typeof en;
export default en;
