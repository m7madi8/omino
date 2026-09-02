import { deleteMediaFile, saveMediaFile } from '@/server/services/media-service';
import path from 'path';
import {
  type FaviconMime,
  type ImageMime,
} from '@/lib/storage/image-mime';

export type StoreAssetKind = 'logo' | 'favicon' | 'hero' | 'hero-mobile';

const KIND_DIRS: Record<StoreAssetKind, string> = {
  logo: 'logo',
  favicon: 'favicon',
  hero: 'hero',
  'hero-mobile': 'hero-mobile',
};

export function storeAssetRelativeDir(organizationId: string, storeId: string, kind: StoreAssetKind) {
  return path.join('uploads', 'organizations', organizationId, 'stores', storeId, KIND_DIRS[kind]);
}

export function storeAssetPublicUrl(
  organizationId: string,
  storeId: string,
  kind: StoreAssetKind,
  filename: string
) {
  return `/uploads/organizations/${organizationId}/stores/${storeId}/${KIND_DIRS[kind]}/${filename}`;
}

export function isStoreAssetUrl(publicUrl: string, organizationId: string, storeId: string) {
  const prefix = `/uploads/organizations/${organizationId}/stores/${storeId}/`;
  return publicUrl.startsWith(prefix) || publicUrl.includes(`/organizations/${organizationId}/stores/${storeId}/`);
}

export async function saveStoreAssetFile(
  organizationId: string,
  storeId: string,
  kind: StoreAssetKind,
  buffer: Buffer
): Promise<{ url: string; filename: string; mime: ImageMime | FaviconMime }> {
  const saved = await saveMediaFile({
    organizationId,
    segments: ['stores', storeId, KIND_DIRS[kind]],
    buffer,
    localRelativeDir: storeAssetRelativeDir(organizationId, storeId, kind),
    isFavicon: kind === 'favicon',
  });

  return { url: saved.url, filename: saved.filename, mime: saved.mime };
}

export async function deleteStoreAssetFile(
  publicUrl: string,
  organizationId: string,
  storeId: string
) {
  if (!isStoreAssetUrl(publicUrl, organizationId, storeId)) return;

  await deleteMediaFile({
    url: publicUrl,
    organizationId,
    allowedPathPrefix: `/uploads/organizations/${organizationId}/stores/${storeId}/`,
  });
}
