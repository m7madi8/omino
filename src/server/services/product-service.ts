import { prisma } from '@/lib/db';
import { slugify, uniqueSlug } from '@/lib/utils';
import type { Prisma } from '@prisma/client';
import type { ProductStatus } from '@/types/prisma-enums';
import { emitCatalogEvent } from '@/server/events/catalog-events';
import {
  computeAvailable,
  ensureDefaultStockLocation,
  isLowStock,
  setInitialStock,
} from '@/server/services/inventory-service';
import type { CreateProductInput } from '@/types/catalog';

async function uniqueProductSlug(organizationId: string, name: string) {
  let slug = slugify(name);
  let attempt = 0;
  while (
    await prisma.product.findFirst({
      where: { organizationId, slug, deletedAt: null },
    })
  ) {
    attempt += 1;
    slug = uniqueSlug(name, String(attempt));
  }
  return slug;
}

async function uniqueSku(organizationId: string, base: string) {
  let sku = base.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 32) || 'SKU';
  let attempt = 0;
  while (
    await prisma.productVariant.findFirst({
      where: { organizationId, sku, deletedAt: null },
    })
  ) {
    attempt += 1;
    sku = `${base.slice(0, 24)}-${attempt}`.toUpperCase();
  }
  return sku;
}

export async function listProducts(params: {
  organizationId: string;
  storeId?: string;
  status?: ProductStatus;
  categoryId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = params.page ?? 1;
  const pageSize = Math.min(params.pageSize ?? 25, 100);
  const skip = (page - 1) * pageSize;

  const where: Prisma.ProductWhereInput = {
    organizationId: params.organizationId,
    deletedAt: null,
    ...(params.storeId && { storeId: params.storeId }),
    ...(params.status && { status: params.status }),
    ...(params.categoryId && { categoryId: params.categoryId }),
    ...(params.search && {
      OR: [
        { name: { contains: params.search, mode: 'insensitive' } },
        { brand: { contains: params.search, mode: 'insensitive' } },
        { variants: { some: { sku: { contains: params.search, mode: 'insensitive' } } } },
      ],
    }),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        images: { where: { isPrimary: true }, take: 1 },
        variants: {
          where: { deletedAt: null },
          include: { stockLevels: true },
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  const items = products.map((p) => {
    const defaultVariant = p.variants.find((v) => v.isDefault) || p.variants[0];
    const totalOnHand = p.variants.reduce(
      (sum, v) => sum + v.stockLevels.reduce((s, l) => s + l.quantityOnHand, 0),
      0
    );
    const totalReserved = p.variants.reduce(
      (sum, v) => sum + v.stockLevels.reduce((s, l) => s + l.quantityReserved, 0),
      0
    );
    const available = computeAvailable(totalOnHand, totalReserved);
    const threshold = defaultVariant?.lowStockThreshold;
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      status: p.status,
      productType: p.productType,
      catalogKind: p.catalogKind,
      isFeatured: p.isFeatured,
      brand: p.brand,
      categoryName: p.category?.name ?? null,
      sku: defaultVariant?.sku ?? '—',
      sellingPrice: defaultVariant?.sellingPrice ?? 0,
      currency: defaultVariant?.currency ?? 'USD',
      totalOnHand,
      totalAvailable: available,
      isLowStock: isLowStock(available, threshold),
      imageUrl: p.images[0]?.url ?? null,
      variantCount: p.variants.length,
      updatedAt: p.updatedAt.toISOString(),
    };
  });

  return { items, total, page, pageSize };
}

export async function getProductDetail(organizationId: string, productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, organizationId, deletedAt: null },
    include: {
      category: true,
      bundleItems: {
        orderBy: { position: 'asc' },
        include: { includedProduct: { select: { id: true, name: true, slug: true } } },
      },
      images: { orderBy: { position: 'asc' } },
      options: {
        include: {
          option: { include: { values: { orderBy: { position: 'asc' } } } },
        },
        orderBy: { position: 'asc' },
      },
      variants: {
        where: { deletedAt: null },
        include: {
          optionValues: {
            include: { optionValue: { include: { option: true } } },
          },
          stockLevels: { include: { stockLocation: true } },
          images: { orderBy: { position: 'asc' } },
        },
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!product) throw new Error('NOT_FOUND');
  return product;
}

async function assertValidBundleItems(
  tx: Prisma.TransactionClient,
  organizationId: string,
  bundleProductId: string | null,
  items: { productId: string; quantity: number }[]
) {
  if (!items.length) throw new Error('VALIDATION_ERROR');

  const ids = items.map((i) => i.productId);
  if (new Set(ids).size !== ids.length) throw new Error('VALIDATION_ERROR');

  const products = await tx.product.findMany({
    where: { id: { in: ids }, organizationId, deletedAt: null },
    select: { id: true, catalogKind: true },
  });

  if (products.length !== ids.length) throw new Error('VALIDATION_ERROR');

  for (const product of products) {
    if (product.catalogKind === 'BUNDLE') throw new Error('VALIDATION_ERROR');
    if (bundleProductId && product.id === bundleProductId) throw new Error('VALIDATION_ERROR');
  }
}

export async function createProduct(
  ctx: {
    organizationId: string;
    userId: string;
    storeId: string | null;
    branchId: string | null;
    currency: string;
  },
  input: CreateProductInput
) {
  const slug = await uniqueProductSlug(ctx.organizationId, input.name);
  const storeId = input.storeId || ctx.storeId;

  const result = await prisma.$transaction(async (tx) => {
    let stockLocationId = input.stockLocationId;
    if (!stockLocationId && ctx.branchId && storeId) {
      const branch = await tx.branch.findFirst({
        where: { id: ctx.branchId, storeId },
      });
      if (branch) {
        const loc = await ensureDefaultStockLocation(
          ctx.organizationId,
          storeId,
          branch.id,
          branch.name,
          tx
        );
        stockLocationId = loc.id;
      }
    }

    const hasVariants = Boolean(input.variants?.length) && input.catalogKind !== 'BUNDLE';
    const product = await tx.product.create({
      data: {
        organizationId: ctx.organizationId,
        storeId: storeId ?? undefined,
        categoryId: input.categoryId,
        name: input.name,
        slug,
        description: input.description,
        status: input.status ?? 'DRAFT',
        productType: input.productType ?? 'PHYSICAL',
        catalogKind: input.catalogKind ?? 'SIMPLE',
        isFeatured: input.isFeatured ?? false,
        brand: input.brand,
        hasVariants,
        trackInventory: input.trackInventory ?? true,
      },
    });

    if (input.catalogKind === 'BUNDLE' && input.bundleItems?.length) {
      await assertValidBundleItems(tx, ctx.organizationId, product.id, input.bundleItems);
      await tx.bundleItem.createMany({
        data: input.bundleItems.map((item, index) => ({
          bundleProductId: product.id,
          includedProductId: item.productId,
          quantity: item.quantity,
          position: index,
        })),
      });
    }

    const optionMap = new Map<string, Map<string, string>>();
    if (input.options?.length) {
      for (let i = 0; i < input.options.length; i++) {
        const opt = input.options[i];
        const option = await tx.productOption.upsert({
          where: {
            organizationId_name: { organizationId: ctx.organizationId, name: opt.name },
          },
          create: {
            organizationId: ctx.organizationId,
            name: opt.name,
            position: i,
          },
          update: {},
        });

        await tx.productOptionLink.create({
          data: { productId: product.id, optionId: option.id, position: i },
        });

        const valueMap = new Map<string, string>();
        for (let j = 0; j < opt.values.length; j++) {
          const val = opt.values[j];
          const optionValue = await tx.productOptionValue.upsert({
            where: { optionId_value: { optionId: option.id, value: val } },
            create: { optionId: option.id, value: val, position: j },
            update: {},
          });
          valueMap.set(val, optionValue.id);
        }
        optionMap.set(opt.name, valueMap);
      }
    }

    if (input.images?.length) {
      await tx.productImage.createMany({
        data: input.images.map((img, i) => ({
          productId: product.id,
          organizationId: ctx.organizationId,
          url: img.url,
          altText: img.altText,
          position: i,
          isPrimary: img.isPrimary ?? i === 0,
        })),
      });
    }

    const variantsToCreate = hasVariants
      ? input.variants!
      : [
          {
            sku: input.sku || (await uniqueSku(ctx.organizationId, slug)),
            sellingPrice: input.sellingPrice,
            costPrice: input.costPrice,
            compareAtPrice: input.compareAtPrice,
            barcode: input.barcode,
            barcodeType: input.barcodeType,
            initialStock: input.initialStock,
            lowStockThreshold: input.lowStockThreshold,
          },
        ];

    const createdVariants: Awaited<ReturnType<typeof tx.productVariant.create>>[] = [];
    const stockToSet: {
      variantId: string;
      quantity: number;
      threshold?: number;
    }[] = [];

    for (let i = 0; i < variantsToCreate.length; i++) {
      const v = variantsToCreate[i];
      const sku = v.sku || (await uniqueSku(ctx.organizationId, `${slug}-${i + 1}`));

      const variant = await tx.productVariant.create({
        data: {
          productId: product.id,
          organizationId: ctx.organizationId,
          sku,
          name: v.name,
          barcode: v.barcode,
          barcodeType: v.barcodeType,
          costPrice: v.costPrice,
          sellingPrice: v.sellingPrice,
          compareAtPrice: v.compareAtPrice,
          currency: input.currency || ctx.currency,
          trackInventory: input.trackInventory ?? true,
          lowStockThreshold: v.lowStockThreshold ?? input.lowStockThreshold,
          reorderPoint: input.reorderPoint,
          isDefault: i === 0,
          position: i,
          status: input.status ?? 'DRAFT',
        },
      });

      if (v.optionValues?.length && input.options) {
        for (const label of v.optionValues) {
          for (const [, valueMap] of optionMap) {
            const valueId = valueMap.get(label);
            if (valueId) {
              await tx.productVariantOption.create({
                data: { variantId: variant.id, optionValueId: valueId },
              });
            }
          }
        }
      }

      createdVariants.push(variant);

      if (
        stockLocationId &&
        v.initialStock &&
        v.initialStock > 0 &&
        (input.trackInventory ?? true)
      ) {
        stockToSet.push({
          variantId: variant.id,
          quantity: v.initialStock,
          threshold: v.lowStockThreshold ?? input.lowStockThreshold,
        });
      }
    }

    return { product, variants: createdVariants, stockLocationId, stockToSet };
  });

  for (const stock of result.stockToSet) {
    if (result.stockLocationId) {
      await setInitialStock(
        ctx.organizationId,
        ctx.userId,
        stock.variantId,
        result.stockLocationId,
        stock.quantity,
        stock.threshold
      );
    }
  }

  await emitCatalogEvent({
    type: 'product.created',
    organizationId: ctx.organizationId,
    userId: ctx.userId,
    payload: { productId: result.product.id, variantCount: result.variants.length },
  });

  return { product: result.product, variants: result.variants };
}

export async function updateProduct(
  organizationId: string,
  userId: string,
  productId: string,
  data: {
    name?: string;
    description?: string;
    status?: ProductStatus;
    brand?: string;
    categoryId?: string | null;
    productType?: CreateProductInput['productType'];
    trackInventory?: boolean;
    isFeatured?: boolean;
  }
) {
  const existing = await prisma.product.findFirst({
    where: { id: productId, organizationId, deletedAt: null },
  });
  if (!existing) throw new Error('NOT_FOUND');

  const product = await prisma.product.update({
    where: { id: productId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status && { status: data.status }),
      ...(data.brand !== undefined && { brand: data.brand }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      ...(data.productType && { productType: data.productType }),
      ...(data.trackInventory !== undefined && { trackInventory: data.trackInventory }),
      ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
    },
  });

  if (data.status) {
    await prisma.productVariant.updateMany({
      where: { productId, organizationId },
      data: { status: data.status },
    });
  }

  await emitCatalogEvent({
    type: 'product.updated',
    organizationId,
    userId,
    payload: { productId },
  });

  return product;
}

export async function archiveProduct(
  organizationId: string,
  userId: string,
  productId: string
) {
  const existing = await prisma.product.findFirst({
    where: { id: productId, organizationId, deletedAt: null },
  });
  if (!existing) throw new Error('NOT_FOUND');

  await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: { status: 'ARCHIVED', deletedAt: new Date() },
    }),
    prisma.productVariant.updateMany({
      where: { productId, organizationId },
      data: { status: 'ARCHIVED', deletedAt: new Date() },
    }),
  ]);

  await emitCatalogEvent({
    type: 'product.archived',
    organizationId,
    userId,
    payload: { productId },
  });
}

export async function addProductImages(
  organizationId: string,
  productId: string,
  images: { url: string; altText?: string; isPrimary?: boolean }[]
) {
  const product = await prisma.product.findFirst({
    where: { id: productId, organizationId, deletedAt: null },
  });
  if (!product) throw new Error('NOT_FOUND');

  const count = await prisma.productImage.count({ where: { productId } });

  if (images.some((i) => i.isPrimary)) {
    await prisma.productImage.updateMany({
      where: { productId },
      data: { isPrimary: false },
    });
  }

  return prisma.productImage.createMany({
    data: images.map((img, i) => ({
      productId,
      organizationId,
      url: img.url,
      altText: img.altText,
      position: count + i,
      isPrimary: img.isPrimary ?? (count === 0 && i === 0),
    })),
  });
}

export async function removeProductImage(
  organizationId: string,
  productId: string,
  imageId: string
) {
  const image = await prisma.productImage.findFirst({
    where: { id: imageId, productId, organizationId },
  });
  if (!image) throw new Error('NOT_FOUND');

  await prisma.productImage.delete({ where: { id: imageId } });

  const { deleteProductImageFile } = await import('@/lib/storage/product-images');
  await deleteProductImageFile(image.url);

  const remaining = await prisma.productImage.findMany({
    where: { productId },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
  });

  if (remaining.length && !remaining.some((img) => img.isPrimary)) {
    await prisma.productImage.update({
      where: { id: remaining[0].id },
      data: { isPrimary: true },
    });
  }

  return remaining;
}

export async function setProductImagePrimary(
  organizationId: string,
  productId: string,
  imageId: string
) {
  const image = await prisma.productImage.findFirst({
    where: { id: imageId, productId, organizationId },
  });
  if (!image) throw new Error('NOT_FOUND');

  await prisma.$transaction([
    prisma.productImage.updateMany({
      where: { productId },
      data: { isPrimary: false },
    }),
    prisma.productImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    }),
  ]);

  return image;
}

export async function reorderProductImages(
  organizationId: string,
  productId: string,
  imageIds: string[]
) {
  const product = await prisma.product.findFirst({
    where: { id: productId, organizationId, deletedAt: null },
  });
  if (!product) throw new Error('NOT_FOUND');

  const images = await prisma.productImage.findMany({
    where: { productId, organizationId },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
  });

  if (imageIds.length !== images.length) {
    throw new Error('VALIDATION_ERROR');
  }

  const imageSet = new Set(images.map((img) => img.id));
  if (!imageIds.every((id) => imageSet.has(id))) {
    throw new Error('VALIDATION_ERROR');
  }

  await prisma.$transaction(
    imageIds.map((id, position) =>
      prisma.productImage.update({
        where: { id },
        data: { position },
      })
    )
  );
}
