import { prisma } from '@/lib/db';
import { slugify } from '@/lib/utils';
import { Prisma, type StoreStatus } from '@prisma/client';
import type { StoreExperienceDocument } from '@/types/store-experience';

export async function getStoreForAdmin(organizationId: string, storeId?: string) {
  if (storeId) {
    return prisma.store.findFirst({ where: { id: storeId, organizationId } });
  }
  return prisma.store.findFirst({
    where: { organizationId, isDefault: true },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getStoreSettings(organizationId: string, storeId?: string) {
  const store = await getStoreForAdmin(organizationId, storeId);
  if (!store) throw new Error('NOT_FOUND');
  return store;
}

export async function updateStoreSettings(
  organizationId: string,
  storeId: string,
  input: {
    name?: string;
    publicSlug?: string;
    description?: string | null;
    logoUrl?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    currency?: string | null;
    country?: string | null;
    timezone?: string | null;
    status?: StoreStatus;
    primaryColor?: string | null;
    secondaryColor?: string | null;
    taxRateBps?: number;
    socialLinks?: import('@/types/store-contact').StoreSocialLinks | null;
    themeSettings?: StoreExperienceDocument | Record<string, unknown> | null;
  }
) {
  const store = await prisma.store.findFirst({ where: { id: storeId, organizationId } });
  if (!store) throw new Error('NOT_FOUND');

  if (input.publicSlug && input.publicSlug !== store.publicSlug) {
    const normalized = slugify(input.publicSlug);
    const taken = await prisma.store.findFirst({
      where: { publicSlug: normalized, NOT: { id: storeId } },
    });
    if (taken) throw new Error('SLUG_TAKEN');
    input.publicSlug = normalized;
  }

  return prisma.store.update({
    where: { id: storeId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.publicSlug !== undefined && { publicSlug: input.publicSlug }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.logoUrl !== undefined && { logoUrl: input.logoUrl }),
      ...(input.contactEmail !== undefined && { contactEmail: input.contactEmail }),
      ...(input.contactPhone !== undefined && { contactPhone: input.contactPhone }),
      ...(input.currency !== undefined && { currency: input.currency }),
      ...(input.country !== undefined && { country: input.country }),
      ...(input.timezone !== undefined && { timezone: input.timezone }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.primaryColor !== undefined && { primaryColor: input.primaryColor }),
      ...(input.secondaryColor !== undefined && { secondaryColor: input.secondaryColor }),
      ...(input.taxRateBps !== undefined && { taxRateBps: input.taxRateBps }),
      ...(input.socialLinks !== undefined && {
        socialLinks: input.socialLinks === null ? Prisma.JsonNull : input.socialLinks,
      }),
      ...(input.themeSettings !== undefined && {
        themeSettings:
          input.themeSettings === null
            ? Prisma.JsonNull
            : (input.themeSettings as Prisma.InputJsonValue),
      }),
    },
  });
}

export async function listShippingMethods(organizationId: string, storeId: string) {
  return prisma.shippingMethod.findMany({
    where: { storeId, organizationId },
    orderBy: { position: 'asc' },
  });
}

export async function ensureDefaultShippingMethods(organizationId: string, storeId: string) {
  const existing = await prisma.shippingMethod.count({ where: { storeId } });
  if (existing > 0) return listShippingMethods(organizationId, storeId);

  await prisma.shippingMethod.createMany({
    data: [
      {
        organizationId,
        storeId,
        name: 'Standard Delivery',
        slug: 'standard',
        description: 'Delivered within 3–5 business days',
        priceMinor: 1500,
        estimatedDelivery: '3–5 days',
        position: 0,
      },
      {
        organizationId,
        storeId,
        name: 'Local Pickup',
        slug: 'pickup',
        description: 'Pick up at our store',
        priceMinor: 0,
        estimatedDelivery: 'Same day',
        position: 1,
      },
    ],
  });

  return listShippingMethods(organizationId, storeId);
}
