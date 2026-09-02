'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type CategoryOption = { id: string; name: string };

export function CategoryPicker({
  categories: initialCategories,
  value,
  onChange,
}: {
  categories: CategoryOption[];
  value: string;
  onChange: (categoryId: string) => void;
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Category name is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmed,
          description: description.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        const detail =
          data.details?.fieldErrors?.name?.[0] ||
          data.issues?.map((i: { field: string; reason: string }) => `${i.field}: ${i.reason}`).join(' · ') ||
          data.error;
        setError(detail || 'Could not create category.');
        setLoading(false);
        return;
      }

      const category = data.category as CategoryOption;
      if (!category?.id) {
        setError('Category created but response was invalid.');
        setLoading(false);
        return;
      }

      setCategories((prev) => {
        if (prev.some((c) => c.id === category.id)) return prev;
        return [...prev, category].sort((a, b) => a.name.localeCompare(b.name));
      });
      onChange(category.id);
      setName('');
      setDescription('');
      setOpen(false);
      setLoading(false);
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  const modal =
    open && mounted
      ? createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <button
              type="button"
              className="absolute inset-0 bg-ink/40"
              aria-label="Close"
              onClick={() => {
                if (!loading) setOpen(false);
              }}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-category-title"
              className="relative w-full max-w-md rounded-md border border-hairline bg-white p-6 shadow-lift"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id="create-category-title" className="text-lg font-display text-ink">
                Create category
              </h3>
              <div className="mt-4 space-y-4">
                <Input
                  label="Category name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  placeholder="e.g. Skincare"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void handleCreate();
                    }
                  }}
                />
                <div>
                  <label className="block text-sm font-medium text-stone-2 mb-1.5">
                    Category description <span className="text-stone">(optional)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full rounded-sm border border-hairline bg-white px-4 py-3 text-sm"
                    placeholder="Short description…"
                  />
                </div>
                {error && (
                  <p className="text-sm text-danger" role="alert">
                    {error}
                  </p>
                )}
                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setOpen(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="button" onClick={() => void handleCreate()} disabled={loading}>
                    {loading ? 'Creating…' : 'Create category'}
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-stone-2">Category</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 rounded-sm border border-hairline px-3 text-sm bg-white"
      >
        <option value="">No category</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => {
          setError('');
          setOpen(true);
        }}
        className="text-sm text-accent font-medium hover:underline min-h-[44px] inline-flex items-center"
      >
        + Create new category
      </button>
      {modal}
    </div>
  );
}
