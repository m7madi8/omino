import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { handleApiError, requireTenantContext } from '@/lib/api/tenant';
import { IMAGE_MAX_BYTES } from '@/lib/storage/image-mime';
import {
  deleteStoreAssetFile,
  saveStoreAssetFile,
  type StoreAssetKind,
} from '@/lib/storage/store-assets';
import { getStoreSettings } from '@/server/services/store-service';
import { prisma } from '@/lib/db';
import {
  parseExperienceDocument,
  updateDraft,
} from '@/lib/storefront/store-experience-engine';

const ASSET_TYPES = ['logo', 'favicon', 'hero', 'hero-mobile'] as const;

function isAssetType(value: string): value is StoreAssetKind {
  return (ASSET_TYPES as readonly string[]).includes(value);
}

async function updateHeroImage(
  organizationId: string,
  storeId: string,
  kind: 'hero' | 'hero-mobile',
  url: string | null
) {
  const store = await prisma.store.findFirst({ where: { id: storeId, organizationId } });
  if (!store) throw new Error('NOT_FOUND');

  const doc = parseExperienceDocument(store.themeSettings);
  const hero = doc.draft.hero;
  const nextHero = {
    ...hero,
    imageUrl: kind === 'hero' ? url : hero.imageUrl ?? null,
    mobileImageUrl: kind === 'hero-mobile' ? url : hero.mobileImageUrl ?? null,
  };
  const nextDoc = updateDraft(doc, { hero: nextHero });

  return prisma.store.update({
    where: { id: storeId },
    data: {
      themeSettings: nextDoc as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function POST(request: Request) {
  try {
    const ctx = await requireTenantContext('store.write');
    const store = await getStoreSettings(ctx.organizationId, ctx.storeId ?? undefined);
    const formData = await request.formData();
    const file = formData.get('file');
    const type = String(formData.get('type') || '');

    if (!isAssetType(type)) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Invalid asset type' }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'file is required' }, { status: 400 });
    }

    if (file.size > IMAGE_MAX_BYTES) {
      return NextResponse.json({ error: 'FILE_TOO_LARGE' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const saved = await saveStoreAssetFile(ctx.organizationId, store.id, type, buffer);

    if (type === 'logo') {
      if (store.logoUrl) {
        await deleteStoreAssetFile(store.logoUrl, ctx.organizationId, store.id);
      }
      const updated = await prisma.store.update({
        where: { id: store.id },
        data: { logoUrl: saved.url },
      });
      return NextResponse.json({ url: saved.url, store: updated }, { status: 201 });
    }

    if (type === 'favicon') {
      if (store.faviconUrl) {
        await deleteStoreAssetFile(store.faviconUrl, ctx.organizationId, store.id);
      }
      const updated = await prisma.store.update({
        where: { id: store.id },
        data: { faviconUrl: saved.url },
      });
      return NextResponse.json({ url: saved.url, store: updated }, { status: 201 });
    }

    const hero = parseExperienceDocument(store.themeSettings).draft.hero;
    const previousUrl = type === 'hero' ? hero.imageUrl : hero.mobileImageUrl;
    if (previousUrl) {
      await deleteStoreAssetFile(previousUrl, ctx.organizationId, store.id);
    }

    const updated = await updateHeroImage(
      ctx.organizationId,
      store.id,
      type,
      saved.url
    );

    return NextResponse.json({ url: saved.url, store: updated }, { status: 201 });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'INVALID_FILE_TYPE') {
        return NextResponse.json({ error: 'INVALID_FILE_TYPE' }, { status: 400 });
      }
      if (err.message === 'FILE_TOO_LARGE') {
        return NextResponse.json({ error: 'FILE_TOO_LARGE' }, { status: 400 });
      }
    }
    return handleApiError(err);
  }
}

export async function DELETE(request: Request) {
  try {
    const ctx = await requireTenantContext('store.write');
    const store = await getStoreSettings(ctx.organizationId, ctx.storeId ?? undefined);
    const body = await request.json();
    const parsed = z.object({ type: z.enum(ASSET_TYPES) }).parse(body);
    const { type } = parsed;

    if (type === 'logo') {
      if (store.logoUrl) {
        await deleteStoreAssetFile(store.logoUrl, ctx.organizationId, store.id);
      }
      const updated = await prisma.store.update({
        where: { id: store.id },
        data: { logoUrl: null },
      });
      return NextResponse.json({ store: updated });
    }

    if (type === 'favicon') {
      if (store.faviconUrl) {
        await deleteStoreAssetFile(store.faviconUrl, ctx.organizationId, store.id);
      }
      const updated = await prisma.store.update({
        where: { id: store.id },
        data: { faviconUrl: null },
      });
      return NextResponse.json({ store: updated });
    }

    const hero = parseExperienceDocument(store.themeSettings).draft.hero;
    const previousUrl = type === 'hero' ? hero.imageUrl : hero.mobileImageUrl;
    if (previousUrl) {
      await deleteStoreAssetFile(previousUrl, ctx.organizationId, store.id);
    }

    const updated = await updateHeroImage(ctx.organizationId, store.id, type, null);
    return NextResponse.json({ store: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
    }
    return handleApiError(err);
  }
}
