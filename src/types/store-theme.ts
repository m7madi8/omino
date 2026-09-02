export type StoreHeroLayout = 'split' | 'centered' | 'image-focused';
export type StoreHeroImagePosition = 'left' | 'right';
export type StoreHeroImageFit = 'cover' | 'contain';
export type StoreHeroAlignment = 'left' | 'center';

export type StoreHeroCta = {
  label: string;
  href: string;
};

export type StoreHeroConfig = {
  enabled: boolean;
  layout: StoreHeroLayout;
  eyebrow?: string;
  title?: string;
  description?: string;
  primaryCta?: StoreHeroCta;
  secondaryCta?: StoreHeroCta;
  imageUrl?: string | null;
  mobileImageUrl?: string | null;
  imagePosition?: StoreHeroImagePosition;
  imageFit?: StoreHeroImageFit;
  imageFocalPoint?: string;
  overlay?: boolean;
  alignment?: StoreHeroAlignment;
};

export type StoreThemeSettings = {
  hero?: StoreHeroConfig;
};

export const DEFAULT_HERO_CONFIG: StoreHeroConfig = {
  enabled: false,
  layout: 'split',
  eyebrow: '',
  title: '',
  description: '',
  imagePosition: 'right',
  imageFit: 'cover',
  imageFocalPoint: '50% 50%',
  overlay: false,
  alignment: 'left',
};

export function parseStoreThemeSettings(raw: unknown): StoreThemeSettings {
  if (!raw || typeof raw !== 'object') return {};
  const value = raw as Record<string, unknown>;
  const heroRaw = value.hero;
  if (!heroRaw || typeof heroRaw !== 'object') return {};
  const hero = heroRaw as Record<string, unknown>;
  return {
    hero: {
      enabled: Boolean(hero.enabled),
      layout:
        hero.layout === 'centered' || hero.layout === 'image-focused' || hero.layout === 'split'
          ? hero.layout
          : 'split',
      eyebrow: typeof hero.eyebrow === 'string' ? hero.eyebrow : '',
      title: typeof hero.title === 'string' ? hero.title : '',
      description: typeof hero.description === 'string' ? hero.description : '',
      primaryCta:
        hero.primaryCta &&
        typeof hero.primaryCta === 'object' &&
        typeof (hero.primaryCta as StoreHeroCta).label === 'string' &&
        typeof (hero.primaryCta as StoreHeroCta).href === 'string'
          ? (hero.primaryCta as StoreHeroCta)
          : undefined,
      secondaryCta:
        hero.secondaryCta &&
        typeof hero.secondaryCta === 'object' &&
        typeof (hero.secondaryCta as StoreHeroCta).label === 'string' &&
        typeof (hero.secondaryCta as StoreHeroCta).href === 'string'
          ? (hero.secondaryCta as StoreHeroCta)
          : undefined,
      imageUrl: typeof hero.imageUrl === 'string' ? hero.imageUrl : null,
      mobileImageUrl: typeof hero.mobileImageUrl === 'string' ? hero.mobileImageUrl : null,
      imagePosition: hero.imagePosition === 'left' ? 'left' : 'right',
      imageFit: hero.imageFit === 'contain' ? 'contain' : 'cover',
      imageFocalPoint:
        typeof hero.imageFocalPoint === 'string' ? hero.imageFocalPoint : '50% 50%',
      overlay: Boolean(hero.overlay),
      alignment: hero.alignment === 'center' ? 'center' : 'left',
    },
  };
}

export function getStoreHeroConfig(themeSettings: unknown): StoreHeroConfig {
  const parsed = parseStoreThemeSettings(themeSettings);
  return { ...DEFAULT_HERO_CONFIG, ...parsed.hero };
}
