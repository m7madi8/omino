'use client';

import { createContext, useContext, useEffect, useMemo } from 'react';
import type { MerchantLocale } from '@/lib/merchant/palestine-mode';
import { formatLocaleForIntl } from '@/lib/merchant/palestine-mode';
import { getDir, t, type MessageKey, type TranslateParams } from '@/lib/i18n';

type StorefrontLocaleContextValue = {
  locale: MerchantLocale;
  dir: 'rtl' | 'ltr';
  intlLocale: string;
  t: (key: MessageKey, params?: TranslateParams) => string;
};

const StorefrontLocaleContext = createContext<StorefrontLocaleContextValue>({
  locale: 'en',
  dir: 'ltr',
  intlLocale: 'en',
  t: (key) => t(key, 'en'),
});

export function StorefrontLocaleProvider({
  locale,
  children,
}: {
  locale: MerchantLocale;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({
      locale,
      dir: getDir(locale),
      intlLocale: formatLocaleForIntl(locale),
      t: (key: MessageKey, params?: TranslateParams) => t(key, locale, params),
    }),
    [locale]
  );

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = value.dir;
  }, [locale, value.dir]);

  return (
    <StorefrontLocaleContext.Provider value={value}>
      <div className={locale === 'ar' ? 'font-ar' : 'font-body'}>{children}</div>
    </StorefrontLocaleContext.Provider>
  );
}

export function useStorefrontLocale() {
  return useContext(StorefrontLocaleContext);
}
