/** Client-side product image validation — mobile-safe (empty MIME, HEIC, extension fallback). */

const ALLOWED_MIMES = new Set(['image/png', 'image/jpeg', 'image/webp']);

export type ImageValidationResult =
  | { ok: true; effectiveMime: string }
  | { ok: false; code: string; message: string };

export function inferMimeFromFilename(filename: string): string | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (!ext) return null;
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic' || ext === 'heif') return 'image/heic';
  return null;
}

export function resolveClientImageMime(file: File): string {
  const fromType = file.type?.split(';')[0]?.trim().toLowerCase() || '';
  if (fromType) return fromType;
  return inferMimeFromFilename(file.name) || '';
}

export function validateProductImageFile(
  file: File,
  maxBytes: number
): ImageValidationResult {
  const mime = resolveClientImageMime(file);

  if (mime === 'image/heic' || mime === 'image/heif') {
    return {
      ok: false,
      code: 'HEIC_NOT_SUPPORTED',
      message:
        'HEIC photos are not supported. On iPhone use Settings → Camera → Formats → Most Compatible, or pick a JPG/PNG photo.',
    };
  }

  if (mime && !ALLOWED_MIMES.has(mime)) {
    return {
      ok: false,
      code: 'INVALID_FILE_TYPE',
      message: 'Only PNG, JPG, and WEBP images are allowed.',
    };
  }

  if (!mime) {
    return {
      ok: false,
      code: 'INVALID_FILE_TYPE',
      message: 'Could not detect image type. Try JPG or PNG.',
    };
  }

  if (file.size > maxBytes) {
    return {
      ok: false,
      code: 'FILE_TOO_LARGE',
      message: `Image must be ${Math.round(maxBytes / (1024 * 1024))} MB or smaller.`,
    };
  }

  if (file.size === 0) {
    return {
      ok: false,
      code: 'EMPTY_FILE',
      message: 'The selected file is empty. Try again.',
    };
  }

  return { ok: true, effectiveMime: mime };
}

export function uploadErrorMessage(code: string, fallback?: string): string {
  const map: Record<string, string> = {
    INVALID_FILE_TYPE: 'Only PNG, JPG, and WEBP images are allowed.',
    FILE_TOO_LARGE: 'Image is too large (max 5 MB).',
    HEIC_NOT_SUPPORTED:
      'HEIC format is not supported. Save as JPG or enable Most Compatible on iPhone Camera settings.',
    STORAGE_UPLOAD_FAILED: 'Cloud storage upload failed. Try again in a moment.',
    SUPABASE_NOT_CONFIGURED: 'File storage is not configured on the server.',
    STORAGE_BUCKET_MISSING: 'Media storage is not ready. Contact support.',
    EMPTY_FILE: 'The file appears empty. Try selecting the photo again.',
    FORBIDDEN: 'You do not have permission to upload here.',
    VALIDATION_ERROR: 'Invalid upload request.',
  };
  return map[code] || fallback || code || 'Upload failed';
}
