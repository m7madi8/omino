import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import { prisma } from '@/lib/db';
import {
  getLiveExperience,
  parseExperienceDocument,
} from '@/lib/storefront/store-experience-engine';
import { computeStoreHealth } from '@/lib/storefront/store-health';
import { getStoreSettings } from '@/server/services/store-service';

export async function GET() {
  try {
    const ctx = await requireTenantContext('store.read');
    const store = await getStoreSettings(ctx.organizationId, ctx.storeId ?? undefined);

    const [productCount, productsWithImages, categoryCount, shippingMethodCount] =
      await Promise.all([
        prisma.product.count({
          where: {
            organizationId: ctx.organizationId,
            deletedAt: null,
            status: 'ACTIVE',
            OR: [{ storeId: store.id }, { storeId: null }],
          },
        }),
        prisma.product.count({
          where: {
            organizationId: ctx.organizationId,
            deletedAt: null,
            status: 'ACTIVE',
            OR: [{ storeId: store.id }, { storeId: null }],
            images: { some: {} },
          },
        }),
        prisma.category.count({
          where: { organizationId: ctx.organizationId, deletedAt: null },
        }),
        prisma.shippingMethod.count({
          where: { storeId: store.id, organizationId: ctx.organizationId },
        }),
      ]);

    const experienceDoc = parseExperienceDocument(store.themeSettings);
    const experience = getLiveExperience(store.themeSettings);

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

    return Response.json({
      health,
      publishedAt: experienceDoc.publishedAt,
      hasUnpublishedChanges:
        JSON.stringify(experienceDoc.live) !== JSON.stringify(experienceDoc.draft),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
