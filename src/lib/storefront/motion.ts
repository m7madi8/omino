'use client';

import { useEffect, useState } from 'react';

export const SF_EASE = [0.22, 1, 0.36, 1] as const;

export const sfTransition = {
  soft: { duration: 0.38, ease: SF_EASE },
  page: { duration: 0.32, ease: SF_EASE },
  card: { duration: 0.5, ease: SF_EASE },
} as const;

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return reduced;
}

export const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: SF_EASE },
  }),
};

export const pageVariants = {
  initial: { opacity: 0, y: 10, scale: 0.995 },
  enter: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.34, ease: SF_EASE } },
  exit: { opacity: 0, y: -6, scale: 0.995, transition: { duration: 0.24, ease: SF_EASE } },
};
