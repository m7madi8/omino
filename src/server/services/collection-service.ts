import { prisma } from '@/lib/db';
import { slugify, uniqueSlug } from '@/lib/utils';
import type { CollectionStatus, CollectionType, Prisma } from '@prisma/client';

export async function listCollections(
  organizationId: string,
  options?: { storeId?: string; status?: CollectionStatus }
) {
  return prisma.collection.findMany({
    where: {
      organizationId,
      deletedAt: null,
      ...(options?.storeId && { OR: [{ storeId: options.storeId }, { storeId: null }] }),
      ...(options?.status && { status: options.status }),
    },
    include: {
      _count: { select: { products: true } },
    },
    orderBy: [{ position: 'asc' }, { name: 'asc' }],
  });
}

export async function getCollection(organizationId: string, id: string) {
  const collection = await prisma.collection.findFirst({
    where: { id, organizationId, deletedAt: null },
    include: {
      products: {
        orderBy: { position: 'asc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              status: true,
              images: { orderBy: { position: 'asc' }, take: 1, select: { url: true } },
            },
          },
        },
      },
    },
  });
  if (!collection) throw new Error('NOT_FOUND');
  return collection;
}

export async function getCollectionBySlug(
  organizationId: string,
  slug: string,
  storeId?: string
) {
  const collection = await prisma.collection.findFirst({
    where: {
      organizationId,
      slug,
      status: 'ACTIVE',
      deletedAt: null,
      ...(storeId && { OR: [{ storeId }, { storeId: null }] }),
    },
    include: {
      products: {
        orderBy: { position: 'asc' },
        include: {
          product: {
            include: {
              images: { orderBy: { position: 'asc' }, take: 2 },
              variants: {
                where: { deletedAt: null, status: 'ACTIVE' },
                orderBy: { position: 'asc' },
                take: 1,
              },
              category: { select: { name: true, slug: true } },
            },
          },
        },
      },
    },
  });
  if (!collection) throw new Error('NOT_FOUND');
  return collection;
}

async function uniqueCollectionSlug(organizationId: string, name: string) {
  let slug = slugify(name);
  let attempt = 0;
  while (
    await prisma.collection.findFirst({
      where: { organizationId, slug, deletedAt: null },
    })
  ) {
    attempt += 1;
    slug = uniqueSlug(name, String(attempt));
  }
  return slug;
}

export async function createCollection(
  organizationId: string,
  input: {
    name: string;
    description?: string;
    storeId?: string;
    type?: CollectionType;
    imageUrl?: string;
    seoTitle?: string;
    seoDescription?: string;
    isFeatured?: boolean;
    productIds?: string[];
  }
) {
  const slug = await uniqueCollectionSlug(organizationId, input.name);
  return prisma.$transaction(async (tx) => {
    const collection = await tx.collection.create({
      data: {
        organizationId,
        storeId: input.storeId,
        name: input.name,
        slug,
        description: input.description,
        type: input.type ?? 'MANUAL',
        imageUrl: input.imageUrl,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        isFeatured: input.isFeatured ?? false,
        status: 'DRAFT',
      },
    });

    if (input.productIds?.length) {
      await tx.collectionProduct.createMany({
        data: input.productIds.map((productId, index) => ({
          collectionId: collection.id,
          productId,
          position: index,
        })),
      });
    }

    return collection;
  });
}

export async function updateCollection(
  organizationId: string,
  id: string,
  data: {
    name?: string;
    description?: string | null;
    imageUrl?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
    isFeatured?: boolean;
    status?: CollectionStatus;
    position?: number;
    rules?: Prisma.InputJsonValue;
  }
) {
  const existing = await prisma.collection.findFirst({
    where: { id, organizationId, deletedAt: null },
  });
  if (!existing) throw new Error('NOT_FOUND');

  return prisma.collection.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
      ...(data.seoTitle !== undefined && { seoTitle: data.seoTitle }),
      ...(data.seoDescription !== undefined && { seoDescription: data.seoDescription }),
      ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
      ...(data.status !== undefined && {
        status: data.status,
        ...(data.status === 'ACTIVE' && { publishedAt: new Date() }),
      }),
      ...(data.position !== undefined && { position: data.position }),
      ...(data.rules !== undefined && { rules: data.rules }),
    },
  });
}

export async function setCollectionProducts(
  organizationId: string,
  collectionId: string,
  productIds: string[]
) {
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, organizationId, deletedAt: null },
  });
  if (!collection) throw new Error('NOT_FOUND');

  return prisma.$transaction(async (tx) => {
    await tx.collectionProduct.deleteMany({ where: { collectionId } });
    if (productIds.length) {
      await tx.collectionProduct.createMany({
        data: productIds.map((productId, index) => ({
          collectionId,
          productId,
          position: index,
        })),
      });
    }
    return tx.collection.findUnique({
      where: { id: collectionId },
      include: { products: { orderBy: { position: 'asc' } } },
    });
  });
}

export async function deleteCollection(organizationId: string, id: string) {
  const existing = await prisma.collection.findFirst({
    where: { id, organizationId, deletedAt: null },
  });
  if (!existing) throw new Error('NOT_FOUND');
  return prisma.collection.update({
    where: { id },
    data: { deletedAt: new Date(), status: 'ARCHIVED' },
  });
}

export async function listPublishedCollections(organizationId: string, storeId?: string) {
  return prisma.collection.findMany({
    where: {
      organizationId,
      deletedAt: null,
      status: 'ACTIVE',
      ...(storeId && { OR: [{ storeId }, { storeId: null }] }),
    },
    include: {
      products: {
        orderBy: { position: 'asc' },
        include: {
          product: {
            include: {
              images: { orderBy: { position: 'asc' }, take: 2 },
              variants: {
                where: { deletedAt: null, status: 'ACTIVE' },
                orderBy: { position: 'asc' },
                take: 1,
              },
              category: { select: { name: true, slug: true } },
            },
          },
        },
      },
    },
    orderBy: [{ position: 'asc' }, { name: 'asc' }],
  });
}

export async function publishCollection(organizationId: string, id: string) {
  return updateCollection(organizationId, id, { status: 'ACTIVE' });
}
