'use client';

import { cn } from '@/lib/utils';
import type { MerchantLocale } from '@/lib/merchant/palestine-mode';
import { useMerchant } from '@/components/providers/merchant-provider';
import { t } from '@/lib/i18n';

type LanguageSwitcherProps = {
  value: MerchantLocale;
  onChange: (locale: MerchantLocale) => void;
  className?: string;
  compact?: boolean;
};

export function LanguageSwitcher({ value, onChange, className, compact }: LanguageSwitcherProps) {
  const options: { id: MerchantLocale; label: string }[] = [
    { id: 'ar', label: t('lang.ar', value) },
    { id: 'en', label: t('lang.en', value) },
  ];

  return (
    <div
      className={cn('inline-flex rounded-sm border border-hairline p-0.5 bg-paper', className)}
      role="group"
      aria-label={t('lang.switch', value)}
    >
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cn(
            'min-h-[44px] px-3 text-sm font-medium rounded-sm transition-colors',
            compact && 'min-h-[36px] px-2.5 text-xs',
            value === opt.id ? 'bg-ink text-paper' : 'text-stone-2 hover:text-ink hover:bg-white'
          )}
          aria-pressed={value === opt.id}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/** Settings-integrated switcher using merchant context */
export function MerchantLanguageSwitcher({
  value,
  onChange,
  className,
}: {
  value: MerchantLocale;
  onChange: (locale: MerchantLocale) => void;
  className?: string;
}) {
  const { t: mt } = useMerchant();
  return (
    <div className={className}>
      <p className="text-sm font-medium mb-2">{mt('settings.language')}</p>
      <LanguageSwitcher value={value} onChange={onChange} />
    </div>
  );
}
