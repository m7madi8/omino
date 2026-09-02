'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { StoreHeroConfig } from '@/types/store-theme';
import { HeroFloatingShapes, StaggeredHeadline } from '@/components/storefront/hero-interactive';
import { useReducedMotion } from '@/lib/storefront/motion';

function HeroImage({
  src,
  alt,
  fit,
  focalPoint,
  priority = false,
  className,
}: {
  src: string;
  alt: string;
  fit: 'cover' | 'contain';
  focalPoint: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      className={cn(
        'w-full h-full object-cover motion-safe:transition-transform motion-safe:duration-[1.2s] motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]',
        fit === 'contain' ? 'object-contain' : 'object-cover',
        className
      )}
      style={{ objectPosition: focalPoint }}
    />
  );
}

function HeroActions({
  hero,
  storeSlug,
  className,
}: {
  hero: StoreHeroConfig;
  storeSlug: string;
  className?: string;
}) {
  const primaryHref = hero.primaryCta?.href || `/store/${storeSlug}/products`;
  const secondaryHref = hero.secondaryCta?.href || `/store/${storeSlug}/products`;

  return (
    <div className={cn('flex flex-wrap items-center gap-3 sm:gap-4', className)}>
      <Link
        href={primaryHref}
        className="sf-btn-primary sf-btn-hero inline-flex items-center justify-center min-h-[48px] px-7 sm:px-8 rounded-sm text-sm font-medium tracking-[0.02em]"
      >
        {hero.primaryCta?.label || 'Shop collection'}
      </Link>
      {hero.secondaryCta?.label && (
        <Link
          href={secondaryHref}
          className="sf-link-hero text-sm min-h-[48px] inline-flex items-center tracking-[0.02em] px-2"
        >
          {hero.secondaryCta.label}
        </Link>
      )}
    </div>
  );
}

function HeroCopy({
  hero,
  storeSlug,
  align,
  animate,
}: {
  hero: StoreHeroConfig;
  storeSlug: string;
  align: 'left' | 'center';
  animate: boolean;
}) {
  const fade = (delayMs: number) =>
    animate
      ? { className: 'motion-safe:sf-fade-in', style: { animationDelay: `${delayMs}ms` } as const }
      : { className: '', style: undefined };

  return (
    <div
      className={cn(
        'space-y-4 sm:space-y-5',
        align === 'center' ? 'text-center mx-auto max-w-2xl' : 'max-w-xl'
      )}
    >
      {hero.eyebrow && (
        <p
          className={cn(
            'font-mono text-[11px] sm:text-xs tracking-[0.2em] uppercase sf-muted',
            fade(0).className
          )}
          style={fade(0).style}
        >
          {hero.eyebrow}
        </p>
      )}
      {hero.title && (
        <StaggeredHeadline
          text={hero.title}
          className="font-display font-medium text-[clamp(2rem,6vw,3.75rem)] leading-[1.05] tracking-[-0.03em]"
        />
      )}
      {hero.description && (
        <p
          className={cn(
            'text-base sm:text-lg leading-relaxed sf-muted max-w-[36ch]',
            align === 'center' && 'mx-auto',
            fade(140).className
          )}
          style={fade(140).style}
        >
          {hero.description}
        </p>
      )}
      <div className={cn(align === 'center' && 'justify-center', fade(210).className)} style={fade(210).style}>
        <HeroActions hero={hero} storeSlug={storeSlug} />
      </div>
    </div>
  );
}

export function StoreHero({
  hero,
  storeSlug,
  storeName,
  priority = true,
  preview = false,
}: {
  hero: StoreHeroConfig;
  storeSlug: string;
  storeName: string;
  priority?: boolean;
  preview?: boolean;
}) {
  const [animate, setAnimate] = useState(false);
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 320], [0, reduced ? 0 : 24]);

  const imageUrl = hero.imageUrl || null;
  const mobileImageUrl = hero.mobileImageUrl || imageUrl;
  const alignment = hero.alignment || 'left';
  const imageFit = hero.imageFit || 'cover';
  const focalPoint = hero.imageFocalPoint || '50% 50%';
  const imagePosition = hero.imagePosition || 'right';
  const hasImage = Boolean(imageUrl);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) setAnimate(true);
  }, []);

  if (!hero.enabled) return null;

  const isCentered = hero.layout === 'centered';
  const isImageFocused = hero.layout === 'image-focused';
  const imageFirst = imagePosition === 'left';

  return (
    <section
      className={cn(
        'sf-hero relative w-full border-b sf-border overflow-hidden',
        preview && 'rounded-md border mx-4'
      )}
    >
      <div className="absolute inset-0 bg-[var(--sf-gradient-hero)] pointer-events-none" aria-hidden />
      <HeroFloatingShapes />

      <div className="relative max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {isCentered ? (
          <div className="space-y-8 sm:space-y-10">
            <HeroCopy hero={hero} storeSlug={storeSlug} align="center" animate={animate} />
            {hasImage && imageUrl && (
              <motion.div
                className={cn(
                  'overflow-hidden rounded-sm border sf-border shadow-[0_24px_60px_-32px_rgba(0,0,0,0.2)]',
                  'aspect-[4/3] sm:aspect-[16/9] max-h-[min(52vh,28rem)] mx-auto max-w-4xl',
                  animate && 'motion-safe:sf-hero-image-reveal'
                )}
                style={{ y: parallaxY }}
              >
                <picture className="block w-full h-full">
                  {mobileImageUrl && <source media="(max-width: 767px)" srcSet={mobileImageUrl} />}
                  <HeroImage
                    src={imageUrl}
                    alt={hero.title || storeName}
                    fit={imageFit}
                    focalPoint={focalPoint}
                    priority={priority}
                  />
                </picture>
              </motion.div>
            )}
          </div>
        ) : isImageFocused ? (
          <div className="space-y-8 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-10 lg:items-center">
            <div className="lg:col-span-5 order-2 lg:order-1">
              <HeroCopy
                hero={hero}
                storeSlug={storeSlug}
                align={alignment}
                animate={animate}
              />
            </div>
            {hasImage && imageUrl ? (
              <motion.div
                className={cn(
                  'lg:col-span-7 order-1 lg:order-2 relative overflow-hidden rounded-sm border sf-border',
                  'aspect-[5/4] sm:aspect-[4/3] lg:aspect-[5/4] max-h-[min(58vh,32rem)]',
                  animate && 'motion-safe:sf-hero-image-reveal'
                )}
                style={{ y: parallaxY }}
              >
                <picture className="absolute inset-0">
                  {mobileImageUrl && <source media="(max-width: 767px)" srcSet={mobileImageUrl} />}
                  <HeroImage
                    src={imageUrl}
                    alt={hero.title || storeName}
                    fit={imageFit}
                    focalPoint={focalPoint}
                    priority={priority}
                  />
                </picture>
                {hero.overlay && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none" />
                )}
              </motion.div>
            ) : (
              <div className="lg:col-span-7 order-1 lg:order-2 aspect-[5/4] rounded-sm border sf-border bg-[var(--sf-surface)]" />
            )}
          </div>
        ) : (
          <div
            className={cn(
              'grid gap-8 lg:gap-12 lg:grid-cols-12 lg:items-center',
              hasImage ? 'lg:min-h-[min(70vh,36rem)]' : ''
            )}
          >
            <div
              className={cn(
                'lg:col-span-5 flex items-center',
                imageFirst ? 'lg:order-2' : 'lg:order-1'
              )}
            >
              <HeroCopy
                hero={hero}
                storeSlug={storeSlug}
                align={alignment}
                animate={animate}
              />
            </div>

            {hasImage && imageUrl ? (
              <motion.div
                className={cn(
                  'lg:col-span-7 relative overflow-hidden rounded-sm border sf-border',
                  'aspect-[4/5] sm:aspect-[3/4] lg:aspect-auto lg:min-h-[min(68vh,34rem)]',
                  imageFirst ? 'lg:order-1' : 'lg:order-2',
                  animate && 'motion-safe:sf-hero-image-reveal'
                )}
                style={{ y: parallaxY }}
              >
                <picture className="absolute inset-0">
                  {mobileImageUrl && <source media="(max-width: 767px)" srcSet={mobileImageUrl} />}
                  <HeroImage
                    src={imageUrl}
                    alt={hero.title || storeName}
                    fit={imageFit}
                    focalPoint={focalPoint}
                    priority={priority}
                  />
                </picture>
              </motion.div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
