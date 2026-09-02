export type MerchantLocale = 'ar' | 'en';
export type MerchantExperienceMode = 'simple' | 'standard';

export type MerchantDefaults = {
  locale: MerchantLocale;
  merchantExperienceMode: MerchantExperienceMode;
  currency: string;
  timezone: string;
  codFirst: boolean;
};

export function resolveMerchantDefaults(country: string): MerchantDefaults {
  if (country === 'PS') {
    return {
      locale: 'ar',
      merchantExperienceMode: 'simple',
      currency: 'ILS',
      timezone: 'Asia/Hebron',
      codFirst: true,
    };
  }
  return {
    locale: 'en',
    merchantExperienceMode: 'standard',
    currency: 'USD',
    timezone: 'UTC',
    codFirst: false,
  };
}

export function isSimpleMode(mode: string | null | undefined): boolean {
  return mode === 'simple';
}

export function formatLocaleForIntl(locale: MerchantLocale): string {
  return locale === 'ar' ? 'ar-PS' : 'en';
}
