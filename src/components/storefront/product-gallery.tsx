'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SF_EASE, sfTransition, useReducedMotion } from '@/lib/storefront/motion';
import { cn } from '@/lib/utils';

export function ProductGallery({
  images,
  productName,
  productId,
}: {
  images: { url: string; alt: string | null }[];
  productName: string;
  productId: string;
}) {
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  const current = images[active] ?? images[0];

  if (!images.length) {
    return (
      <div className="aspect-[4/5] sf-surface flex items-center justify-center sf-muted rounded-sm">
        No image
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-[var(--sf-surface-elevated)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current?.url}
            layoutId={`product-image-${productId}`}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: SF_EASE }}
            className="absolute inset-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.url}
              alt={current.alt || productName}
              className="w-full h-full object-cover"
              fetchPriority="high"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className={cn(
                'shrink-0 w-16 h-20 sm:w-20 sm:h-24 overflow-hidden rounded-sm border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-primary)]',
                i === active ? 'border-[var(--sf-primary)]' : 'sf-border opacity-70 hover:opacity-100'
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
