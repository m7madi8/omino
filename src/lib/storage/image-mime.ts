export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export const FAVICON_ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon'] as const;

export type ImageMime = (typeof IMAGE_ALLOWED_TYPES)[number];
export type FaviconMime = (typeof FAVICON_ALLOWED_TYPES)[number];

export function detectImageMime(buffer: Buffer): ImageMime | null {
  if (isHeicOrHeifBuffer(buffer)) {
    return null;
  }

  if (
    buffer.length >= 4 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }

  return null;
}

/** iPhone / Android HEIC — not supported for product images. */
export function isHeicOrHeifBuffer(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  if (buffer.toString('ascii', 4, 8) !== 'ftyp') return false;
  const brand = buffer.toString('ascii', 8, 12).toLowerCase();
  return (
    brand.startsWith('hei') ||
    brand === 'mif1' ||
    brand === 'msf1' ||
    brand === 'hevc' ||
    brand === 'heix'
  );
}

export function detectFaviconMime(buffer: Buffer): FaviconMime | null {
  const imageMime = detectImageMime(buffer);
  if (imageMime) return imageMime;

  if (buffer.length >= 4 && buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x01 && buffer[3] === 0x00) {
    return 'image/x-icon';
  }

  return null;
}

export function extensionForMime(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/x-icon' || mime === 'image/vnd.microsoft.icon') return 'ico';
  return 'bin';
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}
