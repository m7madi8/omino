export async function uploadStoreMedia<TStore = Record<string, unknown>>(
  type: 'logo' | 'favicon' | 'hero' | 'hero-mobile',
  file: File
) {
  const formData = new FormData();
  formData.append('type', type);
  formData.append('file', file);

  const res = await fetch('/api/store/media', {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Upload failed');
  }
  return data as { url: string; store: TStore };
}

export async function deleteStoreMedia<TStore = Record<string, unknown>>(
  type: 'logo' | 'favicon' | 'hero' | 'hero-mobile'
) {
  const res = await fetch('/api/store/media', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Delete failed');
  }
  return data as { store: TStore };
}
