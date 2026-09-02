'use client';

import { Facebook, Instagram, Mail, MessageCircle, Phone } from 'lucide-react';
import type { ResolvedContactLink } from '@/types/store-contact';
import { cn } from '@/lib/utils';

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.75a8.18 8.18 0 0 0 4.77 1.52V6.82a4.85 4.85 0 0 1-1-.13z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  tiktok: TikTokIcon,
  twitter: XIcon,
  whatsapp: MessageCircle,
  phone: Phone,
  email: Mail,
};

export function SocialContactIcons({
  links,
  size = 'md',
  className,
}: {
  links: ResolvedContactLink[];
  size?: 'sm' | 'md';
  className?: string;
}) {
  if (!links.length) return null;

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-[18px] h-[18px]';
  const btnSize = size === 'sm' ? 'min-w-[40px] min-h-[40px]' : 'min-w-[44px] min-h-[44px]';

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {links.map((link) => {
        const Icon = ICONS[link.id];
        if (!Icon) return null;
        return (
          <a
            key={link.id}
            href={link.href}
            target={link.href.startsWith('http') ? '_blank' : undefined}
            rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
            aria-label={link.label}
            className={cn(
              'inline-flex items-center justify-center sf-muted hover:sf-ink transition-colors rounded-sm',
              btnSize
            )}
          >
            <Icon className={iconSize} />
          </a>
        );
      })}
    </div>
  );
}
