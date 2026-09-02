'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { RippleGrid } from '@/components/marketing/ripple-grid';

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-svh bg-ink text-paper flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-ink p-12 flex-col justify-between">
        <RippleGrid
          enableRainbow={false}
          gridColor="#5B7CFF"
          rippleIntensity={0.04}
          gridSize={10}
          gridThickness={18}
          mouseInteraction
          mouseInteractionRadius={0.8}
          opacity={0.22}
          fadeDistance={1.5}
          vignetteStrength={2}
          glowIntensity={0.06}
          gridRotation={0}
        />
        <div className="relative z-10">
          <Link href="/main" className="inline-flex items-center" aria-label="OMINO">
            <img
              src="/main/img/omino-lockup-paper.png"
              alt="OMINO"
              width={683}
              height={235}
              className="h-7 w-auto"
            />
          </Link>
        </div>
        <div className="relative z-10 max-w-md">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-stone mb-4">AI Business OS</p>
          <h1 className="text-4xl leading-tight text-paper">One intelligent system for your business.</h1>
          <p className="mt-4 text-stone leading-relaxed">
            POS, store, inventory, CRM, payments, analytics — unified with AI that recommends, you approve.
          </p>
        </div>
        <p className="relative z-10 text-xs text-stone">© OMINO</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-paper">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link href="/main" aria-label="OMINO">
              <img
                src="/main/img/omino-lockup-ink.png"
                alt="OMINO"
                width={683}
                height={235}
                className="h-6 w-auto"
              />
            </Link>
          </div>
          <div className="mb-8">
            <h2 className="text-2xl text-ink">{title}</h2>
            {subtitle && <p className="mt-2 text-sm text-stone-2">{subtitle}</p>}
          </div>
          {children}
          {footer && <div className="mt-6 text-sm text-stone-2">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
