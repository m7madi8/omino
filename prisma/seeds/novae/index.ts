import bcrypt from 'bcryptjs';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { ensurePermissions } from '@/server/services/organization-service';
import {
  PERMISSIONS,
  ROLE_PERMISSION_MAP,
  type SystemRoleSlug,
} from '@/lib/permissions/constants';
import { createProduct } from '@/server/services/product-service';
import { createCategory } from '@/server/services/category-service';
import { createCustomer } from '@/server/services/customer-service';
import { createCollection } from '@/server/services/collection-service';
import { createAutomation } from '@/server/automation/automation-service';
import { createCampaign } from '@/server/services/marketing/campaign-service';
import { createPromotion } from '@/server/services/marketing/promotion-service';
import { createAudience } from '@/server/services/marketing/audience-service';
import { ensureDefaultStockLocation } from '@/server/services/inventory-service';
import { ensureDefaultRegister } from '@/server/services/pos-service';
import {
  calculateLineTotals,
  calculateOrderTotals,
  generateOrderNumber,
} from '@/server/services/order-service';
import { NOVAE, type NovaeContext } from './constants';
import { NOVAE_CATEGORIES, NOVAE_COLLECTIONS, NOVAE_PRODUCTS } from './catalog-data';
import { NOVAE_CUSTOMERS, PS_CITIES } from './customers-data';
import { buildNovaeStoreExperience } from './store-experience';
import { NOVAE_IMAGES, pickImages } from './images';

export type NovaeSeedStats = {
  products: number;
  categories: number;
  collections: number;
  customers: number;
  orders: number;
  posOrders: number;
  campaigns: number;
  automations: number;
};

async function createOrgRoles(tx: Prisma.TransactionClient, organizationId: string) {
  const allPerms = await tx.permission.findMany();
  const permByKey = Object.fromEntries(allPerms.map((p) => [p.key, p.id]));
  let ownerRoleId: string | null = null;

  for (const roleSlug of Object.keys(ROLE_PERMISSION_MAP) as SystemRoleSlug[]) {
    const role = await tx.role.upsert({
      where: { organizationId_slug: { organizationId, slug: roleSlug } },
      create: {
        organizationId,
        name: roleSlug.charAt(0) + roleSlug.slice(1).toLowerCase(),
        slug: roleSlug,
        isSystem: true,
      },
      update: {},
    });
    if (roleSlug === 'OWNER') ownerRoleId = role.id;
    await tx.rolePermission.createMany({
      data: ROLE_PERMISSION_MAP[roleSlug]
        .filter((k) => permByKey[k])
        .map((k) => ({ roleId: role.id, permissionId: permByKey[k] })),
      skipDuplicates: true,
    });
  }
  return ownerRoleId;
}

async function seedFoundation(): Promise<NovaeContext> {
  await ensurePermissions();

  const passwordHash = await bcrypt.hash(NOVAE.PASSWORD, 12);
  const user = await prisma.user.upsert({
    where: { email: NOVAE.USER_EMAIL },
    create: {
      email: NOVAE.USER_EMAIL,
      passwordHash,
      fullName: 'NOVAÉ Demo',
      phone: '+970599000100',
    },
    update: { passwordHash, fullName: 'NOVAÉ Demo' },
  });

  let org = await prisma.organization.findUnique({ where: { slug: NOVAE.ORG_SLUG } });

  if (!org) {
    org = await prisma.$transaction(
      async (tx) => {
        const created = await tx.organization.create({
          data: {
            name: NOVAE.ORG_NAME,
            slug: NOVAE.ORG_SLUG,
            businessType: 'retail',
            country: NOVAE.COUNTRY,
            currency: NOVAE.CURRENCY,
            locale: NOVAE.LOCALE,
            merchantExperienceMode: 'standard',
          },
        });

        const ownerRoleId = await createOrgRoles(tx, created.id);
        if (!ownerRoleId) throw new Error('OWNER_ROLE_MISSING');

        await tx.membership.upsert({
          where: { userId_organizationId: { userId: user.id, organizationId: created.id } },
          create: { userId: user.id, organizationId: created.id, roleId: ownerRoleId },
          update: { roleId: ownerRoleId },
        });

        const store = await tx.store.create({
          data: {
            organizationId: created.id,
            name: 'NOVAÉ',
            slug: NOVAE.STORE_SLUG,
            publicSlug: NOVAE.STORE_PUBLIC_SLUG,
            isDefault: true,
            status: 'ACTIVE',
            description: 'Contemporary essentials, curated for everyday life.',
            currency: NOVAE.CURRENCY,
            country: NOVAE.COUNTRY,
            timezone: NOVAE.TIMEZONE,
            contactEmail: 'hello@novae.demo.omino.test',
            contactPhone: '+970599123456',
            logoUrl: NOVAE_IMAGES.logo,
            faviconUrl: NOVAE_IMAGES.favicon,
            primaryColor: '#1A1A1A',
            secondaryColor: '#EDE8E2',
            socialLinks: {
              instagram: 'https://instagram.com/novae.demo',
              whatsapp: '+970599123456',
            },
            taxRateBps: 0,
            themeSettings: buildNovaeStoreExperience() as Prisma.InputJsonValue,
          },
        });

        const branch = await tx.branch.create({
          data: {
            storeId: store.id,
            name: 'الفرع الرئيسي',
            slug: 'main',
            isDefault: true,
            address: 'Ramallah, Palestine',
          },
        });

        const loc = await ensureDefaultStockLocation(
          created.id,
          store.id,
          branch.id,
          branch.name,
          tx
        );
        const register = await ensureDefaultRegister(created.id, store.id, branch.id, tx);

        const zones = [
          { name: 'رام الله', slug: 'ramallah', priceMinor: 1500 },
          { name: 'نابلس', slug: 'nablus', priceMinor: 2000 },
          { name: 'الخليل', slug: 'hebron', priceMinor: 2500 },
          { name: 'بيت لحم', slug: 'bethlehem', priceMinor: 2000 },
          { name: 'القدس', slug: 'jerusalem', priceMinor: 2000 },
          { name: 'طولكرم', slug: 'tulkarm', priceMinor: 2000 },
        ];
        await tx.shippingMethod.createMany({
          data: zones.map((z, i) => ({
            organizationId: created.id,
            storeId: store.id,
            name: z.name,
            slug: z.slug,
            priceMinor: z.priceMinor,
            isActive: true,
            position: i,
            estimatedDelivery: '1-2 أيام',
          })),
          skipDuplicates: true,
        });

        await tx.userContext.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            organizationId: created.id,
            storeId: store.id,
            branchId: branch.id,
          },
          update: {
            organizationId: created.id,
            storeId: store.id,
            branchId: branch.id,
          },
        });

        return { org: created, store, branch, loc, register };
      },
      { timeout: 120_000 }
    ).then((r) => r.org);
  }

  if (!org) throw new Error('NOVAE_ORG_FAILED');
  const novaeOrg = org;

  const store = await prisma.store.findFirstOrThrow({
    where: { organizationId: novaeOrg.id, slug: NOVAE.STORE_SLUG },
  });
  const branch = await prisma.branch.findFirstOrThrow({
    where: { storeId: store.id, isDefault: true },
  });
  const loc = await ensureDefaultStockLocation(novaeOrg.id, store.id, branch.id, branch.name);
  const register = await ensureDefaultRegister(novaeOrg.id, store.id, branch.id);

  const ownerRole = await prisma.role.findFirst({
    where: { organizationId: novaeOrg.id, slug: 'OWNER' },
  });
  if (ownerRole) {
    await prisma.membership.upsert({
      where: { userId_organizationId: { userId: user.id, organizationId: novaeOrg.id } },
      create: { userId: user.id, organizationId: novaeOrg.id, roleId: ownerRole.id },
      update: { roleId: ownerRole.id },
    });
  }

  await prisma.userContext.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      organizationId: novaeOrg.id,
      storeId: store.id,
      branchId: branch.id,
    },
    update: { organizationId: novaeOrg.id, storeId: store.id, branchId: branch.id },
  });

  await prisma.store.update({
    where: { id: store.id },
    data: {
      name: 'NOVAÉ',
      description: 'Contemporary essentials, curated for everyday life. اختيارات عصرية صُممت لترافق تفاصيل يومك.',
      logoUrl: NOVAE_IMAGES.logo,
      faviconUrl: NOVAE_IMAGES.favicon,
      primaryColor: '#1A1A1A',
      secondaryColor: '#EDE8E2',
      contactEmail: 'hello@novae.demo.omino.test',
      contactPhone: '+970599123456',
      currency: NOVAE.CURRENCY,
      country: NOVAE.COUNTRY,
      timezone: NOVAE.TIMEZONE,
      socialLinks: {
        instagram: 'https://instagram.com/novae.demo',
        whatsapp: '+970599123456',
      },
      themeSettings: buildNovaeStoreExperience() as Prisma.InputJsonValue,
    },
  });

  const categoryIds: Record<string, string> = {};
  for (const cat of NOVAE_CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: { organizationId: novaeOrg.id, slug: cat.slug },
    });
    if (existing) {
      categoryIds[cat.slug] = existing.id;
    } else {
      const created = await createCategory(novaeOrg.id, user.id, {
        name: cat.name,
        description: cat.nameAr,
        storeId: store.id,
      });
      categoryIds[cat.slug] = created.id;
      await prisma.category.update({
        where: { id: created.id },
        data: { slug: cat.slug, position: cat.position },
      });
    }
  }

  return {
    organizationId: novaeOrg.id,
    storeId: store.id,
    branchId: branch.id,
    userId: user.id,
    stockLocationId: loc.id,
    registerId: register.id,
    categoryIds,
  };
}

async function seedProducts(ctx: NovaeContext): Promise<number> {
  const existingCount = await prisma.product.count({
    where: {
      organizationId: ctx.organizationId,
      metadata: { path: ['demoSeed'], equals: NOVAE.DEMO_MARKER },
    },
  });
  if (existingCount >= NOVAE_PRODUCTS.length) {
    console.log(`  Products already seeded (${existingCount})`);
    return existingCount;
  }

  let created = 0;
  const catalogCtx = {
    organizationId: ctx.organizationId,
    userId: ctx.userId,
    storeId: ctx.storeId,
    branchId: ctx.branchId,
    currency: NOVAE.CURRENCY,
  };

  for (let i = 0; i < NOVAE_PRODUCTS.length; i++) {
    const def = NOVAE_PRODUCTS[i]!;
    const exists = await prisma.productVariant.findFirst({
      where: {
        organizationId: ctx.organizationId,
        deletedAt: null,
        OR: [{ sku: def.sku }, { sku: { startsWith: `${def.sku}-` } }],
      },
    });
    if (exists) continue;

    const imageCategory = (
      ['clothing', 'bags', 'accessories', 'beauty', 'home', 'lifestyle'] as const
    ).includes(def.category as 'clothing')
      ? (def.category as 'clothing' | 'bags' | 'accessories' | 'beauty' | 'home' | 'lifestyle')
      : 'lifestyle';
    const imageUrls = pickImages(imageCategory, i, 3);

    const product = await createProduct(catalogCtx, {
      name: def.name,
      description: def.description,
      categoryId: ctx.categoryIds[def.category],
      status: def.status,
      isFeatured: def.isFeatured ?? false,
      brand: NOVAE.BRAND,
      sellingPrice: def.sellingPrice,
      compareAtPrice: def.compareAtPrice,
      costPrice: def.costPrice,
      sku: def.variants?.length ? undefined : def.sku,
      initialStock: def.variants?.length ? undefined : def.initialStock,
      lowStockThreshold: def.lowStockThreshold,
      stockLocationId: ctx.stockLocationId,
      currency: NOVAE.CURRENCY,
      options: def.options,
      variants: def.variants?.map((v) => ({
        ...v,
        costPrice: def.costPrice,
        compareAtPrice: v.compareAtPrice ?? def.compareAtPrice,
      })),
      images: imageUrls.map((url, idx) => ({
        url,
        altText: def.name,
        isPrimary: idx === 0,
      })),
    });

    await prisma.product.update({
      where: { id: product.product.id },
      data: {
        metadata: {
          demoSeed: NOVAE.DEMO_MARKER,
          nameAr: def.nameAr,
          descriptionAr: def.descriptionAr,
          seoTitle: def.seoTitle ?? `${def.name} | NOVAÉ`,
          seoDescription: def.seoDescription ?? def.description,
          tags: def.tags ?? [],
        },
      },
    });
    created++;
  }

  console.log(`  Products seeded: ${created} new (${existingCount + created} total)`);
  return existingCount + created;
}

async function seedCollections(ctx: NovaeContext): Promise<number> {
  const products = await prisma.product.findMany({
    where: { organizationId: ctx.organizationId, deletedAt: null, status: 'ACTIVE' },
    select: { id: true, slug: true, metadata: true },
  });

  const byTag = (tag: string) =>
    products.filter((p) => {
      const meta = p.metadata as { tags?: string[] } | null;
      return meta?.tags?.includes(tag);
    });

  const collectionMap: Record<string, string[]> = {
    'new-season': products.slice(0, 8).map((p) => p.id),
    essentials: products.filter((_, i) => i % 3 === 0).map((p) => p.id),
    'everyday-edit': products.slice(4, 16).map((p) => p.id),
    'best-sellers': byTag('bestseller').map((p) => p.id).length
      ? byTag('bestseller').map((p) => p.id)
      : products.slice(0, 6).map((p) => p.id),
    'under-150': products
      .filter((p) => {
        return true;
      })
      .slice(0, 10)
      .map((p) => p.id),
    gifts: products.filter((p) => ['beauty', 'home', 'accessories'].some(() => true)).slice(0, 8).map((p) => p.id),
    'travel-edit': products.filter((p) => p.slug.includes('bag') || p.slug.includes('travel') || p.slug.includes('pouch')).map((p) => p.id).length
      ? products.filter((p) => p.slug.includes('bag') || p.slug.includes('travel') || p.slug.includes('pouch')).map((p) => p.id)
      : products.slice(10, 15).map((p) => p.id),
    'home-edit': products.slice(25, 33).map((p) => p.id),
  };

  let count = 0;
  for (const col of NOVAE_COLLECTIONS) {
    const existing = await prisma.collection.findFirst({
      where: { organizationId: ctx.organizationId, slug: col.slug },
    });
    const productIds = collectionMap[col.slug] ?? [];

    if (existing) {
      count++;
      continue;
    }

    const collection = await createCollection(ctx.organizationId, {
      name: col.name,
      description: col.description,
      storeId: ctx.storeId,
      type: 'MANUAL',
      isFeatured: col.slug === 'new-season' || col.slug === 'best-sellers',
      productIds,
    });
    await prisma.collection.update({
      where: { id: collection.id },
      data: { slug: col.slug, status: 'ACTIVE', publishedAt: new Date() },
    });
    count++;
  }
  return count;
}

async function seedCustomers(ctx: NovaeContext): Promise<number> {
  const tags = await Promise.all(
    ['vip', 'returning', 'new'].map(async (slug) => {
      return prisma.customerTag.upsert({
        where: { organizationId_slug: { organizationId: ctx.organizationId, slug } },
        create: {
          organizationId: ctx.organizationId,
          name: slug.toUpperCase(),
          slug,
          color: slug === 'vip' ? '#C4B5A0' : slug === 'new' ? '#5B7CFF' : '#85898D',
        },
        update: {},
      });
    })
  );
  const tagBySlug = Object.fromEntries(tags.map((t) => [t.slug, t.id]));

  let count = 0;
  for (const c of NOVAE_CUSTOMERS) {
    const existing = await prisma.customer.findFirst({
      where: { organizationId: ctx.organizationId, emailNormalized: c.email.toLowerCase() },
    });
    if (existing) {
      count++;
      continue;
    }

    const customer = await createCustomer(ctx.organizationId, ctx.userId, {
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      status: c.status,
      source: 'MANUAL',
      notes: c.notes,
      tagIds: c.tags?.map((t) => tagBySlug[t]).filter(Boolean) as string[],
    });

    const city = PS_CITIES[count % PS_CITIES.length]!;
    await prisma.customerAddress.create({
      data: {
        customerId: customer.id,
        organizationId: ctx.organizationId,
        firstName: c.firstName,
        lastName: c.lastName,
        addressLine1: city.address,
        city: city.city,
        country: 'PS',
        phone: c.phone,
        isDefault: true,
      },
    });
    count++;
  }
  return count;
}

type OrderSeedSpec = {
  key: string;
  daysAgo: number;
  hoursAgo?: number;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'REFUNDED';
  fulfillmentStatus: 'UNFULFILLED' | 'FULFILLED';
  source: 'ONLINE' | 'POS' | 'MANUAL';
  method: 'COD' | 'CASH' | 'CARD';
  customerIndex: number;
  lineItems: { variantIndex: number; qty: number }[];
};

function buildOrderSpecs(variantCount: number): OrderSeedSpec[] {
  const specs: OrderSeedSpec[] = [];
  const statuses: OrderSeedSpec['status'][] = [
    'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED',
    'PROCESSING', 'PROCESSING', 'CONFIRMED', 'PENDING', 'CANCELLED',
  ];
  const sources: OrderSeedSpec['source'][] = ['ONLINE', 'ONLINE', 'ONLINE', 'POS', 'MANUAL'];
  const methods: OrderSeedSpec['method'][] = ['COD', 'COD', 'CARD', 'CASH', 'COD'];

  for (let i = 0; i < 55; i++) {
    const daysAgo = i < 5 ? 0 : Math.floor((i / 55) * 90);
    const status = statuses[i % statuses.length]!;
    const source = sources[i % sources.length]!;
    const method = methods[i % methods.length]!;
    let paymentStatus: OrderSeedSpec['paymentStatus'] = 'PAID';
    if (status === 'CANCELLED') paymentStatus = method === 'COD' ? 'PENDING' : 'REFUNDED';
    else if (method === 'COD' && status !== 'COMPLETED') paymentStatus = 'PENDING';
    else if (method === 'COD' && status === 'COMPLETED' && i % 7 === 0) paymentStatus = 'PENDING';

    specs.push({
      key: `novae-order-${String(i + 1).padStart(3, '0')}`,
      daysAgo,
      hoursAgo: i < 8 ? i * 2 : undefined,
      status,
      paymentStatus,
      fulfillmentStatus: status === 'COMPLETED' ? 'FULFILLED' : 'UNFULFILLED',
      source,
      method,
      customerIndex: i % NOVAE_CUSTOMERS.length,
      lineItems: [
        { variantIndex: i % variantCount, qty: 1 + (i % 3) },
        ...(i % 4 === 0 ? [{ variantIndex: (i + 5) % variantCount, qty: 1 }] : []),
      ],
    });
  }
  return specs;
}

async function seedOrders(ctx: NovaeContext): Promise<{ orders: number; posOrders: number }> {
  const existing = await prisma.order.count({
    where: {
      organizationId: ctx.organizationId,
      metadata: { path: ['demoSeed'], equals: NOVAE.DEMO_MARKER },
    },
  });
  if (existing >= 50) {
    const pos = await prisma.order.count({
      where: { organizationId: ctx.organizationId, source: 'POS', metadata: { path: ['demoSeed'], equals: NOVAE.DEMO_MARKER } },
    });
    return { orders: existing, posOrders: pos };
  }

  const customers = await prisma.customer.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: { createdAt: 'asc' },
  });
  const variants = await prisma.productVariant.findMany({
    where: {
      organizationId: ctx.organizationId,
      deletedAt: null,
      status: 'ACTIVE',
      product: { status: 'ACTIVE', deletedAt: null },
    },
    include: { product: true },
    orderBy: { sku: 'asc' },
  });
  if (!variants.length) return { orders: 0, posOrders: 0 };

  let orders = 0;
  let posOrders = 0;

  for (const spec of buildOrderSpecs(variants.length)) {
    const dup = await prisma.order.findFirst({
      where: {
        organizationId: ctx.organizationId,
        idempotencyKey: spec.key,
      },
    });
    if (dup) continue;

    const customer = customers[spec.customerIndex % customers.length];
    if (!customer) continue;

    const lines = spec.lineItems
      .map((l) => {
        const variant = variants[l.variantIndex % variants.length];
        if (!variant) return null;
        const totals = calculateLineTotals({
          unitPriceMinor: variant.sellingPrice,
          quantity: l.qty,
        });
        return { variant, qty: l.qty, ...totals };
      })
      .filter(Boolean) as {
      variant: (typeof variants)[0];
      qty: number;
      subtotalMinor: number;
      taxAmount: number;
      totalMinor: number;
    }[];

    if (!lines.length) continue;

    const orderTotals = calculateOrderTotals({
      lines: lines.map((l) => ({ unitPriceMinor: l.variant.sellingPrice, quantity: l.qty })),
      shippingAmount: spec.source === 'ONLINE' ? 1500 : 0,
    });

    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - spec.daysAgo);
    if (spec.hoursAgo != null) createdAt.setHours(createdAt.getHours() - spec.hoursAgo);

    const city = PS_CITIES[spec.customerIndex % PS_CITIES.length]!;
    const paidMinor =
      spec.paymentStatus === 'PAID'
        ? orderTotals.totalMinor
        : spec.paymentStatus === 'PARTIALLY_PAID'
          ? Math.round(orderTotals.totalMinor * 0.5)
          : 0;

    await prisma.$transaction(async (tx) => {
      const orderNumber = await generateOrderNumber(ctx.organizationId, tx);
      const order = await tx.order.create({
        data: {
          organizationId: ctx.organizationId,
          storeId: ctx.storeId,
          branchId: ctx.branchId,
          registerId: spec.source === 'POS' ? ctx.registerId : undefined,
          userId: ctx.userId,
          customerId: customer.id,
          orderNumber,
          source: spec.source,
          status: spec.status,
          paymentStatus: spec.paymentStatus,
          fulfillmentStatus: spec.fulfillmentStatus,
          currency: NOVAE.CURRENCY,
          subtotalMinor: orderTotals.subtotalMinor,
          shippingAmount: orderTotals.shippingAmount,
          taxAmount: orderTotals.taxAmount,
          totalMinor: orderTotals.totalMinor,
          paidMinor,
          refundedMinor: spec.paymentStatus === 'REFUNDED' ? orderTotals.totalMinor : 0,
          customerName: customer.name,
          guestEmail: customer.email,
          guestPhone: customer.phone,
          shippingAddress: {
            fullName: customer.name,
            address: city.address,
            city: city.city,
            country: 'PS',
          },
          completedAt: spec.status === 'COMPLETED' ? createdAt : null,
          cancelledAt: spec.status === 'CANCELLED' ? createdAt : null,
          idempotencyKey: spec.key,
          metadata: { demoSeed: NOVAE.DEMO_MARKER, seedKey: spec.key },
          createdAt,
          items: {
            create: lines.map((l) => ({
              productId: l.variant.productId,
              variantId: l.variant.id,
              productName: l.variant.product.name,
              variantName: l.variant.name,
              sku: l.variant.sku,
              quantity: l.qty,
              unitPriceMinor: l.variant.sellingPrice,
              subtotalMinor: l.subtotalMinor,
              taxAmount: l.taxAmount,
              totalMinor: l.totalMinor,
            })),
          },
        },
      });

      if (paidMinor > 0 && spec.status !== 'CANCELLED') {
        await tx.payment.create({
          data: {
            organizationId: ctx.organizationId,
            storeId: ctx.storeId,
            branchId: ctx.branchId,
            orderId: order.id,
            userId: ctx.userId,
            method: spec.method,
            status: 'PAID',
            amountMinor: paidMinor,
            currency: NOVAE.CURRENCY,
            createdAt,
          },
        });
      }

      await tx.orderEvent.create({
        data: {
          organizationId: ctx.organizationId,
          orderId: order.id,
          userId: ctx.userId,
          eventType: 'order.created',
          metadata: { demoSeed: NOVAE.DEMO_MARKER },
          createdAt,
        },
      });
    });

    orders++;
    if (spec.source === 'POS') posOrders++;
  }

  return { orders, posOrders };
}

async function seedMarketing(ctx: NovaeContext): Promise<number> {
  const existing = await prisma.marketingCampaign.count({
    where: { organizationId: ctx.organizationId, name: { startsWith: 'NOVAÉ' } },
  });
  if (existing >= 4) return existing;

  const audience = await createAudience(ctx.organizationId, ctx.userId, {
    name: 'NOVAÉ Returning Customers',
    description: 'Customers with meaningful lifetime spend',
    storeId: ctx.storeId,
    rules: {
      logic: 'AND',
      rules: [{ field: 'totalSpendMinor', operator: 'gte', value: 20000 }],
    },
  });

  const promo = await createPromotion(ctx.organizationId, ctx.userId, {
    name: 'Weekend 15% Off',
    description: '15% off all orders this weekend',
    storeId: ctx.storeId,
    discountType: 'PERCENT',
    discountValue: 1500,
    status: 'ACTIVE',
    couponCode: 'NOVAE15',
  });

  const campaigns = [
    { name: 'NOVAÉ New Season Launch', status: 'COMPLETED' as const },
    { name: 'NOVAÉ Weekend Offer', status: 'ACTIVE' as const },
    { name: 'NOVAÉ Returning Customers', status: 'ACTIVE' as const, audienceId: audience.id },
    { name: 'NOVAÉ VIP Early Access', status: 'SCHEDULED' as const },
    { name: 'NOVAÉ Summer Draft', status: 'DRAFT' as const },
  ];

  let count = 0;
  for (const c of campaigns) {
    const dup = await prisma.marketingCampaign.findFirst({
      where: { organizationId: ctx.organizationId, name: c.name },
    });
    if (dup) {
      count++;
      continue;
    }
    await createCampaign(ctx.organizationId, ctx.userId, {
      name: c.name,
      description: `Demo campaign for ${c.name}`,
      storeId: ctx.storeId,
      audienceId: 'audienceId' in c ? c.audienceId : undefined,
      promotionId: c.status === 'ACTIVE' ? promo.id : undefined,
      channels: ['IN_APP', 'STORE'],
      status: c.status,
    });
    count++;
  }
  return count;
}

async function seedAutomations(ctx: NovaeContext): Promise<number> {
  const templates = [
    {
      name: 'Low Stock Alert',
      description: 'Notify when inventory falls below threshold',
      status: 'ACTIVE' as const,
      config: {
        trigger: { type: 'inventory.low_stock', config: { threshold: 5 } },
        steps: [
          {
            type: 'action' as const,
            actionType: 'notification.send',
            input: { title: 'Low stock alert', channel: 'in_app' },
          },
        ],
      },
    },
    {
      name: 'New Order Notification',
      description: 'Alert on every new order',
      status: 'ACTIVE' as const,
      config: {
        trigger: { type: 'order.created' },
        steps: [
          {
            type: 'action' as const,
            actionType: 'notification.send',
            input: { title: 'New order received', channel: 'in_app' },
          },
        ],
      },
    },
    {
      name: 'VIP Customer Tag',
      description: 'Tag customers who spend over ₪2000',
      status: 'ACTIVE' as const,
      config: {
        trigger: { type: 'order.completed' },
        conditions: {
          operator: 'AND' as const,
          conditions: [
            { field: 'order.totalMinor', operator: 'greater_than' as const, value: 200000 },
          ],
        },
        steps: [
          {
            type: 'action' as const,
            actionType: 'customer.add_tag',
            input: { tagSlug: 'vip' },
          },
        ],
      },
    },
    {
      name: 'COD Reminder',
      description: 'Remind about pending COD collections',
      status: 'PAUSED' as const,
      config: {
        trigger: { type: 'order.created' },
        steps: [
          {
            type: 'action' as const,
            actionType: 'notification.send',
            input: { title: 'COD order pending collection', channel: 'in_app' },
          },
        ],
      },
    },
  ];

  let count = 0;
  for (const t of templates) {
    const dup = await prisma.automation.findFirst({
      where: { organizationId: ctx.organizationId, name: t.name },
    });
    if (dup) {
      count++;
      continue;
    }
    await createAutomation({
      organizationId: ctx.organizationId,
      createdById: ctx.userId,
      name: t.name,
      description: t.description,
      storeId: ctx.storeId,
      branchId: ctx.branchId,
      config: t.config as import('@/types/automation').AutomationVersionConfig,
    });
    if (t.status === 'ACTIVE') {
      const auto = await prisma.automation.findFirst({
        where: { organizationId: ctx.organizationId, name: t.name },
      });
      if (auto) {
        await prisma.automation.update({
          where: { id: auto.id },
          data: { status: 'ACTIVE' },
        });
      }
    }
    count++;
  }
  return count;
}

export async function seedNovaeDemo(): Promise<NovaeSeedStats> {
  console.log('\n━━━ NOVAÉ Demo Merchant Seed ━━━');
  console.log(`Marker: ${NOVAE.DEMO_MARKER}`);

  const ctx = await seedFoundation();
  console.log(`  Organization: ${NOVAE.ORG_SLUG}`);
  console.log(`  Store: /store/${NOVAE.STORE_PUBLIC_SLUG}`);

  const products = await seedProducts(ctx);
  const collections = await seedCollections(ctx);
  const customers = await seedCustomers(ctx);
  const { orders, posOrders } = await seedOrders(ctx);
  const campaigns = await seedMarketing(ctx);
  const automations = await seedAutomations(ctx);

  const categories = Object.keys(ctx.categoryIds).length;

  console.log('\n━━━ NOVAÉ Demo Ready ━━━');
  console.log(`  Login: ${NOVAE.USER_EMAIL}`);
  console.log(`  Password: ${NOVAE.PASSWORD}`);
  console.log(`  Storefront: /store/${NOVAE.STORE_PUBLIC_SLUG}`);

  return {
    products,
    categories,
    collections,
    customers,
    orders,
    posOrders,
    campaigns,
    automations,
  };
}
