import { prisma } from '@/lib/db';
import { slugify, uniqueSlug } from '@/lib/utils';
import { emitCatalogEvent } from '@/server/events/catalog-events';

export async function listCategories(organizationId: string) {
  return prisma.category.findMany({
    where: { organizationId, deletedAt: null },
    include: {
      _count: { select: { products: true, children: true } },
      parent: { select: { id: true, name: true } },
    },
    orderBy: [{ position: 'asc' }, { name: 'asc' }],
  });
}

export async function createCategory(
  organizationId: string,
  userId: string,
  data: { name: string; parentId?: string; storeId?: string; description?: string }
) {
  let slug = slugify(data.name);
  let attempt = 0;
  while (
    await prisma.category.findFirst({
      where: { organizationId, slug, deletedAt: null },
    })
  ) {
    attempt += 1;
    slug = uniqueSlug(data.name, String(attempt));
  }

  if (data.parentId) {
    const parent = await prisma.category.findFirst({
      where: { id: data.parentId, organizationId, deletedAt: null },
    });
    if (!parent) throw new Error('NOT_FOUND');
  }

  const category = await prisma.category.create({
    data: {
      organizationId,
      storeId: data.storeId,
      parentId: data.parentId,
      name: data.name,
      slug,
      description: data.description,
    },
  });

  await emitCatalogEvent({
    type: 'category.created',
    organizationId,
    userId,
    payload: { categoryId: category.id },
  });

  return category;
}

export async function updateCategory(
  organizationId: string,
  userId: string,
  categoryId: string,
  data: { name?: string; description?: string; parentId?: string | null }
) {
  const existing = await prisma.category.findFirst({
    where: { id: categoryId, organizationId, deletedAt: null },
  });
  if (!existing) throw new Error('NOT_FOUND');

  const category = await prisma.category.update({
    where: { id: categoryId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.parentId !== undefined && { parentId: data.parentId }),
    },
  });

  await emitCatalogEvent({
    type: 'category.updated',
    organizationId,
    userId,
    payload: { categoryId },
  });

  return category;
}

export async function archiveCategory(organizationId: string, categoryId: string) {
  const existing = await prisma.category.findFirst({
    where: { id: categoryId, organizationId, deletedAt: null },
  });
  if (!existing) throw new Error('NOT_FOUND');

  return prisma.category.update({
    where: { id: categoryId },
    data: { deletedAt: new Date() },
  });
}
