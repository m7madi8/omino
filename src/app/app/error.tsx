'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useMerchant } from '@/components/providers/merchant-provider';

export default function AppSectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t, isSimple } = useMerchant();

  useEffect(() => {
    console.error('[app-section-error]', error);
  }, [error]);

  return (
    <div className="max-w-md mx-auto py-16 text-center space-y-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-stone">{t('error.label')}</p>
      <h1 className="text-2xl font-display">{t('error.section')}</h1>
      <p className="text-stone-2 text-sm leading-relaxed">
        {process.env.NODE_ENV === 'development' ? error.message : t('error.unexpected')}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>{t('common.retry')}</Button>
        <Link href={isSimple ? '/app/today' : '/app'}>
          <Button variant="ghost">
            {isSimple ? t('error.backToday') : t('error.backOverview')}
          </Button>
        </Link>
      </div>
    </div>
  );
}
