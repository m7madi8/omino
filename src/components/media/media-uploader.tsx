'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type MediaUploaderState = 'empty' | 'uploading' | 'success' | 'error' | 'removing';

export type MediaUploaderProps = {
  label: string;
  hint?: string;
  accept?: string;
  maxBytes?: number;
  value?: string | null;
  filename?: string | null;
  disabled?: boolean;
  emptyTitle?: string;
  emptyHint?: string;
  previewClassName?: string;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => Promise<void>;
};

const DEFAULT_ACCEPT = 'image/png,image/jpeg,image/webp';
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;

function validateFile(file: File, accept: string, maxBytes: number): string | null {
  const allowed = accept.split(',').map((item) => item.trim());
  if (!allowed.includes(file.type)) {
    return 'File type is not supported.';
  }
  if (file.size > maxBytes) {
    return `File must be ${Math.round(maxBytes / (1024 * 1024))} MB or smaller.`;
  }
  return null;
}

export function MediaUploader({
  label,
  hint,
  accept = DEFAULT_ACCEPT,
  maxBytes = DEFAULT_MAX_BYTES,
  value,
  filename,
  disabled = false,
  emptyTitle = 'Upload image',
  emptyHint = 'PNG, JPG, or WEBP',
  previewClassName,
  onUpload,
  onRemove,
}: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [state, setState] = useState<MediaUploaderState>(value ? 'success' : 'empty');
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [localName, setLocalName] = useState<string | null>(filename || null);

  const previewUrl = localPreview || value || null;
  const displayName = localName || filename || null;

  useEffect(() => {
    if (value) {
      setState((current) => (current === 'uploading' || current === 'removing' ? current : 'success'));
    } else if (state !== 'uploading' && state !== 'removing') {
      setState('empty');
      setLocalPreview(null);
      setLocalName(null);
    }
  }, [value, state]);

  const runUpload = useCallback(
    async (file: File) => {
      const validationError = validateFile(file, accept, maxBytes);
      if (validationError) {
        setState('error');
        setError(validationError);
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      setLocalPreview(objectUrl);
      setLocalName(file.name);
      setState('uploading');
      setError(null);

      try {
        await onUpload(file);
        setState('success');
      } catch (err) {
        setState('error');
        setError(err instanceof Error ? err.message : 'Upload failed');
      }
    },
    [accept, maxBytes, onUpload]
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const file = Array.from(files)[0];
      if (!file) return;
      void runUpload(file);
    },
    [runUpload]
  );

  async function handleRemove() {
    if (!onRemove) return;
    setState('removing');
    setError(null);
    try {
      await onRemove();
      if (localPreview) URL.revokeObjectURL(localPreview);
      setLocalPreview(null);
      setLocalName(null);
      setState('empty');
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Could not remove image');
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-stone-2">{label}</p>
        {hint && <p className="text-xs text-stone mt-1">{hint}</p>}
      </div>

      {!previewUrl ? (
        <div
          className={cn(
            'rounded-md border-2 border-dashed p-8 text-center transition',
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
            if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
          }}
        >
          <ImagePlus className="w-8 h-8 mx-auto text-stone mb-3" />
          <p className="text-sm text-ink font-medium">{emptyTitle}</p>
          <p className="text-xs text-stone-2 mt-1">{emptyHint}</p>
          <p className="text-xs text-stone mt-3">Drag & drop image here</p>
          <p className="text-xs text-stone-2 mt-1">or</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || state === 'uploading' || state === 'removing'}
          >
            {state === 'uploading' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading…
              </>
            ) : (
              'Upload image'
            )}
          </Button>
        </div>
      ) : (
        <div className="rounded-md border border-hairline bg-white p-4 space-y-4">
          <div
            className={cn(
              'relative overflow-hidden rounded-sm border border-hairline bg-paper-2',
              previewClassName || 'aspect-[16/10] max-h-56'
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="" className="w-full h-full object-cover" />
            {(state === 'uploading' || state === 'removing') && (
              <div className="absolute inset-0 bg-ink/45 flex items-center justify-center text-paper text-sm gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                {state === 'uploading' ? 'Uploading…' : 'Removing…'}
              </div>
            )}
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {displayName && <p className="text-sm text-ink truncate">{displayName}</p>}
              <p className="text-xs text-stone-2 mt-1">
                {state === 'error' ? 'Upload failed' : state === 'success' ? 'Uploaded' : 'Processing'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={disabled || state === 'uploading' || state === 'removing'}
              >
                Replace
              </Button>
              {onRemove && (
                <button
                  type="button"
                  className="rounded-full border border-hairline p-2 text-stone-2 hover:text-ink hover:border-accent transition"
                  onClick={() => void handleRemove()}
                  disabled={disabled || state === 'uploading' || state === 'removing'}
                  aria-label="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {state === 'error' && error && (
            <div className="rounded-sm border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger flex items-center justify-between gap-3">
              <span>{error}</span>
              <button
                type="button"
                className="inline-flex items-center gap-1 underline"
                onClick={() => inputRef.current?.click()}
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
