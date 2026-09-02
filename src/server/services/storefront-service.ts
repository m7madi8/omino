import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import {
  adjustStockInTx,
  computeAvailable,
  ensureDefaultStockLocation,
} from '@/server/services/inventory-service';
import { findOrCreateCustomerFromCheckout } from '@/server/services/customer-service';
import { logAudit } from '@/server/services/audit-service';
import { emitOrderEvent } from '@/server/events/order-events';
import { emitStorefrontEvent } from '@/server/events/storefront-events';
import {
  calculateOrderTotals,
  generateOrderNumber,
  recordOrderEvent,
} from '@/server/services/order-service';
import { createPayment } from '@/server/services/payment-service';
import { ensureDefaultShippingMethods } from '@/server/services/store-service';
import {
  applyCouponToCart,
  recordPromotionRedemption,
} from '@/server/services/marketing/promotion-service';
import { attributeOrderToCampaign } from '@/server/services/marketing/attribution-service';
import type {
  CheckoutInput,
  PublicOrderView,
  ShippingMethodView,
  StorefrontCart,
  StorefrontCategory,
  StorefrontProductDetail,
  StorefrontProductListItem,
  StorefrontStore,
} from '@/types/storefront';
import { parseExperienceDocument, getLiveExperience } from '@/lib/storefront/store-experience-engine';
import { buildCatalogSections } from '@/lib/storefront/catalog-sections';
import { parseSocialLinks, resolveStoreContactLinks } from '@/lib/storefront/contact-links';

type Tx = Prisma.TransactionClient;

export class StorefrontError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
  }
}

export async function resolveStoreByPublicSlug(publicSlug: string) {
  const store = await prisma.store.findUnique({
    where: { publicSlug },
    include: {
      organization: { select: { id: true, currency: true, name: true } },
      branches: { where: { isDefault: true }, take: 1 },
    },
  });
  if (!store) throw new StorefrontError('Store not found', 'STORE_NOT_FOUND');
  return store;
}

export function toStorefrontStore(store: {
  id: string;
  name: string;
  publicSlug: string;
  description: string | null;
  logoUrl: string | null;
  faviconUrl?: string | null;
  currency: string | null;
  country: string | null;
  status: string;
  primaryColor: string | null;
  secondaryColor?: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  socialLinks?: unknown;
  themeSettings?: unknown;
  organization: { currency: string };
}): StorefrontStore {
  const socialLinks = parseSocialLinks(store.socialLinks);
  const experienceDoc = parseExperienceDocument(store.themeSettings);
  const experience = getLiveExperience(store.themeSettings);
  return {
    id: store.id,
    name: store.name,
    publicSlug: store.publicSlug,
    description: store.description,
    logoUrl: store.logoUrl,
    faviconUrl: store.faviconUrl ?? null,
    currency: store.currency || store.organization.currency,
    country: store.country,
    status: store.status as StorefrontStore['status'],
    primaryColor: store.primaryColor,
    secondaryColor: store.secondaryColor ?? null,
    contactEmail: store.contactEmail,
    contactPhone: store.contactPhone,
    socialLinks,
    contactLinks: resolveStoreContactLinks({
      socialLinks,
      contactEmail: store.contactEmail,
      contactPhone: store.contactPhone,
    }),
    hero: experience.hero,
    experience,
    publishedAt: experienceDoc.publishedAt,
    hasUnpublishedChanges:
      JSON.stringify(experienceDoc.live) !== JSON.stringify(experienceDoc.draft),
  };
}

async function getDefaultBranch(storeId: string) {
  const branch = await prisma.branch.findFirst({
    where: { storeId, isDefault: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!branch) throw new StorefrontError('Store not configured', 'STORE_NOT_READY');
  return branch;
}

async function getOrgOwnerUserId(organizationId: string): Promise<string> {
  const membership = await prisma.membership.findFirst({
    where: { organizationId, role: { slug: 'OWNER' } },
    select: { userId: true },
  });
  if (membership) return membership.userId;
  const any = await prisma.membership.findFirst({
    where: { organizationId },
    select: { userId: true },
  });
  if (!any) throw new StorefrontError('Store not configured', 'STORE_NOT_READY');
  return any.userId;
}

function mapCart(
  cart: {
    id: string;
    currency: string;
    subtotalMinor: number;
    discountAmount: number;
    taxAmount: number;
    shippingAmount: number;
    totalMinor: number;
    items: {
      id: string;
      productId: string;
      variantId: string;
      productName: string;
      variantName: string | null;
      sku: string;
      quantity: number;
      unitPriceMinor: number;
      subtotalMinor: number;
      product?: {
        catalogKind: 'SIMPLE' | 'BUNDLE';
        images: { url: string }[];
        bundleItems: {
          quantity: number;
          includedProduct: { name: string; slug: string };
        }[];
      };
    }[];
  },
  availability?: Map<string, number>
): StorefrontCart {
  return {
    id: cart.id,
    currency: cart.currency,
    subtotalMinor: cart.subtotalMinor,
    discountAmount: cart.discountAmount,
    taxAmount: cart.taxAmount,
    shippingAmount: cart.shippingAmount,
    totalMinor: cart.totalMinor,
    itemCount: cart.items.reduce((s, i) => s + i.quantity, 0),
    couponCode: (cart as { couponCode?: string | null }).couponCode ?? null,
    items: cart.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      variantId: i.variantId,
      productName: i.productName,
      variantName: i.variantName,
      sku: i.sku,
      quantity: i.quantity,
      unitPriceMinor: i.unitPriceMinor,
      subtotalMinor: i.subtotalMinor,
      available: availability?.get(i.variantId) ?? 0,
      imageUrl: i.product?.images[0]?.url ?? null,
      catalogKind: i.product?.catalogKind ?? 'SIMPLE',
      bundleItems:
        i.product?.catalogKind === 'BUNDLE'
          ? i.product.bundleItems.map((b) => ({
              name: b.includedProduct.name,
              slug: b.includedProduct.slug,
              quantity: b.quantity,
            }))
          : undefined,
    })),
  };
}

const cartWithItemsInclude = {
  items: {
    include: {
      product: {
        select: {
          catalogKind: true,
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
          bundleItems: {
            orderBy: { position: 'asc' as const },
            select: {
              quantity: true,
              includedProduct: { select: { name: true, slug: true } },
            },
          },
        },
      },
    },
  },
} as const;

async function mapCartById(cartId: string) {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: cartWithItemsInclude,
  });
  if (!cart) throw new StorefrontError('Cart not found', 'NOT_FOUND');
  return mapCart(cart);
}

async function recalculateStorefrontCart(tx: Tx, cartId: string, taxRateBps: number) {
  const cart = await tx.cart.findUnique({
    where: { id: cartId },
    include: { items: true },
  });
  if (!cart) throw new StorefrontError('Cart not found', 'NOT_FOUND');

  const lineInputs = cart.items.map((i) => ({
    unitPriceMinor: i.unitPriceMinor,
    quantity: i.quantity,
    discountAmount: i.discountAmount,
  }));

  let discountAmount = 0;
  if (cart.discountType && cart.discountValue != null) {
    const sub = lineInputs.reduce(
      (s, l) => s + l.unitPriceMinor * l.quantity - (l.discountAmount ?? 0),
      0
    );
    discountAmount =
      cart.discountType === 'PERCENT'
        ? Math.round((sub * cart.discountValue) / 10000)
        : cart.discountValue;
    discountAmount = Math.min(discountAmount, sub);
  } else {
    discountAmount = cart.discountAmount;
  }

  const totals = calculateOrderTotals({
    lines: lineInputs,
    discountAmount,
    taxRateBps,
    shippingAmount: cart.shippingAmount,
  });

  return tx.cart.update({
    where: { id: cartId },
    data: {
      subtotalMinor: totals.subtotalMinor,
      discountAmount: totals.discountAmount,
      taxAmount: totals.taxAmount,
      totalMinor: totals.totalMinor,
      taxRateBps,
    },
    include: { items: true },
  });
}

export async function listStorefrontProducts(
  storeId: string,
  organizationId: string,
  params: { search?: string; categorySlug?: string; page?: number; pageSize?: number } = {}
) {
  const page = params.page ?? 1;
  const pageSize = Math.min(params.pageSize ?? 24, 48);
  const skip = (page - 1) * pageSize;

  const branch = await getDefaultBranch(storeId);
  const loc = await ensureDefaultStockLocation(organizationId, storeId, branch.id, 'Branch');

  let categoryId: string | undefined;
  if (params.categorySlug) {
    const cat = await prisma.category.findFirst({
      where: { organizationId, slug: params.categorySlug, deletedAt: null },
    });
    categoryId = cat?.id;
    if (!cat) return { items: [] as StorefrontProductListItem[], total: 0, page, pageSize };
  }

  const where: Prisma.ProductWhereInput = {
    organizationId,
    deletedAt: null,
    status: 'ACTIVE',
    OR: [{ storeId }, { storeId: null }],
    ...(categoryId && { categoryId }),
    ...(params.search && {
      OR: [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
        { variants: { some: { sku: { contains: params.search, mode: 'insensitive' } } } },
      ],
    }),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true, slug: true } },
        images: { orderBy: { position: 'asc' }, take: 2, select: { url: true } },
        variants: {
          where: { deletedAt: null, status: 'ACTIVE' },
          include: { stockLevels: { where: { stockLocationId: loc.id } } },
          orderBy: { position: 'asc' },
        },
      },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }, { name: 'asc' }],
      skip,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  const items: StorefrontProductListItem[] = products
    .filter((p) => p.variants.length > 0)
    .map((p) => {
      const v = p.variants.find((x) => x.isDefault) || p.variants[0];
      const level = v.stockLevels[0];
      const available = p.trackInventory
        ? level
          ? computeAvailable(level.quantityOnHand, level.quantityReserved)
          : 0
        : 999;
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        imageUrl: p.images[0]?.url ?? null,
        secondaryImageUrl: p.images[1]?.url ?? null,
        defaultVariantId: v.id,
        categoryName: p.category?.name ?? null,
        categorySlug: p.category?.slug ?? null,
        catalogKind: p.catalogKind,
        isFeatured: p.isFeatured,
        priceMinor: v.sellingPrice,
        compareAtPriceMinor: v.compareAtPrice,
        currency: v.currency,
        available,
        inStock: !p.trackInventory || available > 0,
        variantCount: p.variants.length,
      };
    });

  return { items, total, page, pageSize };
}

export async function listStorefrontCatalogSections(
  storeId: string,
  organizationId: string,
  params: { search?: string; limitPerSection?: number } = {}
) {
  const [categories, productsResult] = await Promise.all([
    listStorefrontCategories(storeId, organizationId),
    listStorefrontProducts(storeId, organizationId, {
      search: params.search,
      pageSize: 200,
    }),
  ]);

  const sections = buildCatalogSections(categories, productsResult.items, {
    limitPerSection: params.limitPerSection,
  });

  return {
    sections,
    total: productsResult.total,
    categories,
    products: productsResult.items,
  };
}

export async function listStorefrontFeaturedProducts(
  storeId: string,
  organizationId: string,
  limit = 8
) {
  const { items } = await listStorefrontProducts(storeId, organizationId, { pageSize: 48 });
  const featured = items.filter((p) => p.isFeatured);
  if (featured.length >= 3) return featured.slice(0, limit);
  return items.slice(0, limit);
}

export async function getStorefrontProduct(
  storeId: string,
  organizationId: string,
  productSlug: string
): Promise<StorefrontProductDetail> {
  const branch = await getDefaultBranch(storeId);
  const loc = await ensureDefaultStockLocation(organizationId, storeId, branch.id, 'Branch');

  const product = await prisma.product.findFirst({
    where: {
      organizationId,
      slug: productSlug,
      deletedAt: null,
      status: 'ACTIVE',
      OR: [{ storeId }, { storeId: null }],
    },
    include: {
      category: { select: { name: true, slug: true } },
      images: { orderBy: { position: 'asc' } },
      options: {
        include: { option: { include: { values: { orderBy: { position: 'asc' } } } } },
        orderBy: { position: 'asc' },
      },
      variants: {
        where: { deletedAt: null, status: 'ACTIVE' },
        include: {
          stockLevels: { where: { stockLocationId: loc.id } },
          optionValues: { include: { optionValue: { include: { option: true } } } },
        },
        orderBy: { position: 'asc' },
      },
      bundleItems: {
        orderBy: { position: 'asc' },
        include: {
          includedProduct: { select: { id: true, name: true, slug: true, catalogKind: true } },
        },
      },
    },
  });

  if (!product || !product.variants.length) {
    throw new StorefrontError('Product not found', 'PRODUCT_NOT_FOUND');
  }

  await emitStorefrontEvent({
    type: 'PRODUCT_VIEWED',
    organizationId,
    storeId,
    productId: product.id,
    payload: { slug: product.slug },
  });

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    brand: product.brand,
    categoryName: product.category?.name ?? null,
    categorySlug: product.category?.slug ?? null,
    catalogKind: product.catalogKind,
    images: product.images.map((img) => ({ url: img.url, alt: img.altText })),
    options: product.options.map((o) => ({
      name: o.option.name,
      values: o.option.values.map((v) => v.value),
    })),
    bundleItems: product.bundleItems.map((item) => ({
      productId: item.includedProduct.id,
      name: item.includedProduct.name,
      slug: item.includedProduct.slug,
      quantity: item.quantity,
    })),
    variants: product.variants.map((v) => {
      const level = v.stockLevels[0];
      const available = product.trackInventory
        ? level
          ? computeAvailable(level.quantityOnHand, level.quantityReserved)
          : 0
        : 999;
      return {
        id: v.id,
        name: v.name,
        sku: v.sku,
        priceMinor: v.sellingPrice,
        compareAtPriceMinor: v.compareAtPrice,
        currency: v.currency,
        available,
        inStock: !product.trackInventory || available > 0,
        optionValues: v.optionValues.map((ov) => ({
          option: ov.optionValue.option.name,
          value: ov.optionValue.value,
        })),
      };
    }),
  };
}

export async function listStorefrontCategories(storeId: string, organizationId: string) {
  const categories = await prisma.category.findMany({
    where: {
      organizationId,
      deletedAt: null,
      parentId: null,
      OR: [{ storeId }, { storeId: null }],
    },
    include: {
      _count: {
        select: {
          products: {
            where: { deletedAt: null, status: 'ACTIVE', OR: [{ storeId }, { storeId: null }] },
          },
        },
      },
    },
    orderBy: { position: 'asc' },
  });

  return categories.map(
    (c): StorefrontCategory => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      imageUrl: (c as { imageUrl?: string | null }).imageUrl ?? null,
      productCount: c._count.products,
    })
  );
}

export async function getShippingMethodsForStore(
  storeId: string,
  organizationId: string
): Promise<ShippingMethodView[]> {
  const methods = await ensureDefaultShippingMethods(organizationId, storeId);
  return methods
    .filter((m) => m.isActive)
    .map((m) => ({
      id: m.id,
      name: m.name,
      slug: m.slug,
      description: m.description,
      priceMinor: m.priceMinor,
      estimatedDelivery: m.estimatedDelivery,
    }));
}

export async function getOrCreateGuestCart(
  store: { id: string; organizationId: string; currency: string | null; taxRateBps: number },
  guestSessionToken: string
): Promise<StorefrontCart> {
  const branch = await getDefaultBranch(store.id);
  const currency = store.currency || 'USD';

  const existing = await prisma.cart.findFirst({
    where: {
      storeId: store.id,
      organizationId: store.organizationId,
      guestSessionToken,
      channel: 'ONLINE',
      status: 'ACTIVE',
    },
    include: cartWithItemsInclude,
  });

  if (existing) return mapCart(existing);

  const cart = await prisma.cart.create({
    data: {
      organizationId: store.organizationId,
      storeId: store.id,
      branchId: branch.id,
      channel: 'ONLINE',
      guestSessionToken,
      currency,
      status: 'ACTIVE',
      taxRateBps: store.taxRateBps,
    },
    include: cartWithItemsInclude,
  });

  return mapCart(cart);
}

export async function addToStorefrontCart(
  store: { id: string; organizationId: string; taxRateBps: number },
  guestSessionToken: string,
  input: { variantId: string; quantity?: number }
) {
  const qty = input.quantity ?? 1;
  if (qty <= 0) throw new StorefrontError('Invalid quantity', 'VALIDATION_ERROR');

  const variant = await prisma.productVariant.findFirst({
    where: {
      id: input.variantId,
      organizationId: store.organizationId,
      deletedAt: null,
      status: 'ACTIVE',
      product: { deletedAt: null, status: 'ACTIVE', OR: [{ storeId: store.id }, { storeId: null }] },
    },
    include: { product: true },
  });
  if (!variant) throw new StorefrontError('Product not found', 'PRODUCT_NOT_FOUND');

  const cartView = await getOrCreateGuestCart(
    { ...store, currency: variant.currency },
    guestSessionToken
  );

  const updated = await prisma.$transaction(async (tx) => {
    const existingItem = await tx.cartItem.findFirst({
      where: { cartId: cartView.id, variantId: variant.id },
    });

    if (existingItem) {
      await tx.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + qty,
          subtotalMinor: (existingItem.quantity + qty) * existingItem.unitPriceMinor,
        },
      });
    } else {
      await tx.cartItem.create({
        data: {
          cartId: cartView.id,
          productId: variant.productId,
          variantId: variant.id,
          productName: variant.product.name,
          variantName: variant.name,
          sku: variant.sku,
          quantity: qty,
          unitPriceMinor: variant.sellingPrice,
          subtotalMinor: variant.sellingPrice * qty,
        },
      });
    }

    return recalculateStorefrontCart(tx, cartView.id, store.taxRateBps);
  });

  await emitStorefrontEvent({
    type: 'PRODUCT_ADDED_TO_CART',
    organizationId: store.organizationId,
    storeId: store.id,
    productId: variant.productId,
    payload: { variantId: variant.id, quantity: qty },
  });

  return mapCartById(updated.id);
}

export async function updateStorefrontCartItem(
  store: { id: string; organizationId: string; taxRateBps: number },
  guestSessionToken: string,
  itemId: string,
  quantity: number
) {
  const cart = await prisma.cart.findFirst({
    where: {
      storeId: store.id,
      organizationId: store.organizationId,
      guestSessionToken,
      channel: 'ONLINE',
      status: 'ACTIVE',
    },
  });
  if (!cart) throw new StorefrontError('Cart not found', 'NOT_FOUND');

  const updated = await prisma.$transaction(async (tx) => {
    const item = await tx.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) throw new StorefrontError('Item not found', 'NOT_FOUND');

    if (quantity <= 0) {
      await tx.cartItem.delete({ where: { id: itemId } });
    } else {
      await tx.cartItem.update({
        where: { id: itemId },
        data: { quantity, subtotalMinor: quantity * item.unitPriceMinor },
      });
    }

    return recalculateStorefrontCart(tx, cart.id, store.taxRateBps);
  });

  await emitStorefrontEvent({
    type: 'cart_updated',
    organizationId: store.organizationId,
    storeId: store.id,
    payload: { itemId, quantity },
  });

  return mapCartById(updated.id);
}

export async function applyStorefrontCoupon(
  store: { id: string; organizationId: string; taxRateBps: number },
  guestSessionToken: string,
  code: string
) {
  const cart = await prisma.cart.findFirst({
    where: {
      storeId: store.id,
      organizationId: store.organizationId,
      guestSessionToken,
      channel: 'ONLINE',
      status: 'ACTIVE',
    },
  });
  if (!cart) throw new StorefrontError('Cart not found', 'NOT_FOUND');

  const { cart: updated } = await applyCouponToCart({
    cartId: cart.id,
    organizationId: store.organizationId,
    code,
    customerId: cart.customerId ?? undefined,
    storeId: store.id,
  });

  const recalculated = await prisma.$transaction((tx) =>
    recalculateStorefrontCart(tx, updated.id, store.taxRateBps)
  );

  return mapCartById(recalculated.id);
}

export async function removeStorefrontCoupon(
  store: { id: string; organizationId: string; taxRateBps: number },
  guestSessionToken: string
) {
  const cart = await prisma.cart.findFirst({
    where: {
      storeId: store.id,
      organizationId: store.organizationId,
      guestSessionToken,
      channel: 'ONLINE',
      status: 'ACTIVE',
    },
  });
  if (!cart) throw new StorefrontError('Cart not found', 'NOT_FOUND');

  await prisma.cart.update({
    where: { id: cart.id },
    data: {
      couponCode: null,
      promotionId: null,
      discountType: null,
      discountValue: null,
      discountAmount: 0,
    },
  });

  const recalculated = await prisma.$transaction((tx) =>
    recalculateStorefrontCart(tx, cart.id, store.taxRateBps)
  );

  return mapCartById(recalculated.id);
}

export async function setCartShipping(
  store: { id: string; organizationId: string; taxRateBps: number },
  guestSessionToken: string,
  shippingMethodId: string
) {
  const cart = await prisma.cart.findFirst({
    where: {
      storeId: store.id,
      organizationId: store.organizationId,
      guestSessionToken,
      channel: 'ONLINE',
      status: 'ACTIVE',
    },
  });
  if (!cart) throw new StorefrontError('Cart not found', 'NOT_FOUND');

  const method = await prisma.shippingMethod.findFirst({
    where: { id: shippingMethodId, storeId: store.id, isActive: true },
  });
  if (!method) throw new StorefrontError('Shipping method not found', 'NOT_FOUND');

  const updated = await prisma.$transaction(async (tx) => {
    await tx.cart.update({
      where: { id: cart.id },
      data: { shippingAmount: method.priceMinor },
    });
    return recalculateStorefrontCart(tx, cart.id, store.taxRateBps);
  });

  return mapCartById(updated.id);
}

export async function checkoutOnline(
  store: {
    id: string;
    organizationId: string;
    name: string;
    currency: string | null;
    taxRateBps: number;
    status: string;
  },
  guestSessionToken: string,
  input: CheckoutInput
) {
  if (store.status !== 'ACTIVE') {
    throw new StorefrontError('Store is not accepting orders', 'STORE_UNAVAILABLE');
  }

  const branch = await getDefaultBranch(store.id);
  const currency = store.currency || 'USD';
  const ownerUserId = await getOrgOwnerUserId(store.organizationId);

  const customer = await findOrCreateCustomerFromCheckout(store.organizationId, {
    name: input.fullName,
    email: input.email,
    phone: input.phone,
    source: 'ONLINE_STORE',
    userId: ownerUserId,
  });

  if (input.idempotencyKey) {
    const existing = await prisma.order.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { items: true, payments: true },
    });
    if (existing) return existing;
  }

  await emitStorefrontEvent({
    type: 'CHECKOUT_STARTED',
    organizationId: store.organizationId,
    storeId: store.id,
    payload: { cartToken: guestSessionToken },
  });

  const accessToken = randomUUID();

  const result = await prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findFirst({
      where: {
        storeId: store.id,
        organizationId: store.organizationId,
        guestSessionToken,
        channel: 'ONLINE',
        status: 'ACTIVE',
      },
      include: { items: true },
    });
    if (!cart) throw new StorefrontError('Cart not found', 'NOT_FOUND');
    if (!cart.items.length) throw new StorefrontError('Cart is empty', 'VALIDATION_ERROR');

    const shippingMethod = await tx.shippingMethod.findFirst({
      where: { id: input.shippingMethodId, storeId: store.id, isActive: true },
    });
    if (!shippingMethod) throw new StorefrontError('Invalid shipping', 'VALIDATION_ERROR');

    const loc = await ensureDefaultStockLocation(
      store.organizationId,
      store.id,
      branch.id,
      'Branch',
      tx
    );

    for (const item of cart.items) {
      const variant = await tx.productVariant.findFirst({
        where: { id: item.variantId, organizationId: store.organizationId },
        include: { product: true, stockLevels: { where: { stockLocationId: loc.id } } },
      });
      if (!variant || variant.product.status !== 'ACTIVE') {
        throw new StorefrontError('A product is no longer available', 'PRODUCT_UNAVAILABLE');
      }
      if (variant.sellingPrice !== item.unitPriceMinor) {
        throw new StorefrontError('Price has changed — refresh your cart', 'PRICE_CHANGED');
      }
      if (variant.product.trackInventory) {
        const level = variant.stockLevels[0];
        const available = level
          ? computeAvailable(level.quantityOnHand, level.quantityReserved)
          : 0;
        if (available < item.quantity) {
          throw new StorefrontError('Insufficient stock', 'INSUFFICIENT_STOCK');
        }
      }
    }

    const shippingAmount = shippingMethod.priceMinor;
    await tx.cart.update({ where: { id: cart.id }, data: { shippingAmount } });

    const lineInputs = cart.items.map((i) => ({
      unitPriceMinor: i.unitPriceMinor,
      quantity: i.quantity,
      discountAmount: i.discountAmount,
    }));

    const totals = calculateOrderTotals({
      lines: lineInputs,
      discountAmount: cart.discountAmount,
      taxRateBps: store.taxRateBps,
      shippingAmount,
    });

    const orderNumber = await generateOrderNumber(store.organizationId, tx);
    const now = new Date();

    const shippingAddress = {
      fullName: input.fullName,
      address: input.address,
      city: input.city,
      country: input.country,
    };

    const order = await tx.order.create({
      data: {
        organizationId: store.organizationId,
        storeId: store.id,
        branchId: branch.id,
        cartId: cart.id,
        customerId: customer.id,
        orderNumber,
        source: 'ONLINE',
        status: 'PENDING',
        paymentStatus: 'PENDING',
        fulfillmentStatus: 'UNFULFILLED',
        currency,
        subtotalMinor: totals.subtotalMinor,
        discountType: cart.discountType,
        discountValue: cart.discountValue,
        discountAmount: totals.discountAmount,
        couponCode: cart.couponCode,
        promotionId: cart.promotionId,
        campaignId: cart.campaignId,
        taxRateBps: store.taxRateBps,
        taxAmount: totals.taxAmount,
        shippingAmount: totals.shippingAmount,
        totalMinor: totals.totalMinor,
        customerName: input.fullName,
        guestEmail: input.email,
        guestPhone: input.phone,
        shippingAddress,
        accessToken,
        notes: input.notes,
        idempotencyKey: input.idempotencyKey,
        items: {
          create: cart.items.map((i) => {
            const line = calculateOrderTotals({
              lines: [{ unitPriceMinor: i.unitPriceMinor, quantity: i.quantity }],
              taxRateBps: 0,
            });
            return {
              productId: i.productId,
              variantId: i.variantId,
              productName: i.productName,
              variantName: i.variantName,
              sku: i.sku,
              quantity: i.quantity,
              unitPriceMinor: i.unitPriceMinor,
              discountAmount: i.discountAmount,
              taxAmount: 0,
              subtotalMinor: line.subtotalMinor,
              totalMinor: line.totalMinor,
            };
          }),
        },
        adjustments: {
          create: [
            ...(totals.discountAmount > 0
              ? [
                  {
                    type: 'DISCOUNT' as const,
                    label: cart.couponCode ? `Coupon ${cart.couponCode}` : 'Discount',
                    amountMinor: -totals.discountAmount,
                  },
                ]
              : []),
            ...(totals.taxAmount > 0
              ? [{ type: 'TAX' as const, label: 'Tax', amountMinor: totals.taxAmount }]
              : []),
            ...(totals.shippingAmount > 0
              ? [
                  {
                    type: 'SHIPPING' as const,
                    label: shippingMethod.name,
                    amountMinor: totals.shippingAmount,
                  },
                ]
              : []),
          ],
        },
      },
      include: { items: true },
    });

    for (const item of cart.items) {
      const variant = await tx.productVariant.findFirst({ where: { id: item.variantId } });
      if (variant?.trackInventory) {
        await adjustStockInTx(tx, {
          organizationId: store.organizationId,
          userId: ownerUserId,
          variantId: item.variantId,
          stockLocationId: loc.id,
          quantityDelta: -item.quantity,
          type: 'SALE',
          reason: `Online order ${orderNumber}`,
          referenceType: 'Order',
          referenceId: order.id,
        });
      }
    }

    await createPayment(
      {
        organizationId: store.organizationId,
        storeId: store.id,
        branchId: branch.id,
        orderId: order.id,
        userId: ownerUserId,
        method: 'COD',
        amountMinor: totals.totalMinor,
        currency,
        status: 'PENDING',
        idempotencyKey: input.idempotencyKey ? `${input.idempotencyKey}-pay` : undefined,
        reference: 'Cash on delivery',
      },
      tx
    );

    await tx.order.update({
      where: { id: order.id },
      data: { paymentStatus: 'PENDING', paidMinor: 0 },
    });

    await tx.cart.update({
      where: { id: cart.id },
      data: { status: 'COMPLETED', completedAt: now },
    });

    await recordOrderEvent(tx, {
      organizationId: store.organizationId,
      orderId: order.id,
      userId: ownerUserId,
      eventType: 'order.created',
      metadata: { source: 'ONLINE', orderNumber },
    });

    await logAudit(
      {
        organizationId: store.organizationId,
        userId: ownerUserId,
        action: 'ORDER_CREATED',
        entityType: 'Order',
        entityId: order.id,
        metadata: { orderNumber, totalMinor: totals.totalMinor, source: 'ONLINE' },
      },
      tx
    );

    return order;
  });

  await emitOrderEvent({
    type: 'order.created',
    organizationId: store.organizationId,
    orderId: result.id,
    payload: { orderNumber: result.orderNumber, source: 'ONLINE' },
  });

  await emitStorefrontEvent({
    type: 'ORDER_COMPLETED',
    organizationId: store.organizationId,
    storeId: store.id,
    orderId: result.id,
    payload: { orderNumber: result.orderNumber, revenueMinor: result.totalMinor },
  });

  if (result.customerId) {
    const { recordOrderCustomerActivity } = await import('@/server/services/customer-service');
    await recordOrderCustomerActivity({
      organizationId: store.organizationId,
      customerId: result.customerId,
      orderId: result.id,
      orderNumber: result.orderNumber,
      eventType: 'ORDER_COMPLETED',
      userId: ownerUserId,
      storeId: store.id,
      source: 'ONLINE_STORE',
      totalMinor: result.totalMinor,
      currency: result.currency,
    });
  }

  if (result.promotionId && result.discountAmount > 0) {
    const coupon = result.couponCode
      ? await prisma.marketingCoupon.findFirst({
          where: { organizationId: store.organizationId, code: result.couponCode },
        })
      : null;
    await recordPromotionRedemption({
      organizationId: store.organizationId,
      promotionId: result.promotionId,
      couponId: coupon?.id,
      orderId: result.id,
      customerId: result.customerId ?? undefined,
      discountMinor: result.discountAmount,
      userId: ownerUserId,
    });
  }

  if (result.campaignId) {
    await attributeOrderToCampaign({
      organizationId: store.organizationId,
      orderId: result.id,
      customerId: result.customerId ?? undefined,
      revenueMinor: result.totalMinor,
      campaignId: result.campaignId,
      promotionId: result.promotionId ?? undefined,
      couponCode: result.couponCode ?? undefined,
    });
  }

  return result;
}

export async function getPublicOrder(
  publicSlug: string,
  orderNumber: string,
  accessToken: string
): Promise<PublicOrderView> {
  const store = await resolveStoreByPublicSlug(publicSlug);

  const order = await prisma.order.findFirst({
    where: {
      orderNumber,
      storeId: store.id,
      organizationId: store.organizationId,
      source: 'ONLINE',
      accessToken,
    },
    include: {
      items: true,
      payments: { orderBy: { createdAt: 'asc' }, take: 1 },
    },
  });

  if (!order) throw new StorefrontError('Order not found', 'ORDER_NOT_FOUND');

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    currency: order.currency,
    subtotalMinor: order.subtotalMinor,
    discountAmount: order.discountAmount,
    taxAmount: order.taxAmount,
    shippingAmount: order.shippingAmount,
    totalMinor: order.totalMinor,
    customerName: order.customerName,
    guestEmail: order.guestEmail,
    guestPhone: order.guestPhone,
    shippingAddress: order.shippingAddress as Record<string, string> | null,
    paymentMethod: order.payments[0]?.method ?? 'COD',
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((i) => ({
      productName: i.productName,
      variantName: i.variantName,
      sku: i.sku,
      quantity: i.quantity,
      unitPriceMinor: i.unitPriceMinor,
      subtotalMinor: i.subtotalMinor,
    })),
  };
}
