import type { MerchantLocale } from '@/lib/merchant/palestine-mode';
import en, { type MessageKey } from '@/lib/i18n/messages/en';
import ar from '@/lib/i18n/messages/ar';

const messages: Record<MerchantLocale, Record<MessageKey, string>> = { en, ar };

export type { MessageKey };

export type TranslateParams = Record<string, string | number>;

export function t(
  key: MessageKey,
  locale: MerchantLocale = 'en',
  params?: TranslateParams
): string {
  let text = messages[locale]?.[key] ?? messages.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return text;
}

export function getDir(locale: MerchantLocale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export function getGreetingKey(hour: number): MessageKey {
  if (hour < 12) return 'today.greeting';
  if (hour < 17) return 'today.greetingAfternoon';
  return 'today.greetingEvening';
}

export function formatLocalizedDate(date: Date, locale: MerchantLocale): string {
  const intlLocale = locale === 'ar' ? 'ar-PS' : 'en-US';
  return new Intl.DateTimeFormat(intlLocale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

/** @deprecated use formatLocalizedDate */
export function formatArabicDate(date: Date, locale: MerchantLocale): string {
  return formatLocalizedDate(date, locale);
}

export function formatRelativeDay(date: Date, locale: MerchantLocale): string {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86400000);

  if (diffDays === 0) return t('common.today', locale);
  if (diffDays === 1) return t('common.yesterday', locale);
  if (diffDays > 1 && diffDays < 7) return t('common.daysAgo', locale, { n: diffDays });
  return formatLocalizedDate(date, locale);
}

export function isStorefrontKey(key: string): key is MessageKey {
  return key.startsWith('sf.');
}
