'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { StorefrontCart } from '@/types/storefront';
import { SF_EASE } from '@/lib/storefront/motion';

type FlyPayload = {
  imageUrl: string;
  fromX: number;
  fromY: number;
};

type StoreCartContextValue = {
  cart: StorefrontCart | null;
  loading: boolean;
  drawerOpen: boolean;
  cartPulse: boolean;
  badgeBump: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  refreshCart: () => Promise<void>;
  notifyItemAdded: () => void;
  triggerFlyToCart: (payload: FlyPayload) => void;
  setCart: (cart: StorefrontCart | null) => void;
};

const StoreCartContext = createContext<StoreCartContextValue | null>(null);

function FlyToCartLayer({ fly }: { fly: FlyPayload | null }) {
  const [target, setTarget] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!fly) return;
    const btn = document.querySelector('[data-sf-cart-trigger]');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setTarget({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  }, [fly]);

  if (!fly || !target) return null;

  return createPortal(
    <motion.div
      className="fixed z-[100] pointer-events-none w-12 h-12 rounded-sm overflow-hidden shadow-lg border sf-border"
      initial={{ left: fly.fromX, top: fly.fromY, opacity: 1, scale: 1 }}
      animate={{ left: target.x - 24, top: target.y - 24, opacity: 0.15, scale: 0.35 }}
      transition={{ duration: 0.55, ease: SF_EASE }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={fly.imageUrl} alt="" className="w-full h-full object-cover" />
    </motion.div>,
    document.body
  );
}

export function StoreCartProvider({
  storeSlug,
  children,
}: {
  storeSlug: string;
  children: React.ReactNode;
}) {
  const [cart, setCart] = useState<StorefrontCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cartPulse, setCartPulse] = useState(false);
  const [badgeBump, setBadgeBump] = useState(false);
  const [fly, setFly] = useState<FlyPayload | null>(null);

  const refreshCart = useCallback(async () => {
    const res = await fetch(`/api/storefront/${storeSlug}/cart`);
    const data = await res.json();
    if (res.ok) setCart(data.cart);
    setLoading(false);
  }, [storeSlug]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const notifyItemAdded = useCallback(() => {
    setCartPulse(true);
    setBadgeBump(true);
    window.setTimeout(() => setCartPulse(false), 500);
    window.setTimeout(() => setBadgeBump(false), 400);
  }, []);

  const triggerFlyToCart = useCallback((payload: FlyPayload) => {
    setFly(payload);
    window.setTimeout(() => setFly(null), 600);
  }, []);

  const value = useMemo(
    () => ({
      cart,
      loading,
      drawerOpen,
      cartPulse,
      badgeBump,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      refreshCart,
      notifyItemAdded,
      triggerFlyToCart,
      setCart,
    }),
    [cart, loading, drawerOpen, cartPulse, badgeBump, refreshCart, notifyItemAdded, triggerFlyToCart]
  );

  return (
    <StoreCartContext.Provider value={value}>
      {children}
      <AnimatePresence>{fly && <FlyToCartLayer fly={fly} />}</AnimatePresence>
    </StoreCartContext.Provider>
  );
}

export function useStoreCart() {
  const ctx = useContext(StoreCartContext);
  if (!ctx) throw new Error('useStoreCart must be used within StoreCartProvider');
  return ctx;
}
