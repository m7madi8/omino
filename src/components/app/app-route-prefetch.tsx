'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Prefetch all dashboard routes once the shell mounts for snappier navigation. */
export function AppRoutePrefetch({ hrefs }: { hrefs: string[] }) {
  const router = useRouter();

  useEffect(() => {
    for (const href of hrefs) {
      router.prefetch(href);
    }
  }, [hrefs, router]);

  return null;
}
