'use client';

import { useCallback, useRef, useState } from 'react';
import { ImagePlus, Loader2, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { IMAGE_MAX_BYTES } from '@/lib/storage/image-mime';
import {
  STANDARD_IMAGE_ACCEPT,
  uploadErrorFromResponse,
  validateImageFile,
} from '@/lib/storage/file-validation';

const ACCEPT = STANDARD_IMAGE_ACCEPT;
const MAX_BYTES = IMAGE_MAX_BYTES;

export type PendingProductImage = {
  id: string;
  file: File;
  previewUrl: string;
  status: 'ready' | 'uploading' | 'error';
  error?: string;
};

export type ExistingProductImage = {
  id: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
};

function validateFile(file: File): string | null {
  const result = validateImageFile(file, { maxBytes: MAX_BYTES });
  return result.ok ? null : result.message;
}

export async function uploadProductImageFile(
  productId: string,
  file: File,
  options?: { isPrimary?: boolean; altText?: string }
) {
  const formData = new FormData();
  formData.append('file', file);
  if (options?.isPrimary) formData.append('isPrimary', 'true');
  if (options?.altText) formData.append('altText', options.altText);

  const res = await fetch(`/api/products/${productId}/images`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(uploadErrorFromResponse(data));
  }
  return data;
}

export function ProductImageUpload({
  mode,
  productId,
  existingImages = [],
  pendingImages,
  onPendingChange,
  onExistingChange,
  disabled = false,
}: {
  mode: 'create' | 'edit';
  productId?: string;
  existingImages?: ExistingProductImage[];
  pendingImages?: PendingProductImage[];
  onPendingChange?: (images: PendingProductImage[]) => void;
  onExistingChange?: (images: ExistingProductImage[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files);
      if (!list.length) return;

      if (mode === 'create') {
        const next = [...(pendingImages || [])];
        for (const file of list) {
          const validationError = validateFile(file);
          next.push({
            id: crypto.randomUUID(),
            file,
            previewUrl: URL.createObjectURL(file),
            status: validationError ? 'error' : 'ready',
            error: validationError || undefined,
          });
        }
        onPendingChange?.(next);
        return;
      }

      if (!productId) return;
      void (async () => {
        for (const file of list) {
          const validationError = validateFile(file);
          if (validationError) {
            setUploadError(validationError);
            continue;
          }
          const tempId = crypto.randomUUID();
          setUploadingId(tempId);
          setUploadError(null);
          try {
            const result = await uploadProductImageFile(productId, file, {
              isPrimary: existingImages.length === 0,
            });
            onExistingChange?.(
              result.product.images.map(
                (img: ExistingProductImage) => ({
                  id: img.id,
                  url: img.url,
                  altText: img.altText,
                  isPrimary: img.isPrimary,
                })
              )
            );
          } catch (err) {
            setUploadError(err instanceof Error ? err.message : 'Upload failed');
          } finally {
            setUploadingId(null);
          }
        }
      })();
    },
    [existingImages.length, mode, onExistingChange, onPendingChange, pendingImages, productId]
  );

  function removePending(id: string) {
    const target = pendingImages?.find((img) => img.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    onPendingChange?.((pendingImages || []).filter((img) => img.id !== id));
  }

  async function retryPending(image: PendingProductImage) {
    const validationError = validateFile(image.file);
    if (validationError) {
      onPendingChange?.(
        (pendingImages || []).map((img) =>
          img.id === image.id ? { ...img, status: 'error', error: validationError } : img
        )
      );
      return;
    }
    onPendingChange?.(
      (pendingImages || []).map((img) =>
        img.id === image.id ? { ...img, status: 'ready', error: undefined } : img
      )
    );
  }

  async function removeExisting(imageId: string) {
    if (!productId) return;
    const res = await fetch(`/api/products/${productId}/images/${imageId}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) {
      window.alert(data.error || 'Could not remove image');
      return;
    }
    onExistingChange?.(
      data.product.images.map((img: ExistingProductImage) => ({
        id: img.id,
        url: img.url,
        altText: img.altText,
        isPrimary: img.isPrimary,
      }))
    );
  }

  async function reorderImages(nextOrder: ExistingProductImage[]) {
    if (!productId) return;
    const res = await fetch(`/api/products/${productId}/images`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'reorder',
        imageIds: nextOrder.map((img) => img.id),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      window.alert(data.error || 'Could not reorder images');
      return;
    }
    onExistingChange?.(
      data.product.images.map((img: ExistingProductImage) => ({
        id: img.id,
        url: img.url,
        altText: img.altText,
        isPrimary: img.isPrimary,
      }))
    );
  }

  function moveExisting(imageId: string, direction: -1 | 1) {
    const index = existingImages.findIndex((img) => img.id === imageId);
    if (index < 0) return;
    const target = index + direction;
    if (target < 0 || target >= existingImages.length) return;
    const next = [...existingImages];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    void reorderImages(next);
  }

  async function setPrimary(imageId: string) {
    if (!productId) return;
    const res = await fetch(`/api/products/${productId}/images/${imageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'setPrimary' }),
    });
    const data = await res.json();
    if (!res.ok) {
      window.alert(data.error || 'Could not set primary image');
      return;
    }
    onExistingChange?.(
      data.product.images.map((img: ExistingProductImage) => ({
        id: img.id,
        url: img.url,
        altText: img.altText,
        isPrimary: img.isPrimary,
      }))
    );
  }

  const showPending = mode === 'create' && pendingImages && pendingImages.length > 0;
  const showExisting = mode === 'edit' && existingImages.length > 0;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-stone-2">Product images</p>
        <p className="text-xs text-stone mt-1">PNG, JPG, or WEBP · up to 5 MB each</p>
      </div>

      <div
        className={cn(
          'rounded-md border-2 border-dashed p-6 sm:p-8 text-center transition touch-manipulation',
          dragOver ? 'border-accent bg-accent-soft/20' : 'border-hairline bg-paper',
          disabled && 'opacity-60 pointer-events-none'
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
        }}
      >
        <ImagePlus className="w-8 h-8 mx-auto text-stone mb-3" />
        <p className="text-sm text-ink font-medium">Drag & drop images here</p>
        <p className="text-xs text-stone-2 mt-1">or</p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-3 min-h-[44px] touch-manipulation"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || Boolean(uploadingId)}
        >
          {uploadingId ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading…
            </>
          ) : (
            'Choose files'
          )}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          aria-label="Choose product images"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {uploadError && (
        <p className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-sm px-3 py-2.5" role="alert">
          {uploadError}
        </p>
      )}

      {(showPending || showExisting) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {showPending &&
            pendingImages!.map((image, index) => (
              <div
                key={image.id}
                className="relative aspect-square rounded-md border border-hairline overflow-hidden bg-paper-2"
              >
                <img src={image.previewUrl} alt="" className="w-full h-full object-cover" />
                {index === 0 && image.status === 'ready' && (
                  <span className="absolute top-2 left-2 rounded-xs bg-ink/80 text-paper text-[10px] px-2 py-0.5">
                    Primary
                  </span>
                )}
                {image.status === 'error' && (
                  <div className="absolute inset-0 bg-danger/80 text-white text-xs p-2 flex flex-col justify-end gap-2">
                    <p>{image.error}</p>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 underline"
                      onClick={() => void retryPending(image)}
                    >
                      <RefreshCw className="w-3 h-3" />
                      Retry
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  className="absolute top-2 right-2 rounded-full bg-ink/80 text-paper p-1"
                  onClick={() => removePending(image.id)}
                  aria-label="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

          {showExisting &&
            existingImages.map((image) => (
              <div
                key={image.id}
                className="relative aspect-square rounded-md border border-hairline overflow-hidden bg-paper-2"
              >
                <img src={image.url} alt={image.altText || ''} className="w-full h-full object-cover" />
                {image.isPrimary && (
                  <span className="absolute top-2 left-2 rounded-xs bg-ink/80 text-paper text-[10px] px-2 py-0.5">
                    Primary
                  </span>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    type="button"
                    className="rounded-xs bg-ink/80 text-paper text-[10px] px-2 py-1"
                    onClick={() => moveExisting(image.id, -1)}
                    aria-label="Move image earlier"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className="rounded-xs bg-ink/80 text-paper text-[10px] px-2 py-1"
                    onClick={() => moveExisting(image.id, 1)}
                    aria-label="Move image later"
                  >
                    →
                  </button>
                  {!image.isPrimary && (
                    <button
                      type="button"
                      className="rounded-xs bg-ink/80 text-paper text-[10px] px-2 py-1"
                      onClick={() => void setPrimary(image.id)}
                    >
                      Primary
                    </button>
                  )}
                  <button
                    type="button"
                    className="rounded-full bg-ink/80 text-paper p-1"
                    onClick={() => void removeExisting(image.id)}
                    aria-label="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export async function uploadPendingProductImages(
  productId: string,
  images: PendingProductImage[]
) {
  const readyImages = images.filter((img) => img.status === 'ready');
  for (let i = 0; i < readyImages.length; i += 1) {
    const image = readyImages[i];
    await uploadProductImageFile(productId, image.file, { isPrimary: i === 0 });
  }
}
