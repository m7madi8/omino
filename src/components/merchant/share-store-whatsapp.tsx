'use client';

import { Button } from '@/components/ui/button';
import {
  buildStoreShareMessage,
  getStorefrontUrl,
  openWhatsAppShare,
} from '@/lib/merchant/whatsapp';
import { useMerchant } from '@/components/providers/merchant-provider';

export function ShareStoreWhatsAppButton({
  storeName,
  publicSlug,
  whatsappPhone,
}: {
  storeName: string;
  publicSlug: string;
  whatsappPhone?: string | null;
}) {
  const { t, locale } = useMerchant();

  return (
    <Button
      type="button"
      variant="secondary"
      className="min-h-[44px] touch-manipulation"
      onClick={() =>
        openWhatsAppShare(
          whatsappPhone,
          buildStoreShareMessage({
            storeName,
            storeUrl: getStorefrontUrl(publicSlug),
            locale,
          })
        )
      }
    >
      {t('whatsapp.shareStore')}
    </Button>
  );
}
