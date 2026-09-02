'use client';

import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import type { StoreExperienceConfig } from '@/types/store-experience';
import { experienceToCssVars } from '@/lib/storefront/store-experience-engine';
import { resolveThemeId } from '@/lib/themes/tokens';
import { AnnouncementBar } from '@/components/storefront/announcement-bar';
import { StoreHero } from '@/components/storefront/store-hero';
import { cn } from '@/lib/utils';

type Device = 'desktop' | 'tablet' | 'mobile';

const DEVICE_WIDTH: Record<Device, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '390px',
};

export function StorePreviewPanel({
  experience,
  storeName,
  publicSlug,
  primaryColor,
  secondaryColor,
}: {
  experience: StoreExperienceConfig;
  storeName: string;
  publicSlug: string;
  primaryColor: string | null;
  secondaryColor: string | null;
}) {
  const [device, setDevice] = useState<Device>('desktop');
  const cssVars = useMemo(
    () => experienceToCssVars(experience, primaryColor, secondaryColor),
    [experience, primaryColor, secondaryColor]
  );

  const themeId = resolveThemeId(experience);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-mono uppercase tracking-[0.15em] text-stone">Preview</p>
        <div className="flex gap-1 rounded-sm border border-hairline p-1 bg-paper">
          {(['desktop', 'tablet', 'mobile'] as Device[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDevice(d)}
              className={cn(
                'px-3 py-1.5 text-xs rounded-sm capitalize transition',
                device === d ? 'bg-ink text-paper' : 'text-stone-2 hover:text-ink'
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-hairline bg-stone/5 p-4 overflow-x-auto">
        <div
          className="mx-auto transition-all duration-300 border border-hairline bg-paper overflow-hidden rounded-sm shadow-soft"
          style={{ width: DEVICE_WIDTH[device], maxWidth: '100%' }}
        >
          <div data-storefront data-theme={themeId} style={cssVars as CSSProperties} className="min-h-[320px]">
            <AnnouncementBar storeSlug={publicSlug} config={experience.announcement} />
            {experience.hero.enabled ? (
              <StoreHero
                hero={experience.hero}
                storeSlug={publicSlug}
                storeName={storeName}
                preview
                priority={false}
              />
            ) : (
              <div className="text-center py-12 px-4">
                <h2 className="font-display text-2xl">{storeName}</h2>
                <p className="text-sm text-stone-2 mt-2">Hero disabled</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
