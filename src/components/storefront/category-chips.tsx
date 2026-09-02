'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { StorefrontCategory } from '@/types/storefront';

type ChipItem = { href: string; label: string; slug: string | null };

function buildChipItems(categories: StorefrontCategory[], storeSlug: string, mode: 'nav' | 'filter') {
  const shopAll = `/store/${storeSlug}/products`;
  const withProducts = categories.filter((c) => c.productCount > 0);

  if (mode === 'filter') {
    return [
      { href: shopAll, label: 'All', slug: null },
      ...withProducts.map((c) => ({
        href: `${shopAll}?category=${encodeURIComponent(c.slug)}`,
        label: c.name,
        slug: c.slug,
      })),
    ];
  }

  return [
    { href: shopAll, label: 'All', slug: null },
    ...withProducts.map((c) => ({
      href: `/store/${storeSlug}/categories/${c.slug}`,
      label: c.name,
      slug: c.slug,
    })),
  ];
}

function ChipButton({
  active,
  label,
  onClick,
  href,
  mode,
}: {
  active: boolean;
  label: string;
  onClick?: () => void;
  href?: string;
  mode: 'nav' | 'filter';
}) {
  const className = cn(
    'relative shrink-0 min-h-[44px] px-4 inline-flex items-center text-sm font-medium rounded-full transition-colors z-[1]',
    active ? 'sf-ink' : 'sf-muted hover:sf-ink'
  );

  const content = (
    <>
      {active && (
        <motion.span
          layoutId="sf-category-pill"
          className="absolute inset-0 rounded-full bg-[color-mix(in_srgb,var(--sf-primary)_14%,var(--sf-surface))] border sf-border"
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        />
      )}
      <span className="relative z-[1]">{label}</span>
    </>
  );

  if (mode === 'filter') {
    return (
      <button type="button" onClick={onClick} className={className} aria-pressed={active}>
        {content}
      </button>
    );
  }

  return (
    <Link href={href!} className={className} aria-current={active ? 'page' : undefined}>
      {content}
    </Link>
  );
}

export function CategoryChips({
  categories,
  storeSlug,
  className,
  mode = 'nav',
  preserveParams = ['q'],
}: {
  categories: StorefrontCategory[];
  storeSlug: string;
  className?: string;
  mode?: 'nav' | 'filter';
  preserveParams?: string[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const shopAll = `/store/${storeSlug}/products`;

  const items = buildChipItems(categories, storeSlug, mode);

  const activeSlug =
    mode === 'filter'
      ? searchParams.get('category')
      : pathname.startsWith(`/store/${storeSlug}/categories/`)
        ? pathname.split('/').pop() ?? null
        : null;

  const activeHref =
    mode === 'nav'
      ? (items.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.href ??
        shopAll)
      : activeSlug
        ? items.find((item) => item.slug === activeSlug)?.href ?? shopAll
        : shopAll;

  function selectCategory(item: ChipItem) {
    const params = new URLSearchParams();
    for (const key of preserveParams) {
      const value = searchParams.get(key);
      if (value) params.set(key, value);
    }
    if (item.slug) params.set('category', item.slug);
    const query = params.toString();
    router.push(query ? `${shopAll}?${query}` : shopAll, { scroll: false });
  }

  return (
    <nav
      className={cn('relative flex gap-1 overflow-x-auto pb-1 scrollbar-thin', className)}
      aria-label="Browse categories"
    >
      {items.map((item) => {
        const active = mode === 'filter' ? (item.slug === activeSlug) : item.href === activeHref;
        return (
          <ChipButton
            key={item.slug ?? 'all'}
            active={active}
            label={item.label}
            href={item.href}
            mode={mode}
            onClick={mode === 'filter' ? () => selectCategory(item) : undefined}
          />
        );
      })}
    </nav>
  );
}
