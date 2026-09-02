'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { useStorefrontLocale } from '@/components/providers/storefront-locale-provider';
import type { StoreAnnouncementConfig } from '@/types/store-experience';

export function AnnouncementBar({
  storeSlug,
  config,
}: {
  storeSlug: string;
  config: StoreAnnouncementConfig;
}) {
  const { t } = useStorefrontLocale();
  const storageKey = `omino-announcement-${storeSlug}`;
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (config.dismissible && typeof window !== 'undefined') {
      setDismissed(window.localStorage.getItem(storageKey) === '1');
    }
  }, [config.dismissible, storageKey]);

  if (!config.enabled || !config.message.trim() || dismissed) return null;

  const style = {
    backgroundColor: config.backgroundColor || 'var(--sf-primary)',
    color: config.textColor || 'color-mix(in srgb, #ffffff 92%, var(--sf-primary) 8%)',
  };

  return (
    <div
      className="relative text-center text-sm px-4 py-2.5 min-h-[44px] flex items-center justify-center gap-3"
      style={style}
      role="region"
      aria-label={t('sf.announcement.dismiss')}
    >
      <p className="flex-1 min-w-0">
        <span>{config.message}</span>
        {config.link && (
          <>
            {' '}
            <Link
              href={config.link}
              className="underline underline-offset-2 font-medium hover:opacity-90"
            >
              {config.linkLabel || t('sf.learnMore')}
            </Link>
          </>
        )}
      </p>
      {config.dismissible && (
        <button
          type="button"
          className="shrink-0 p-1 rounded-sm opacity-80 hover:opacity-100 min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
          onClick={() => {
            setDismissed(true);
            window.localStorage.setItem(storageKey, '1');
          }}
          aria-label={t('sf.announcement.dismiss')}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
