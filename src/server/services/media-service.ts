import { randomUUID } from 'crypto';
import path from 'path';
import { mkdir, unlink, writeFile } from 'fs/promises';
import {
  detectFaviconMime,
  detectImageMime,
  extensionForMime,
  IMAGE_MAX_BYTES,
  type FaviconMime,
  type ImageMime,
} from '@/lib/storage/image-mime';
import { SUPABASE_MEDIA_BUCKET, isSupabaseStorageConfigured } from '@/lib/supabase/config';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export type SavedMediaFile = {
  url: string;
  filename: string;
  mime: ImageMime | FaviconMime;
  storagePath: string;
};

function sanitizeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '');
}

function buildStoragePath(segments: string[], filename: string): string {
  return segments.map(sanitizeSegment).join('/') + '/' + filename;
}

async function saveLocal(
  relativeDir: string,
  buffer: Buffer,
  mime: ImageMime | FaviconMime
): Promise<SavedMediaFile> {
  const filename = `${randomUUID()}.${extensionForMime(mime)}`;
  const dir = path.join(process.cwd(), 'public', relativeDir);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  const publicUrl = `/${relativeDir.replace(/\\/g, '/')}/${filename}`;
  return {
    url: publicUrl,
    filename,
    mime,
    storagePath: publicUrl,
  };
}

async function saveSupabase(
  storagePath: string,
  buffer: Buffer,
  mime: ImageMime | FaviconMime
): Promise<SavedMediaFile> {
  const admin = getSupabaseAdmin();
  const { error } = await admin.storage.from(SUPABASE_MEDIA_BUCKET).upload(storagePath, buffer, {
    contentType: mime,
    upsert: false,
  });
  if (error) throw new Error(`STORAGE_UPLOAD_FAILED: ${error.message}`);

  const { data } = admin.storage.from(SUPABASE_MEDIA_BUCKET).getPublicUrl(storagePath);
  const filename = path.basename(storagePath);
  return {
    url: data.publicUrl,
    filename,
    mime,
    storagePath,
  };
}

export async function saveMediaFile(input: {
  organizationId: string;
  segments: string[];
  buffer: Buffer;
  localRelativeDir: string;
  isFavicon?: boolean;
}): Promise<SavedMediaFile> {
  if (input.buffer.length > IMAGE_MAX_BYTES) {
    throw new Error('FILE_TOO_LARGE');
  }

  const mime = input.isFavicon
    ? detectFaviconMime(input.buffer)
    : detectImageMime(input.buffer);
  if (!mime) {
    throw new Error('INVALID_FILE_TYPE');
  }

  const filename = `${randomUUID()}.${extensionForMime(mime)}`;
  const storagePath = buildStoragePath(
    ['organizations', input.organizationId, ...input.segments],
    filename
  );

  if (isSupabaseStorageConfigured()) {
    return saveSupabase(storagePath, input.buffer, mime);
  }

  return saveLocal(path.join(input.localRelativeDir), input.buffer, mime);
}

export async function deleteMediaFile(input: {
  url: string;
  organizationId: string;
  allowedPathPrefix: string;
}) {
  if (isSupabaseStorageConfigured()) {
    if (!input.url.includes(SUPABASE_MEDIA_BUCKET) && !input.url.includes('/storage/v1/object/public/')) {
      // Legacy local URL — delete from disk
      await deleteLocalFile(input.url, input.allowedPathPrefix);
      return;
    }

    const marker = `/object/public/${SUPABASE_MEDIA_BUCKET}/`;
    const idx = input.url.indexOf(marker);
    if (idx === -1) return;

    const storagePath = decodeURIComponent(input.url.slice(idx + marker.length));
    if (!storagePath.startsWith(`organizations/${input.organizationId}/`)) {
      throw new Error('FORBIDDEN');
    }

    const admin = getSupabaseAdmin();
    await admin.storage.from(SUPABASE_MEDIA_BUCKET).remove([storagePath]);
    return;
  }

  await deleteLocalFile(input.url, input.allowedPathPrefix);
}

async function deleteLocalFile(publicUrl: string, allowedPrefix: string) {
  if (!publicUrl.startsWith(allowedPrefix)) return;
  const relative = publicUrl.replace(/^\//, '');
  const absolute = path.join(process.cwd(), 'public', relative);
  try {
    await unlink(absolute);
  } catch {
    // already removed
  }
}
