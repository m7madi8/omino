/** Deterministic identifiers for the official OMINO NOVAÉ demo merchant. */
export const NOVAE = {
  DEMO_MARKER: 'DEMO-OMINO-NOVAE',
  ORG_SLUG: 'demo-novae',
  ORG_NAME: 'NOVAÉ',
  STORE_SLUG: 'novae',
  STORE_PUBLIC_SLUG: 'novae',
  USER_EMAIL: 'demo@omino.test',
  PASSWORD: 'OminoDemo2026!',
  BRAND: 'NOVAÉ',
  BRAND_AR: 'نوفاي',
  CURRENCY: 'ILS',
  COUNTRY: 'PS',
  TIMEZONE: 'Asia/Jerusalem',
  LOCALE: 'ar',
} as const;

export type NovaeContext = {
  organizationId: string;
  storeId: string;
  branchId: string;
  userId: string;
  stockLocationId: string;
  registerId: string;
  categoryIds: Record<string, string>;
};
