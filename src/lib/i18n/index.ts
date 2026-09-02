import type { MerchantLocale } from '@/lib/merchant/palestine-mode';
import en, { type MessageKey } from '@/lib/i18n/messages/en';
import ar from '@/lib/i18n/messages/ar';

const messages: Record<MerchantLocale, Record<MessageKey, string>> = { en, ar };

export type { MessageKey };

export function t(key: MessageKey, locale: MerchantLocale = 'en'): string {
  return messages[locale]?.[key] ?? messages.en[key] ?? key;
}

export function getDir(locale: MerchantLocale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export function getGreetingKey(hour: number): MessageKey {
  if (hour < 12) return 'today.greeting';
  if (hour < 17) return 'today.greetingAfternoon';
  return 'today.greetingEvening';
}

export function formatArabicDate(date: Date, locale: MerchantLocale): string {
  const intlLocale = locale === 'ar' ? 'ar-PS' : 'en-US';
  return new Intl.DateTimeFormat(intlLocale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}
