'use client';

import { createContext, useContext, useEffect, useMemo } from 'react';
import type { MerchantExperienceMode, MerchantLocale } from '@/lib/merchant/palestine-mode';
import { getDir, t, type MessageKey } from '@/lib/i18n';
import { isSimpleMode } from '@/lib/merchant/palestine-mode';

type MerchantContextValue = {
  locale: MerchantLocale;
  experienceMode: MerchantExperienceMode;
  isSimple: boolean;
  dir: 'rtl' | 'ltr';
  t: (key: MessageKey) => string;
};

const MerchantContext = createContext<MerchantContextValue>({
  locale: 'en',
  experienceMode: 'standard',
  isSimple: false,
  dir: 'ltr',
  t: (key) => t(key, 'en'),
});

export function MerchantProvider({
  locale,
  experienceMode,
  children,
}: {
  locale: MerchantLocale;
  experienceMode: MerchantExperienceMode;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({
      locale,
      experienceMode,
      isSimple: isSimpleMode(experienceMode),
      dir: getDir(locale),
      t: (key: MessageKey) => t(key, locale),
    }),
    [locale, experienceMode]
  );

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = value.dir;
  }, [locale, value.dir]);

  return <MerchantContext.Provider value={value}>{children}</MerchantContext.Provider>;
}

export function useMerchant() {
  return useContext(MerchantContext);
}
