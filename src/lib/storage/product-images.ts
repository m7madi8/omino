import path from 'path';
import { deleteMediaFile, saveMediaFile } from '@/server/services/media-service';
import {
  detectImageMime,
  IMAGE_MAX_BYTES,
  type ImageMime,
} from '@/lib/storage/image-mime';

export const PRODUCT_IMAGE_MAX_BYTES = IMAGE_MAX_BYTES;
export const PRODUCT_IMAGE_ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export type ProductImageMime = ImageMime;

export function detectProductImageMime(buffer: Buffer): ProductImageMime | null {
  return detectImageMime(buffer);
}

export function productImageRelativeDir(organizationId: string, productId: string) {
  return path.join('uploads', 'organizations', organizationId, 'products', productId);
}

export function productImagePublicUrl(organizationId: string, productId: string, filename: string) {
  return `/uploads/organizations/${organizationId}/products/${productId}/${filename}`;
}

export function productImagePublicUrlFromPath(publicUrl: string): string | null {
  if (!publicUrl.startsWith('/uploads/organizations/') && !publicUrl.includes('/organizations/')) {
    return null;
  }
  return publicUrl;
}

export async function saveProductImageFile(
  organizationId: string,
  productId: string,
  buffer: Buffer
): Promise<{ url: string; filename: string; mime: ProductImageMime }> {
  const saved = await saveMediaFile({
    organizationId,
    segments: ['products', productId],
    buffer,
    localRelativeDir: productImageRelativeDir(organizationId, productId),
  });

  return { url: saved.url, filename: saved.filename, mime: saved.mime as ProductImageMime };
}

export async function deleteProductImageFile(publicUrl: string) {
  const match = publicUrl.match(
    /^\/uploads\/organizations\/([^/]+)\/products\/([^/]+)\/([^/]+)$/
  );
  const orgFromSupabase = publicUrl.match(/organizations\/([^/]+)\/products\//);
  const organizationId = match?.[1] || orgFromSupabase?.[1];
  if (!organizationId) return;

  await deleteMediaFile({
    url: publicUrl,
    organizationId,
    allowedPathPrefix: `/uploads/organizations/${organizationId}/products/`,
  });
}
