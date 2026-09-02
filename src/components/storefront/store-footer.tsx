'use client';

import Link from 'next/link';
import type { StorefrontCategory, StorefrontStore } from '@/types/storefront';
import { SocialContactIcons } from '@/components/storefront/social-contact-icons';

export function StoreFooter({
  store,
  storeSlug,
  categories,
}: {
  store: StorefrontStore;
  storeSlug: string;
  categories: StorefrontCategory[];
}) {
  const year = new Date().getFullYear();
  const topCategories = categories.slice(0, 6);

  return (
    <footer className="mt-auto border-t sf-border bg-[color-mix(in_srgb,var(--sf-surface)_88%,var(--sf-bg))]">
      <div className="max-w-6xl mx-auto px-4 py-12 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4 lg:col-span-1">
            <Link href={`/store/${storeSlug}`} className="inline-flex items-center gap-3 min-h-[44px]">
              {store.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={store.logoUrl} alt="" className="h-8 w-8 object-cover" />
              ) : (
                <div
                  className="h-8 w-8 flex items-center justify-center text-white text-sm font-display"
                  style={{ backgroundColor: 'var(--sf-primary)' }}
                >
                  {store.name.charAt(0)}
                </div>
              )}
              <span className="font-display text-lg sf-ink">{store.name}</span>
            </Link>
            {store.description && (
              <p className="text-sm sf-muted leading-relaxed max-w-xs">{store.description}</p>
            )}
            <SocialContactIcons links={store.contactLinks} />
          </div>

          <div>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] sf-muted mb-4">Shop</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={`/store/${storeSlug}/products`} className="sf-muted hover:sf-ink transition min-h-[44px] inline-flex items-center">
                  All products
                </Link>
              </li>
              {topCategories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/store/${storeSlug}/products?category=${encodeURIComponent(cat.slug)}`}
                    className="sf-muted hover:sf-ink transition min-h-[44px] inline-flex items-center capitalize"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] sf-muted mb-4">Help</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={`/store/${storeSlug}/cart`} className="sf-muted hover:sf-ink transition min-h-[44px] inline-flex items-center">
                  Cart
                </Link>
              </li>
              <li>
                <Link href={`/store/${storeSlug}/checkout`} className="sf-muted hover:sf-ink transition min-h-[44px] inline-flex items-center">
                  Checkout
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] sf-muted mb-4">Policies</h3>
            <ul className="space-y-2 text-sm">
              {(['shipping', 'returns', 'privacy', 'terms'] as const).map((policy) => {
                const hasPolicy = Boolean(store.experience.policies[policy]?.trim());
                if (!hasPolicy) return null;
                const labels = {
                  shipping: 'Shipping',
                  returns: 'Returns',
                  privacy: 'Privacy',
                  terms: 'Terms',
                };
                return (
                  <li key={policy}>
                    <Link
                      href={`/store/${storeSlug}/policies/${policy}`}
                      className="sf-muted hover:sf-ink transition min-h-[44px] inline-flex items-center"
                    >
                      {labels[policy]}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t sf-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sf-muted">
          <p>© {year} {store.name}</p>
          <div className="flex items-center gap-2">
            <span>Powered by</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/main/img/omino-lockup-ink.png"
              alt="OMINO"
              className="h-[16px] w-auto opacity-70"
              width={48}
              height={16}
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
