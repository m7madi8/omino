import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import { recordStorefrontEvent } from '@/server/services/storefront-analytics-service';

export type SearchResult = {
  products: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    priceMinor: number;
    categoryName: string | null;
  }[];
  categories: { id: string; name: string; slug: string }[];
  collections: { id: string; name: string; slug: string; imageUrl: string | null }[];
  total: number;
};

function normalizeQuery(q: string) {
  return q.trim().toLowerCase();
}

export async function searchStorefront(input: {
  organizationId: string;
  storeId: string;
  query: string;
  limit?: number;
  sessionId?: string;
  visitorId?: string;
}): Promise<SearchResult> {
  const q = normalizeQuery(input.query);
  const limit = Math.min(input.limit ?? 12, 24);

  if (!q) {
    return { products: [], categories: [], collections: [], total: 0 };
  }

  const [products, categories, collections] = await Promise.all([
    prisma.product.findMany({
      where: {
        organizationId: input.organizationId,
        deletedAt: null,
        status: 'ACTIVE',
        AND: [
          { OR: [{ storeId: input.storeId }, { storeId: null }] },
          {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
              { brand: { contains: q, mode: 'insensitive' } },
              { variants: { some: { sku: { contains: q, mode: 'insensitive' } } } },
            ],
          },
        ],
      },
      include: {
        images: { orderBy: { position: 'asc' }, take: 1 },
        category: { select: { name: true } },
        variants: {
          where: { deletedAt: null, status: 'ACTIVE' },
          orderBy: { position: 'asc' },
          take: 1,
        },
      },
      take: limit,
      orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
    }),
    prisma.category.findMany({
      where: {
        organizationId: input.organizationId,
        deletedAt: null,
        name: { contains: q, mode: 'insensitive' },
      },
      take: 5,
      orderBy: { name: 'asc' },
    }),
    prisma.collection.findMany({
      where: {
        organizationId: input.organizationId,
        deletedAt: null,
        status: 'ACTIVE',
        OR: [{ storeId: input.storeId }, { storeId: null }],
        name: { contains: q, mode: 'insensitive' },
      },
      take: 5,
      orderBy: { name: 'asc' },
    }),
  ]);

  const activeProducts = products.filter((p) => p.variants.length > 0);
  const total = activeProducts.length + categories.length + collections.length;

  await prisma.searchQueryLog.create({
    data: {
      organizationId: input.organizationId,
      storeId: input.storeId,
      query: input.query.trim(),
      resultCount: total,
      sessionId: input.sessionId,
    },
  });

  await recordStorefrontEvent({
    organizationId: input.organizationId,
    storeId: input.storeId,
    type: total === 0 ? 'SEARCH_NO_RESULTS' : 'SEARCH_PERFORMED',
    searchQuery: input.query.trim(),
    sessionId: input.sessionId,
    visitorId: input.visitorId,
    payload: { resultCount: total },
  });

  return {
    products: activeProducts.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      imageUrl: p.images[0]?.url ?? null,
      priceMinor: p.variants[0].sellingPrice,
      categoryName: p.category?.name ?? null,
    })),
    categories: categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
    collections: collections.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      imageUrl: c.imageUrl,
    })),
    total,
  };
}

export async function getSearchSuggestions(
  organizationId: string,
  storeId: string,
  query: string,
  limit = 6
) {
  const q = normalizeQuery(query);
  if (!q) return [];

  const [products, recent] = await Promise.all([
    prisma.product.findMany({
      where: {
        organizationId,
        deletedAt: null,
        status: 'ACTIVE',
        OR: [{ storeId }, { storeId: null }],
        name: { contains: q, mode: 'insensitive' },
      },
      select: { name: true, slug: true },
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.searchQueryLog.groupBy({
      by: ['query'],
      where: {
        organizationId,
        storeId,
        query: { contains: q, mode: 'insensitive' },
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      _count: { query: true },
      orderBy: { _count: { query: 'desc' } },
      take: 3,
    }),
  ]);

  const suggestions = new Set<string>();
  for (const p of products) suggestions.add(p.name);
  for (const r of recent) suggestions.add(r.query);
  return Array.from(suggestions).slice(0, limit);
}
