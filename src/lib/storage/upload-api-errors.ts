import { NextResponse } from 'next/server';
import {
  parseUploadErrorCode,
  uploadErrorMessage,
} from '@/lib/storage/file-validation';

/** Map storage/upload errors to JSON responses for all media API routes. */
export function mediaUploadErrorResponse(err: unknown): NextResponse | null {
  if (!(err instanceof Error)) return null;

  const code = parseUploadErrorCode(err.message);
  if (!code) return null;

  return NextResponse.json(
    {
      error: code,
      message: uploadErrorMessage(code, err.message),
    },
    { status: 400 }
  );
}
