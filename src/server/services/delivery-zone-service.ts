import { prisma } from '@/lib/db';

export async function listDeliveryZones(organizationId: string, storeId: string) {
  return prisma.shippingMethod.findMany({
    where: { organizationId, storeId },
    orderBy: [{ position: 'asc' }, { name: 'asc' }],
  });
}

export async function upsertDeliveryZone(
  organizationId: string,
  storeId: string,
  input: {
    id?: string;
    name: string;
    priceMinor: number;
    isActive?: boolean;
  }
) {
  const slug = input.name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\u0600-\u06FF-]/g, '')
    .slice(0, 48) || `zone-${Date.now()}`;

  if (input.id) {
    return prisma.shippingMethod.update({
      where: { id: input.id },
      data: {
        name: input.name,
        priceMinor: input.priceMinor,
        isActive: input.isActive ?? true,
      },
    });
  }

  return prisma.shippingMethod.create({
    data: {
      organizationId,
      storeId,
      name: input.name,
      slug,
      priceMinor: input.priceMinor,
      isActive: input.isActive ?? true,
    },
  });
}

export async function deleteDeliveryZone(organizationId: string, zoneId: string) {
  const zone = await prisma.shippingMethod.findFirst({
    where: { id: zoneId, organizationId },
  });
  if (!zone) throw new Error('NOT_FOUND');
  return prisma.shippingMethod.delete({ where: { id: zoneId } });
}
