import { prisma } from '@/lib/db';
import { slugify } from '@/lib/utils';
import { getCustomerOrThrow, recordCustomerEvent } from '@/server/services/customer-service';

export async function listCustomerTags(organizationId: string) {
  return prisma.customerTag.findMany({
    where: { organizationId },
    orderBy: { name: 'asc' },
    include: { _count: { select: { assignments: true } } },
  });
}

export async function createCustomerTag(
  organizationId: string,
  input: { name: string; color?: string }
) {
  let slug = slugify(input.name);
  let attempt = 0;
  while (
    await prisma.customerTag.findFirst({ where: { organizationId, slug } })
  ) {
    attempt += 1;
    slug = `${slugify(input.name)}-${attempt}`;
  }

  return prisma.customerTag.create({
    data: {
      organizationId,
      name: input.name.trim(),
      slug,
      color: input.color,
    },
  });
}

export async function renameCustomerTag(
  organizationId: string,
  tagId: string,
  name: string
) {
  const tag = await prisma.customerTag.findFirst({
    where: { id: tagId, organizationId },
  });
  if (!tag) throw new Error('NOT_FOUND');

  return prisma.customerTag.update({
    where: { id: tagId },
    data: { name: name.trim() },
  });
}

export async function deleteCustomerTag(organizationId: string, tagId: string) {
  const tag = await prisma.customerTag.findFirst({
    where: { id: tagId, organizationId },
  });
  if (!tag) throw new Error('NOT_FOUND');
  return prisma.customerTag.delete({ where: { id: tagId } });
}

export async function attachTagToCustomer(
  organizationId: string,
  customerId: string,
  tagId: string,
  userId?: string
) {
  await getCustomerOrThrow(organizationId, customerId);
  const tag = await prisma.customerTag.findFirst({
    where: { id: tagId, organizationId },
  });
  if (!tag) throw new Error('NOT_FOUND');

  await prisma.$transaction(async (tx) => {
    await tx.customerTagAssignment.upsert({
      where: { customerId_tagId: { customerId, tagId } },
      create: { customerId, tagId },
      update: {},
    });

    await recordCustomerEvent(
      {
        organizationId,
        customerId,
        userId,
        eventType: 'customer.tag_added',
        metadata: { tagId, tagName: tag.name },
      },
      tx
    );
  });
}

export async function detachTagFromCustomer(
  organizationId: string,
  customerId: string,
  tagId: string,
  userId?: string
) {
  await getCustomerOrThrow(organizationId, customerId);

  await prisma.$transaction(async (tx) => {
    await tx.customerTagAssignment.deleteMany({
      where: { customerId, tagId },
    });

    await recordCustomerEvent(
      {
        organizationId,
        customerId,
        userId,
        eventType: 'customer.tag_removed',
        metadata: { tagId },
      },
      tx
    );
  });
}
