'use client';

import { useMemo } from 'react';
import { DESIGN_PRESETS } from '@/lib/design/presets';
import { listLayouts } from '@/lib/design/layouts/registry';
import { listStyles } from '@/lib/design/styles/registry';
import { THEME_REGISTRY } from '@/lib/themes/registry';
import { STORE_THEME_IDS } from '@/lib/themes/types';
import type { StoreThemeId } from '@/lib/themes/types';
import type { StoreExperienceConfig } from '@/types/store-experience';
import type { StoreStyleId } from '@/lib/design/styles/types';
import type { StoreLayoutId } from '@/lib/design/layouts/registry';
import { cn } from '@/lib/utils';

type DesignStudioProps = {
  draft: StoreExperienceConfig;
  primaryColor: string | null;
  secondaryColor: string | null;
  onChange: (patch: {
    appearance: Partial<StoreExperienceConfig['appearance']>;
    primaryColor?: string | null;
    secondaryColor?: string | null;
  }) => void;
};

function PreviewSwatch({
  selected,
  onClick,
  title,
  description,
  preview,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description?: string;
  preview: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-start p-3 rounded-sm border transition-all duration-200 min-h-[44px]',
        selected ? 'border-ink ring-1 ring-ink/20 bg-paper' : 'border-hairline hover:border-stone bg-white'
      )}
    >
      <div className="mb-2 h-16 rounded-sm overflow-hidden border border-hairline/60">{preview}</div>
      <p className="font-medium text-sm">{title}</p>
      {description && <p className="text-xs text-stone-2 mt-0.5 line-clamp-2">{description}</p>}
    </button>
  );
}

export function DesignStudio({ draft, primaryColor, secondaryColor, onChange }: DesignStudioProps) {
  const appearance = draft.appearance;
  const styleId = appearance.styleId ?? 'modern';
  const layoutId = appearance.layoutId ?? 'grid';
  const themeId = appearance.themeId;

  const previewVars = useMemo(
    () => ({
      background: secondaryColor || '#f4f5f6',
      primary: primaryColor || '#141414',
    }),
    [primaryColor, secondaryColor]
  );

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div>
          <h3 className="font-display text-base">Design presets</h3>
          <p className="text-sm text-stone-2 mt-1">Curated theme + style + layout combinations.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {DESIGN_PRESETS.map((preset) => (
            <PreviewSwatch
              key={preset.id}
              selected={themeId === preset.themeId && styleId === preset.styleId && layoutId === preset.layoutId}
              title={preset.name}
              description={preset.description}
              preview={
                <div
                  className="h-full w-full p-2 flex flex-col justify-end"
                  style={{ background: preset.secondaryColor }}
                >
                  <div className="h-2 w-8 rounded-sm mb-1" style={{ background: preset.primaryColor }} />
                  <div className="h-1.5 w-12 bg-black/10 rounded-sm" />
                </div>
              }
              onClick={() => {
                const legacyPreset =
                  preset.styleId === 'minimal' ||
                  preset.styleId === 'editorial' ||
                  preset.styleId === 'modern' ||
                  preset.styleId === 'luxury' ||
                  preset.styleId === 'bold'
                    ? preset.styleId
                    : undefined;
                onChange({
                  appearance: {
                    themeId: preset.themeId,
                    styleId: preset.styleId,
                    layoutId: preset.layoutId,
                    typography: preset.typography,
                    ...(legacyPreset ? { preset: legacyPreset } : {}),
                  },
                  primaryColor: preset.primaryColor,
                  secondaryColor: preset.secondaryColor,
                });
              }}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-display text-base">Theme</h3>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {STORE_THEME_IDS.map((id: StoreThemeId) => {
            const theme = THEME_REGISTRY[id];
            return (
              <PreviewSwatch
                key={id}
                selected={themeId === id}
                title={theme.name}
                description={theme.description.slice(0, 60)}
                preview={
                  <div
                    className="h-full w-full"
                    style={{ background: theme.previewGradient }}
                  />
                }
                onClick={() =>
                  onChange({
                    appearance: { themeId: id as StoreThemeId, themeVersion: theme.version },
                  })
                }
              />
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-display text-base">Design style</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {listStyles().map((style) => (
            <PreviewSwatch
              key={style.id}
              selected={styleId === style.id}
              title={style.name}
              description={style.description}
              preview={
                <div
                  className="h-full w-full p-2 flex items-end"
                  style={{ background: previewVars.background }}
                >
                  <div
                    className="text-[10px] font-display uppercase tracking-widest"
                    style={{ color: previewVars.primary }}
                  >
                    Aa
                  </div>
                </div>
              }
              onClick={() =>
                onChange({ appearance: { styleId: style.id as StoreStyleId } })
              }
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-display text-base">Layout</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {listLayouts().map((layout) => (
            <PreviewSwatch
              key={layout.id}
              selected={layoutId === layout.id}
              title={layout.name}
              description={layout.description}
              preview={
                <div className="h-full w-full p-2 grid grid-cols-3 gap-1 bg-paper">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'bg-hairline rounded-[2px]',
                        layout.id === 'large-feature' && i === 0 && 'col-span-2 row-span-2',
                        layout.id === 'masonry' && i % 3 === 0 && 'col-span-2'
                      )}
                    />
                  ))}
                </div>
              }
              onClick={() =>
                onChange({ appearance: { layoutId: layout.id as StoreLayoutId } })
              }
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-display text-base">Spacing</h3>
        <div className="flex flex-wrap gap-2">
          {(['compact', 'balanced', 'generous'] as const).map((spacing) => (
            <button
              key={spacing}
              type="button"
              onClick={() => onChange({ appearance: { spacing } })}
              className={cn(
                'px-4 py-2 text-sm rounded-sm border capitalize min-h-[44px]',
                appearance.spacing === spacing || (!appearance.spacing && spacing === 'balanced')
                  ? 'border-ink bg-ink text-paper'
                  : 'border-hairline hover:border-stone'
              )}
            >
              {spacing}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
