import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { CSSProperties } from 'react';
import {
  listStorefrontCategories,
  resolveStoreByPublicSlug,
  toStorefrontStore,
} from '@/server/services/storefront-service';
import {
  experienceToCssVars,
  getDraftExperience,
} from '@/lib/storefront/store-experience-engine';
import { getStorefrontPreviewSession } from '@/lib/storefront/preview-session';
import { resolveThemeId } from '@/lib/themes/tokens';
import type { StoreThemeId } from '@/lib/themes/types';
import { getTheme } from '@/lib/themes/registry';
import { STORE_THEME_IDS } from '@/lib/themes/types';
import { StorefrontShell } from '@/components/storefront/storefront-shell';

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

  const themeId = resolveThemeId(experience);
  const storefrontStore = { ...store, experience, hero: experience.hero };

  if (store.status === 'MAINTENANCE') {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-display">{store.name}</h1>
          <p className="mt-3 text-stone-2">We&apos;re performing maintenance. Please check back soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-storefront
      data-theme={themeId}
      data-preview={preview ? 'true' : undefined}
      className="min-h-screen flex flex-col"
      style={
        {
          ...experienceToCssVars(experience, storefrontStore.primaryColor, storefrontStore.secondaryColor),
        } as CSSProperties
      }
    >
      {preview && (
        <div className="bg-ink text-paper text-center text-xs py-2 px-4 font-mono tracking-wide">
          Theme preview — changes are not live until you publish
        </div>
      )}
      <StorefrontShell store={storefrontStore} storeSlug={storeSlug} categories={categories}>
        {children}
      </StorefrontShell>
    </div>
  );
}
