import { prisma } from '@/lib/db';
import { getLiveExperience, parseExperienceDocument } from '@/lib/storefront/store-experience-engine';
import { computeStoreHealth } from '@/lib/storefront/store-health';
import { getStoreFunnel } from '@/server/services/storefront-analytics-service';

export type StoreInsight = {
  observation: string;
  whyItMatters: string;
  recommendation: string;
  impact: 'high' | 'medium' | 'low';
  suggestedAction?: {
    type: string;
    label: string;
    payload?: Record<string, unknown>;
  };
};

export async function analyzeStorefront(organizationId: string, storeId: string) {
  const store = await prisma.store.findFirst({
    where: { id: storeId, organizationId },
  });
  if (!store) throw new Error('NOT_FOUND');

  const experience = getLiveExperience(store.themeSettings);
  const experienceDoc = parseExperienceDocument(store.themeSettings);

  const [productCount, productsWithImages, categoryCount, shippingMethodCount, funnel] =
    await Promise.all([
      prisma.product.count({
        where: {
          organizationId,
          deletedAt: null,
          status: 'ACTIVE',
          OR: [{ storeId }, { storeId: null }],
        },
      }),
      prisma.product.count({
        where: {
          organizationId,
          deletedAt: null,
          status: 'ACTIVE',
          OR: [{ storeId }, { storeId: null }],
          images: { some: {} },
        },
      }),
      prisma.category.count({ where: { organizationId, deletedAt: null } }),
      prisma.shippingMethod.count({ where: { storeId, organizationId } }),
      getStoreFunnel(organizationId, storeId, 30),
    ]);

  const health = computeStoreHealth({
    storeName: store.name,
    storeStatus: store.status,
    logoUrl: store.logoUrl,
    description: store.description,
    contactEmail: store.contactEmail,
    contactPhone: store.contactPhone,
    productCount,
    productsWithImages,
    categoryCount,
    shippingMethodCount,
    experience,
  });

  const insights: StoreInsight[] = [];

  if (!store.logoUrl) {
    insights.push({
      observation: 'Your store is missing a logo.',
      whyItMatters: 'A logo builds brand recognition and trust in navigation and checkout.',
      recommendation: 'Upload a clear logo in Store → Identity.',
      impact: 'high',
      suggestedAction: { type: 'navigate', label: 'Upload logo', payload: { tab: 'identity' } },
    });
  }

  if (experience.hero.enabled && !experience.hero.primaryCta?.label?.trim()) {
    insights.push({
      observation: 'Your Hero is enabled but has no primary call-to-action.',
      whyItMatters: 'Visitors need a clear next step to start shopping.',
      recommendation: 'Add a primary CTA such as "Shop collection" linking to your products.',
      impact: 'high',
      suggestedAction: {
        type: 'update_hero',
        label: 'Add primary CTA',
        payload: { primaryCta: { label: 'Shop collection', href: `/store/${store.publicSlug}/products` } },
      },
    });
  }

  if (
    experience.hero.enabled &&
    experience.hero.imageUrl &&
    !experience.hero.title?.trim()
  ) {
    insights.push({
      observation: 'Your Hero has strong imagery but no headline.',
      whyItMatters: 'A headline anchors the visual and communicates your value proposition.',
      recommendation: 'Add a concise headline that states what you sell and why it matters.',
      impact: 'medium',
      suggestedAction: { type: 'update_hero', label: 'Add headline' },
    });
  }

  if (!experience.seo.title?.trim() && !experience.seo.description?.trim()) {
    insights.push({
      observation: 'SEO title and description are using defaults.',
      whyItMatters: 'Custom SEO improves discovery on search engines and social sharing.',
      recommendation: 'Add a store-specific title and meta description in Store → SEO.',
      impact: 'medium',
      suggestedAction: { type: 'navigate', label: 'Configure SEO', payload: { tab: 'seo' } },
    });
  }

  if (productCount > 0 && productsWithImages < productCount * 0.5) {
    insights.push({
      observation: `Only ${productsWithImages} of ${productCount} active products have images.`,
      whyItMatters: 'Products without images convert significantly worse.',
      recommendation: 'Add images to at least half your catalog, starting with featured products.',
      impact: 'high',
      suggestedAction: { type: 'navigate', label: 'Review products', payload: { href: '/app/products' } },
    });
  }

  if (funnel.hasData && funnel.rates) {
    if (funnel.rates.addToCartRate < 5 && funnel.funnel!.productViews > 20) {
      insights.push({
        observation: `Add-to-cart rate is ${funnel.rates.addToCartRate}% over the last 30 days.`,
        whyItMatters: 'Low add-to-cart suggests product pages or pricing may need improvement.',
        recommendation: 'Review product imagery, descriptions, and pricing on top-viewed products.',
        impact: 'high',
      });
    }
  } else {
    insights.push({
      observation: 'Not enough storefront analytics data yet.',
      whyItMatters: 'Conversion insights require real visitor activity.',
      recommendation: 'Drive traffic to your store and check back after more sessions.',
      impact: 'low',
    });
  }

  if (!experienceDoc.publishedAt) {
    insights.push({
      observation: 'Your storefront experience has never been published.',
      whyItMatters: 'Draft changes are not visible to customers until published.',
      recommendation: 'Review your draft and publish when ready.',
      impact: 'high',
      suggestedAction: { type: 'publish', label: 'Publish storefront' },
    });
  }

  return {
    storeId: store.id,
    storeName: store.name,
    healthScore: health.score,
    healthStatus: health.status,
    publishedAt: experienceDoc.publishedAt,
    insights,
    funnel: funnel.hasData ? funnel : { message: 'Not enough data yet.' },
  };
}

export async function analyzeProductMerchandising(organizationId: string, storeId: string) {
  const funnel = await getStoreFunnel(organizationId, storeId, 30);

  const productViews = await prisma.storefrontEvent.groupBy({
    by: ['productId'],
    where: {
      organizationId,
      storeId,
      type: 'PRODUCT_VIEWED',
      productId: { not: null },
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    _count: { productId: true },
    orderBy: { _count: { productId: 'desc' } },
    take: 20,
  });

  const addToCarts = await prisma.storefrontEvent.groupBy({
    by: ['productId'],
    where: {
      organizationId,
      storeId,
      type: 'PRODUCT_ADDED_TO_CART',
      productId: { not: null },
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    _count: { productId: true },
  });

  const cartMap = new Map(
    addToCarts.filter((a) => a.productId).map((a) => [a.productId!, a._count.productId])
  );

  const insights: StoreInsight[] = [];

  if (!productViews.length) {
    return {
      hasData: false,
      message: 'Not enough data yet.',
      insights: [],
      topProducts: [],
    };
  }

  const productIds = productViews.map((p) => p.productId!).filter(Boolean);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, organizationId },
    select: { id: true, name: true, slug: true, isFeatured: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const view of productViews.slice(0, 10)) {
    if (!view.productId) continue;
    const views = view._count.productId;
    const carts = cartMap.get(view.productId) ?? 0;
    const rate = views > 0 ? Math.round((carts / views) * 100) : 0;
    const product = productMap.get(view.productId);

    if (views >= 10 && rate < 5 && product) {
      insights.push({
        observation: `${product.name} received ${views} views but only ${carts} add-to-cart events (${rate}%).`,
        whyItMatters: 'High views with low cart adds suggest the product page needs improvement.',
        recommendation:
          'Improve product imagery, clarify benefits in the description, and verify pricing.',
        impact: 'high',
        suggestedAction: {
          type: 'navigate',
          label: 'Edit product',
          payload: { href: `/app/products/${product.id}` },
        },
      });
    }
  }

  const topSelling = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      order: {
        organizationId,
        storeId,
        status: { in: ['CONFIRMED', 'PROCESSING', 'COMPLETED'] },
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 5,
  });

  for (const sale of topSelling) {
    const product = await prisma.product.findFirst({
      where: { id: sale.productId, organizationId },
      select: { id: true, name: true, isFeatured: true },
    });
    if (product && !product.isFeatured && (sale._sum.quantity ?? 0) >= 3) {
      insights.push({
        observation: `${product.name} is a top seller but not marked as featured.`,
        whyItMatters: 'Featuring high performers increases homepage conversion.',
        recommendation: 'Mark this product as featured or add it to a homepage collection.',
        impact: 'medium',
        suggestedAction: {
          type: 'set_featured',
          label: 'Feature product',
          payload: { productId: product.id },
        },
      });
    }
  }

  return {
    hasData: true,
    funnel: funnel.hasData ? funnel.rates : null,
    insights,
    topProducts: productViews.slice(0, 5).map((v) => ({
      productId: v.productId,
      name: productMap.get(v.productId!)?.name,
      views: v._count.productId,
      addToCarts: cartMap.get(v.productId!) ?? 0,
    })),
  };
}
