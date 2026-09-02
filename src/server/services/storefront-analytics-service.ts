import { prisma } from '@/lib/db';

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export const STOREFRONT_EVENT_TYPES = [
  'STORE_VIEWED',
  'PRODUCT_VIEWED',
  'SEARCH_PERFORMED',
  'SEARCH_NO_RESULTS',
  'CATEGORY_VIEWED',
  'COLLECTION_VIEWED',
  'PRODUCT_ADDED_TO_CART',
  'PRODUCT_REMOVED_FROM_CART',
  'CART_VIEWED',
  'CHECKOUT_STARTED',
  'ORDER_CREATED',
  'ORDER_COMPLETED',
  'REVIEW_CREATED',
  'PROMOTION_APPLIED',
] as const;

export type StorefrontEventType = (typeof STOREFRONT_EVENT_TYPES)[number];

export async function recordStorefrontEvent(input: {
  organizationId: string;
  storeId: string;
  type: StorefrontEventType | string;
  sessionId?: string;
  visitorId?: string;
  productId?: string;
  categoryId?: string;
  collectionId?: string;
  searchQuery?: string;
  orderId?: string;
  cartId?: string;
  payload?: Record<string, unknown>;
}) {
  const event = await prisma.storefrontEvent.create({
    data: {
      organizationId: input.organizationId,
      storeId: input.storeId,
      type: input.type,
      sessionId: input.sessionId,
      visitorId: input.visitorId,
      productId: input.productId,
      categoryId: input.categoryId,
      collectionId: input.collectionId,
      searchQuery: input.searchQuery,
      orderId: input.orderId,
      cartId: input.cartId,
      payload: (input.payload ?? undefined) as import('@prisma/client').Prisma.InputJsonValue | undefined,
    },
  });

  await incrementDailyMetric(input.storeId, input.organizationId, input.type, input.payload);

  return event;
}

async function incrementDailyMetric(
  storeId: string,
  organizationId: string,
  type: string,
  payload?: Record<string, unknown>
) {
  const date = startOfDay(new Date());
  const increments: Record<string, number> = {};

  switch (type) {
    case 'STORE_VIEWED':
      increments.storeViews = 1;
      break;
    case 'PRODUCT_VIEWED':
    case 'product_viewed':
      increments.productViews = 1;
      break;
    case 'PRODUCT_ADDED_TO_CART':
    case 'product_added_to_cart':
      increments.addToCarts = 1;
      break;
    case 'CHECKOUT_STARTED':
    case 'checkout_started':
      increments.checkouts = 1;
      break;
    case 'ORDER_COMPLETED':
    case 'ORDER_CREATED':
    case 'checkout_completed':
      increments.purchases = 1;
      if (typeof payload?.revenueMinor === 'number') {
        increments.revenueMinor = payload.revenueMinor;
      }
      break;
    case 'SEARCH_PERFORMED':
      increments.searches = 1;
      break;
    case 'SEARCH_NO_RESULTS':
      increments.zeroResultSearches = 1;
      break;
    default:
      break;
  }

  if (!Object.keys(increments).length) return;

  await prisma.storefrontDailyMetric.upsert({
    where: { storeId_date: { storeId, date } },
    create: {
      organizationId,
      storeId,
      date,
      storeViews: increments.storeViews ?? 0,
      productViews: increments.productViews ?? 0,
      addToCarts: increments.addToCarts ?? 0,
      checkouts: increments.checkouts ?? 0,
      purchases: increments.purchases ?? 0,
      revenueMinor: increments.revenueMinor ?? 0,
      searches: increments.searches ?? 0,
      zeroResultSearches: increments.zeroResultSearches ?? 0,
    },
    update: {
      storeViews: increments.storeViews ? { increment: increments.storeViews } : undefined,
      productViews: increments.productViews ? { increment: increments.productViews } : undefined,
      addToCarts: increments.addToCarts ? { increment: increments.addToCarts } : undefined,
      checkouts: increments.checkouts ? { increment: increments.checkouts } : undefined,
      purchases: increments.purchases ? { increment: increments.purchases } : undefined,
      revenueMinor: increments.revenueMinor ? { increment: increments.revenueMinor } : undefined,
      searches: increments.searches ? { increment: increments.searches } : undefined,
      zeroResultSearches: increments.zeroResultSearches
        ? { increment: increments.zeroResultSearches }
        : undefined,
    },
  });
}

export async function getStoreFunnel(
  organizationId: string,
  storeId: string,
  days = 30
) {
  const since = startOfDay(new Date(Date.now() - days * 24 * 60 * 60 * 1000));

  const metrics = await prisma.storefrontDailyMetric.findMany({
    where: { organizationId, storeId, date: { gte: since } },
    orderBy: { date: 'asc' },
  });

  if (!metrics.length) {
    return {
      hasData: false,
      funnel: null,
      message: 'Not enough data yet.',
    };
  }

  const totals = metrics.reduce(
    (acc, m) => ({
      storeViews: acc.storeViews + m.storeViews,
      productViews: acc.productViews + m.productViews,
      addToCarts: acc.addToCarts + m.addToCarts,
      checkouts: acc.checkouts + m.checkouts,
      purchases: acc.purchases + m.purchases,
      revenueMinor: acc.revenueMinor + m.revenueMinor,
      searches: acc.searches + m.searches,
      zeroResultSearches: acc.zeroResultSearches + m.zeroResultSearches,
    }),
    {
      storeViews: 0,
      productViews: 0,
      addToCarts: 0,
      checkouts: 0,
      purchases: 0,
      revenueMinor: 0,
      searches: 0,
      zeroResultSearches: 0,
    }
  );

  const conversionRate =
    totals.storeViews > 0 ? Math.round((totals.purchases / totals.storeViews) * 10000) / 100 : 0;
  const addToCartRate =
    totals.productViews > 0
      ? Math.round((totals.addToCarts / totals.productViews) * 10000) / 100
      : 0;
  const checkoutCompletionRate =
    totals.checkouts > 0 ? Math.round((totals.purchases / totals.checkouts) * 10000) / 100 : 0;

  return {
    hasData: true,
    periodDays: days,
    funnel: {
      visitors: totals.storeViews,
      productViews: totals.productViews,
      addToCarts: totals.addToCarts,
      checkouts: totals.checkouts,
      purchases: totals.purchases,
      revenueMinor: totals.revenueMinor,
    },
    rates: {
      conversionRate,
      addToCartRate,
      checkoutCompletionRate,
    },
    searches: {
      total: totals.searches,
      zeroResults: totals.zeroResultSearches,
    },
    daily: metrics.map((m) => ({
      date: m.date.toISOString().slice(0, 10),
      storeViews: m.storeViews,
      productViews: m.productViews,
      addToCarts: m.addToCarts,
      checkouts: m.checkouts,
      purchases: m.purchases,
      revenueMinor: m.revenueMinor,
    })),
  };
}

export async function getTopSearchTerms(
  organizationId: string,
  storeId: string,
  limit = 10
) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const events = await prisma.storefrontEvent.groupBy({
    by: ['searchQuery'],
    where: {
      organizationId,
      storeId,
      type: 'SEARCH_PERFORMED',
      searchQuery: { not: null },
      createdAt: { gte: since },
    },
    _count: { searchQuery: true },
    orderBy: { _count: { searchQuery: 'desc' } },
    take: limit,
  });

  return events
    .filter((e) => e.searchQuery)
    .map((e) => ({ query: e.searchQuery!, count: e._count.searchQuery }));
}

export async function getZeroResultSearches(
  organizationId: string,
  storeId: string,
  limit = 10
) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const events = await prisma.storefrontEvent.groupBy({
    by: ['searchQuery'],
    where: {
      organizationId,
      storeId,
      type: 'SEARCH_NO_RESULTS',
      searchQuery: { not: null },
      createdAt: { gte: since },
    },
    _count: { searchQuery: true },
    orderBy: { _count: { searchQuery: 'desc' } },
    take: limit,
  });

  return events
    .filter((e) => e.searchQuery)
    .map((e) => ({ query: e.searchQuery!, count: e._count.searchQuery }));
}
