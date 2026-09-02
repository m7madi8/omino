import { prisma } from '@/lib/db';
import type { StorefrontProductListItem } from '@/types/storefront';

async function toListItem(
  product: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    isFeatured: boolean;
    catalogKind: string;
    trackInventory: boolean;
    images: { url: string }[];
    category: { name: string; slug: string } | null;
    variants: {
      id: string;
      sellingPrice: number;
      compareAtPrice: number | null;
      currency: string;
      isDefault: boolean;
      stockLevels: { quantityOnHand: number; quantityReserved: number }[];
    }[];
  },
  availableFn: (trackInventory: boolean, levels: { quantityOnHand: number; quantityReserved: number }[]) => number
): Promise<StorefrontProductListItem | null> {
  if (!product.variants.length) return null;
  const v = product.variants.find((x) => x.isDefault) || product.variants[0];
  const level = v.stockLevels[0];
  const available = availableFn(product.trackInventory, v.stockLevels);
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    imageUrl: product.images[0]?.url ?? null,
    secondaryImageUrl: product.images[1]?.url ?? null,
    defaultVariantId: v.id,
    categoryName: product.category?.name ?? null,
    categorySlug: product.category?.slug ?? null,
    catalogKind: product.catalogKind as 'SIMPLE' | 'BUNDLE',
    isFeatured: product.isFeatured,
    priceMinor: v.sellingPrice,
    compareAtPriceMinor: v.compareAtPrice,
    currency: v.currency,
    available,
    inStock: !product.trackInventory || available > 0,
    variantCount: product.variants.length,
  };
}

function computeAvailable(
  trackInventory: boolean,
  levels: { quantityOnHand: number; quantityReserved: number }[]
) {
  if (!trackInventory) return 999;
  const level = levels[0];
  if (!level) return 0;
  return Math.max(0, level.quantityOnHand - level.quantityReserved);
}

const productInclude = {
  images: { orderBy: { position: 'asc' as const }, take: 2 },
  category: { select: { name: true, slug: true } },
  variants: {
    where: { deletedAt: null, status: 'ACTIVE' as const },
    orderBy: { position: 'asc' as const },
    include: { stockLevels: true },
  },
};

export async function getRelatedProducts(
  organizationId: string,
  storeId: string,
  productId: string,
  stockLocationId: string,
  limit = 4
): Promise<StorefrontProductListItem[]> {
  const product = await prisma.product.findFirst({
    where: { id: productId, organizationId },
    select: { categoryId: true },
  });
  if (!product?.categoryId) return [];

  const products = await prisma.product.findMany({
    where: {
      organizationId,
      deletedAt: null,
      status: 'ACTIVE',
      id: { not: productId },
      categoryId: product.categoryId,
      OR: [{ storeId }, { storeId: null }],
      variants: { some: { deletedAt: null, status: 'ACTIVE' } },
    },
    include: {
      ...productInclude,
      variants: {
        ...productInclude.variants,
        include: { stockLevels: { where: { stockLocationId } } },
      },
    },
    take: limit,
    orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
  });

  const items: StorefrontProductListItem[] = [];
  for (const p of products) {
    const item = await toListItem(p, computeAvailable);
    if (item?.inStock) items.push(item);
  }
  return items;
}

export async function getFrequentlyBoughtTogether(
  organizationId: string,
  productId: string,
  stockLocationId: string,
  limit = 3
): Promise<StorefrontProductListItem[]> {
  const affinities = await prisma.productAffinity.findMany({
    where: {
      organizationId,
      OR: [{ productIdA: productId }, { productIdB: productId }],
    },
    orderBy: { score: 'desc' },
    take: limit * 2,
  });

  const relatedIds = affinities.map((a) =>
    a.productIdA === productId ? a.productIdB : a.productIdA
  );

  if (!relatedIds.length) return [];

  const products = await prisma.product.findMany({
    where: {
      id: { in: relatedIds },
      organizationId,
      deletedAt: null,
      status: 'ACTIVE',
    },
    include: {
      ...productInclude,
      variants: {
        ...productInclude.variants,
        include: { stockLevels: { where: { stockLocationId } } },
      },
    },
  });

  const items: StorefrontProductListItem[] = [];
  for (const p of products) {
    const item = await toListItem(p, computeAvailable);
    if (item?.inStock) items.push(item);
    if (items.length >= limit) break;
  }
  return items;
}

export async function rebuildProductAffinities(organizationId: string) {
  const orders = await prisma.order.findMany({
    where: {
      organizationId,
      status: { in: ['CONFIRMED', 'PROCESSING', 'COMPLETED'] },
    },
    include: { items: { select: { productId: true } } },
    take: 5000,
    orderBy: { createdAt: 'desc' },
  });

  const pairCounts = new Map<string, number>();

  for (const order of orders) {
    const productIds = [...new Set(order.items.map((i) => i.productId))];
    for (let i = 0; i < productIds.length; i++) {
      for (let j = i + 1; j < productIds.length; j++) {
        const a = productIds[i] < productIds[j] ? productIds[i] : productIds[j];
        const b = productIds[i] < productIds[j] ? productIds[j] : productIds[i];
        const key = `${a}:${b}`;
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
      }
    }
  }

  for (const [key, count] of pairCounts) {
    const [productIdA, productIdB] = key.split(':');
    await prisma.productAffinity.upsert({
      where: {
        organizationId_productIdA_productIdB: {
          organizationId,
          productIdA,
          productIdB,
        },
      },
      create: {
        organizationId,
        productIdA,
        productIdB,
        orderCount: count,
        score: count * 10,
      },
      update: { orderCount: count, score: count * 10 },
    });
  }

  return { pairsUpdated: pairCounts.size };
}
