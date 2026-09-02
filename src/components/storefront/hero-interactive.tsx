'use client';

import { motion } from 'framer-motion';
import { SF_EASE, useReducedMotion } from '@/lib/storefront/motion';

export function StaggeredHeadline({
  text,
  className,
  inverted,
}: {
  text: string;
  className?: string;
  inverted?: boolean;
}) {
  const reduced = useReducedMotion();
  const words = text.split(/\s+/);

  if (reduced) {
    return <h1 className={className}>{text}</h1>;
  }

  return (
    <h1 className={className} aria-label={text}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className={inverted ? 'text-white' : 'sf-ink'}
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 + i * 0.07, duration: 0.55, ease: SF_EASE }}
          style={{ display: 'inline-block', marginRight: '0.28em' }}
        >
          {word}
        </motion.span>
      ))}
    </h1>
  );
}

export function HeroFloatingShapes() {
  const reduced = useReducedMotion();
  if (reduced) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <motion.div
        className="absolute -top-12 end-[8%] w-48 h-48 rounded-full bg-[color-mix(in_srgb,var(--sf-primary)_18%,transparent)] blur-3xl"
        animate={{ y: [0, 18, 0], x: [0, -10, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[15%] start-[5%] w-36 h-36 rounded-full bg-[color-mix(in_srgb,var(--sf-secondary)_55%,transparent)] blur-2xl"
        animate={{ y: [0, -14, 0], x: [0, 12, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <motion.div
        className="absolute top-[35%] start-[42%] w-20 h-20 rotate-45 border border-[color-mix(in_srgb,var(--sf-primary)_22%,transparent)]"
        animate={{ rotate: [45, 52, 45], opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
