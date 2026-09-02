import { z } from 'zod';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import { getStoreSettings, updateStoreSettings } from '@/server/services/store-service';
import { normalizePhoneDigits } from '@/lib/storefront/contact-links';
import { allowedCountrySchema } from '@/lib/geo/allowed-countries';
import { mergeThemeSettingsInput } from '@/server/services/store-experience-service';

const heroCtaSchema = z.object({
  label: z.string().min(1).max(80),
  href: z.string().min(1).max(500),
});

const heroSchema = z.object({
  enabled: z.boolean(),
  layout: z.enum(['split', 'centered', 'image-focused']),
  eyebrow: z.string().max(120).optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  primaryCta: heroCtaSchema.optional(),
  secondaryCta: heroCtaSchema.optional(),
  imageUrl: z.string().nullable().optional(),
  mobileImageUrl: z.string().nullable().optional(),
  imagePosition: z.enum(['left', 'right']).optional(),
  imageFit: z.enum(['cover', 'contain']).optional(),
  imageFocalPoint: z.string().max(40).optional(),
  overlay: z.boolean().optional(),
  alignment: z.enum(['left', 'center']).optional(),
});

const announcementSchema = z.object({
  enabled: z.boolean(),
  message: z.string().max(300),
  link: z.string().max(500).optional(),
  linkLabel: z.string().max(80).optional(),
  dismissible: z.boolean().optional(),
  backgroundColor: z.string().nullable().optional(),
  textColor: z.string().nullable().optional(),
});

const appearanceSchema = z.object({
  themeId: z.enum(['aura', 'noir', 'form', 'atelier', 'pulse']).optional(),
  themeVersion: z.string().optional(),
  preset: z.enum(['minimal', 'editorial', 'modern', 'luxury', 'bold']).optional(),
  typography: z.enum(['modern', 'editorial', 'minimal', 'luxury']).optional(),
  radius: z.enum(['none', 'sm', 'md', 'lg']).optional(),
});

const sectionSchema = z.object({
  id: z.string(),
  type: z.enum([
    'hero',
    'featured-products',
    'featured-collection',
    'category-showcase',
    'promotional-banner',
    'brand-story',
    'newsletter',
    'rich-text',
  ]),
  enabled: z.boolean(),
  config: z.record(z.unknown()).optional(),
});

const seoSchema = z.object({
  title: z.string().max(120).optional(),
  description: z.string().max(320).optional(),
  ogImageUrl: z.string().nullable().optional(),
  indexable: z.boolean().optional(),
});

const policiesSchema = z.object({
  shipping: z.string().max(20000).optional(),
  returns: z.string().max(20000).optional(),
  privacy: z.string().max(20000).optional(),
  terms: z.string().max(20000).optional(),
});

const themeSettingsSchema = z.object({
  hero: heroSchema.optional(),
  announcement: announcementSchema.optional(),
  appearance: appearanceSchema.optional(),
  sections: z.array(sectionSchema).optional(),
  seo: seoSchema.optional(),
  policies: policiesSchema.optional(),
});

const socialLinksSchema = z
  .object({
    instagram: z.string().max(200).nullable().optional(),
    facebook: z.string().max(200).nullable().optional(),
    tiktok: z.string().max(200).nullable().optional(),
    twitter: z.string().max(200).nullable().optional(),
    whatsapp: z.string().max(30).nullable().optional(),
  })
  .optional();

export async function GET() {
  try {
    const ctx = await requireTenantContext('store.read');
    const store = await getStoreSettings(ctx.organizationId, ctx.storeId ?? undefined);
    return Response.json({ store });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await requireTenantContext('store.write');
    const store = await getStoreSettings(ctx.organizationId, ctx.storeId ?? undefined);
    const body = await request.json();

    const data = z
      .object({
        name: z.string().min(2).max(120).optional(),
        publicSlug: z.string().min(2).max(80).optional(),
        description: z.string().max(2000).nullable().optional(),
        contactEmail: z.string().email().nullable().optional(),
        contactPhone: z.string().nullable().optional(),
        currency: z.string().length(3).nullable().optional(),
        country: allowedCountrySchema.nullable().optional(),
        timezone: z.string().nullable().optional(),
        status: z.enum(['ACTIVE', 'PAUSED', 'MAINTENANCE']).optional(),
        primaryColor: z.string().nullable().optional(),
        secondaryColor: z.string().nullable().optional(),
        taxRateBps: z.number().int().min(0).max(10000).optional(),
        socialLinks: socialLinksSchema,
        themeSettings: themeSettingsSchema.nullable().optional(),
      })
      .parse(body);

    if (data.socialLinks?.whatsapp) {
      if (!normalizePhoneDigits(data.socialLinks.whatsapp)) {
        return Response.json({ error: 'INVALID_WHATSAPP' }, { status: 400 });
      }
    }
    if (data.contactPhone) {
      if (!normalizePhoneDigits(data.contactPhone)) {
        return Response.json({ error: 'INVALID_PHONE' }, { status: 400 });
      }
    }

    const { themeSettings, ...rest } = data;
    const updated = await updateStoreSettings(ctx.organizationId, store.id, {
      ...rest,
      ...(themeSettings !== undefined && {
        themeSettings:
          themeSettings === null
            ? null
            : mergeThemeSettingsInput(store.themeSettings, themeSettings),
      }),
    });
    return Response.json({ store: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
    }
    return handleApiError(err);
  }
}
