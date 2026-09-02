/** Shared client/server image upload validation — mobile-safe (empty MIME, HEIC, extensions). */

export const STANDARD_IMAGE_ACCEPT =
  'image/png,image/jpeg,image/webp,.jpg,.jpeg,.png,.webp,image/*';

export const FAVICON_ACCEPT =
  'image/png,image/jpeg,image/webp,image/x-icon,image/vnd.microsoft.icon,.ico,.png,.jpg,.jpeg,image/*';

const PRODUCT_MIMES = new Set(['image/png', 'image/jpeg', 'image/webp']);

const FAVICON_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/x-icon',
  'image/vnd.microsoft.icon',
]);

export type ImageValidationResult =
  | { ok: true; effectiveMime: string }
  | { ok: false; code: string; message: string };

export function inferMimeFromFilename(filename: string): string | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (!ext) return null;
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'ico') return 'image/x-icon';
  if (ext === 'heic' || ext === 'heif') return 'image/heic';
  return null;
}

export function resolveClientImageMime(file: File): string {
  const fromType = file.type?.split(';')[0]?.trim().toLowerCase() || '';
  if (fromType) return fromType;
  return inferMimeFromFilename(file.name) || '';
}

function heicError(): ImageValidationResult {
  return {
    ok: false,
    code: 'HEIC_NOT_SUPPORTED',
    message:
      'HEIC photos are not supported. On iPhone: Settings → Camera → Formats → Most Compatible, or choose a JPG/PNG photo.',
  };
}

export function validateImageFile(
  file: File,
  options: { maxBytes: number; allowFavicon?: boolean }
): ImageValidationResult {
  const mime = resolveClientImageMime(file);
  const allowed = options.allowFavicon ? FAVICON_MIMES : PRODUCT_MIMES;

  if (mime === 'image/heic' || mime === 'image/heif') {
    return heicError();
  }

  if (file.size === 0) {
    return {
      ok: false,
      code: 'EMPTY_FILE',
      message: 'The selected file is empty. Try again.',
    };
  }

  if (file.size > options.maxBytes) {
    return {
      ok: false,
      code: 'FILE_TOO_LARGE',
      message: `Image must be ${Math.round(options.maxBytes / (1024 * 1024))} MB or smaller.`,
    };
  }

  if (!mime) {
    return {
      ok: false,
      code: 'INVALID_FILE_TYPE',
      message: options.allowFavicon
        ? 'Use PNG, JPG, WEBP, or ICO.'
        : 'Could not detect image type. Try JPG or PNG.',
    };
  }

  if (!allowed.has(mime)) {
    return {
      ok: false,
      code: 'INVALID_FILE_TYPE',
      message: options.allowFavicon
        ? 'Only PNG, JPG, WEBP, and ICO files are allowed.'
        : 'Only PNG, JPG, and WEBP images are allowed.',
    };
  }

  return { ok: true, effectiveMime: mime };
}

/** @deprecated use validateImageFile */
export function validateProductImageFile(
  file: File,
  maxBytes: number
): ImageValidationResult {
  return validateImageFile(file, { maxBytes });
}

export const UPLOAD_ERROR_CODES = [
  'INVALID_FILE_TYPE',
  'FILE_TOO_LARGE',
  'HEIC_NOT_SUPPORTED',
  'EMPTY_FILE',
  'STORAGE_UPLOAD_FAILED',
  'STORAGE_BUCKET_MISSING',
  'SUPABASE_NOT_CONFIGURED',
] as const;

export type UploadErrorCode = (typeof UPLOAD_ERROR_CODES)[number];

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

export function parseUploadErrorCode(message: string): UploadErrorCode | null {
  const code = message.split(':')[0];
  return (UPLOAD_ERROR_CODES as readonly string[]).includes(code)
    ? (code as UploadErrorCode)
    : null;
}

export function uploadErrorFromResponse(data: {
  error?: string;
  message?: string;
}): string {
  return uploadErrorMessage(data.error ?? '', data.message);
}
