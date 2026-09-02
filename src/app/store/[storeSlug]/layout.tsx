import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { CSSProperties } from 'react';
import {
  listStorefrontCategories,
  resolveStoreByPublicSlug,
  toStorefrontStore,
} from '@/server/services/storefront-service';
import {
  getDraftExperience,
} from '@/lib/storefront/store-experience-engine';
import { getStorefrontPreviewSession } from '@/lib/storefront/preview-session';
import { resolveDesignExperience } from '@/lib/design/resolve-design-experience';
import { getTheme } from '@/lib/themes/registry';
import { STORE_THEME_IDS } from '@/lib/themes/types';
import type { StoreThemeId } from '@/lib/themes/types';
import { StorefrontShell } from '@/components/storefront/storefront-shell';
import { t, getDir } from '@/lib/i18n';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}): Promise<Metadata> {
  try {
    const { storeSlug } = await params;
    const raw = await resolveStoreByPublicSlug(storeSlug);
    const store = toStorefrontStore(raw);
    const seo = store.experience.seo;
    const title = seo.title?.trim() || `${store.name} | OMINO Store`;
    const description = seo.description?.trim() || store.description || `Shop at ${store.name}`;
    const robots = seo.indexable === false ? { index: false, follow: false } : undefined;

    return {
      title,
      description,
      robots,
      openGraph: {
        title,
        description,
        images: seo.ogImageUrl ? [{ url: seo.ogImageUrl }] : undefined,
      },
      icons: store.faviconUrl ? { icon: store.faviconUrl } : undefined,
    };
  } catch {
    return { title: 'Store not found' };
  }
}

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;

  let raw;
  let store;
  let categories;
  try {
    raw = await resolveStoreByPublicSlug(storeSlug);
    store = toStorefrontStore(raw);
    categories = await listStorefrontCategories(raw.id, raw.organizationId);
  } catch {
    notFound();
  }

  const preview = await getStorefrontPreviewSession(storeSlug);
  const experience =
    preview?.mode === 'draft'
      ? { ...store.experience, ...getDraftExperience(raw.themeSettings) }
      : store.experience;

  if (preview?.themeId && STORE_THEME_IDS.includes(preview.themeId)) {
    experience.appearance = {
      ...experience.appearance,
      themeId: preview.themeId as StoreThemeId,
      themeVersion: getTheme(preview.themeId).version,
    };
  }

  const storefrontStore = { ...store, experience, hero: experience.hero };

  const resolved = resolveDesignExperience(
    experience,
    storefrontStore.primaryColor,
    storefrontStore.secondaryColor
  );

  if (store.status === 'MAINTENANCE') {
    const locale = store.locale === 'ar' ? 'ar' : 'en';
    return (
      <div
        className={`min-h-screen bg-paper flex items-center justify-center p-6 ${locale === 'ar' ? 'font-ar' : 'font-body'}`}
        lang={locale}
        dir={getDir(locale)}
      >
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-display">{store.name}</h1>
          <p className="mt-3 text-stone-2">{t('sf.maintenance', locale)}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      lang={store.locale}
      dir={getDir(store.locale)}
      data-storefront
      data-theme={resolved.dataAttributes.theme}
      data-style={resolved.dataAttributes.style}
      data-layout={resolved.dataAttributes.layout}
      data-preview={preview ? 'true' : undefined}
      className="min-h-screen flex flex-col"
      style={resolved.cssVars as CSSProperties}
    >
      {preview && (
        <div className="bg-ink text-paper text-center text-xs py-2 px-4 font-mono tracking-wide">
          {t('sf.preview.banner', store.locale)}
        </div>
      )}
      <StorefrontShell store={storefrontStore} storeSlug={storeSlug} categories={categories}>
        {children}
      </StorefrontShell>
    </div>
  );
}
