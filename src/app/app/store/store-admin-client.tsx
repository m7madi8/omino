'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { MediaUploader } from '@/components/media/media-uploader';
import { StoreHero } from '@/components/storefront/store-hero';
import { StorePreviewPanel } from '@/components/store-admin/store-preview-panel';
import { deleteStoreMedia, uploadStoreMedia } from '@/lib/store-media';
import type { StoreSocialLinks } from '@/types/store-contact';
import { parseSocialLinks } from '@/lib/storefront/contact-links';
import {
  type StoreHeroConfig,
} from '@/types/store-theme';
import type {
  HomepageSection,
  StoreAnnouncementConfig,
  StoreExperienceConfig,
  StoreExperienceDocument,
} from '@/types/store-experience';
import { defaultExperienceConfig } from '@/types/store-experience';
import {
  STYLE_PRESETS,
  applyStylePreset,
  parseExperienceDocument,
} from '@/lib/storefront/store-experience-engine';
import type { StoreHealthReport } from '@/lib/storefront/store-health';

type StoreSettings = {
  id: string;
  name: string;
  slug: string;
  publicSlug: string;
  status: string;
  description: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  socialLinks: StoreSocialLinks | null;
  currency: string | null;
  country: string | null;
  taxRateBps: number;
  themeSettings: unknown;
};

type TabId =
  | 'overview'
  | 'identity'
  | 'homepage'
  | 'hero'
  | 'appearance'
  | 'seo'
  | 'contact'
  | 'policies';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'identity', label: 'Identity' },
  { id: 'homepage', label: 'Homepage' },
  { id: 'hero', label: 'Hero' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'seo', label: 'SEO' },
  { id: 'contact', label: 'Contact' },
  { id: 'policies', label: 'Policies' },
];

const SECTION_LABELS: Record<HomepageSection['type'], string> = {
  hero: 'Hero',
  'featured-products': 'Featured products',
  'featured-collection': 'Featured collection',
  'category-showcase': 'Category showcase',
  'promotional-banner': 'Promotional banner',
  'brand-story': 'Brand story',
  newsletter: 'Newsletter',
  'rich-text': 'Rich text',
};

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer">
      <span className="text-sm font-medium text-stone-2">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-pill transition ${checked ? 'bg-accent' : 'bg-hairline'}`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-soft transition ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
    </label>
  );
}

export default function StoreAdminPage() {
  const [store, setStore] = useState<StoreSettings | null>(null);
  const [experienceDoc, setExperienceDoc] = useState<StoreExperienceDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState<TabId>('overview');
  const [health, setHealth] = useState<StoreHealthReport | null>(null);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false);

  const loadHealth = useCallback(() => {
    fetch('/api/store/health')
      .then((r) => r.json())
      .then((d) => {
        if (d.health) setHealth(d.health);
        setPublishedAt(d.publishedAt ?? null);
        setHasUnpublishedChanges(Boolean(d.hasUnpublishedChanges));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([fetch('/api/store/settings'), fetch('/api/store/health')])
      .then(async ([settingsRes, healthRes]) => {
        const settingsData = await settingsRes.json();
        const healthData = await healthRes.json();
        if (settingsData.store) {
          setStore({
            ...settingsData.store,
            socialLinks: parseSocialLinks(settingsData.store.socialLinks),
          });
          setExperienceDoc(parseExperienceDocument(settingsData.store.themeSettings));
        }
        if (healthData.health) setHealth(healthData.health);
        setPublishedAt(healthData.publishedAt ?? null);
        setHasUnpublishedChanges(Boolean(healthData.hasUnpublishedChanges));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const draft = useMemo(
    () => experienceDoc?.draft ?? defaultExperienceConfig(),
    [experienceDoc]
  );

  const hero = draft.hero;

  function updateDraft(patch: Partial<StoreExperienceConfig>) {
    if (!experienceDoc) return;
    setExperienceDoc({
      ...experienceDoc,
      draft: {
        ...experienceDoc.draft,
        ...patch,
        hero: patch.hero ? { ...experienceDoc.draft.hero, ...patch.hero } : experienceDoc.draft.hero,
        announcement: patch.announcement
          ? { ...experienceDoc.draft.announcement, ...patch.announcement }
          : experienceDoc.draft.announcement,
        appearance: patch.appearance
          ? { ...experienceDoc.draft.appearance, ...patch.appearance }
          : experienceDoc.draft.appearance,
        seo: patch.seo ? { ...experienceDoc.draft.seo, ...patch.seo } : experienceDoc.draft.seo,
        sections: patch.sections ?? experienceDoc.draft.sections,
        policies: patch.policies
          ? { ...experienceDoc.draft.policies, ...patch.policies }
          : experienceDoc.draft.policies,
      },
    });
    setHasUnpublishedChanges(true);
  }

  function updateHero(patch: Partial<StoreHeroConfig>) {
    updateDraft({ hero: { ...hero, ...patch } });
  }

  function updateAnnouncement(patch: Partial<StoreAnnouncementConfig>) {
    updateDraft({ announcement: { ...draft.announcement, ...patch } });
  }

  function moveSection(index: number, direction: -1 | 1) {
    const sections = [...draft.sections];
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    [sections[index], sections[target]] = [sections[target], sections[index]];
    updateDraft({ sections });
  }

  async function save(): Promise<boolean> {
    if (!store || !experienceDoc) return false;
    setSaving(true);
    setMessage('');
    const res = await fetch('/api/store/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: store.name,
        publicSlug: store.publicSlug,
        description: store.description,
        contactEmail: store.contactEmail,
        contactPhone: store.contactPhone,
        socialLinks: store.socialLinks,
        currency: store.currency,
        country: store.country,
        status: store.status,
        taxRateBps: store.taxRateBps,
        primaryColor: store.primaryColor,
        secondaryColor: store.secondaryColor,
        themeSettings: {
          hero: experienceDoc.draft.hero,
          announcement: experienceDoc.draft.announcement,
          appearance: experienceDoc.draft.appearance,
          sections: experienceDoc.draft.sections,
          seo: experienceDoc.draft.seo,
          policies: experienceDoc.draft.policies,
        },
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setStore({ ...data.store, socialLinks: parseSocialLinks(data.store.socialLinks) });
      setExperienceDoc(parseExperienceDocument(data.store.themeSettings));
      setMessage('Draft saved');
      loadHealth();
      return true;
    }
    setMessage(data.error || 'Save failed');
    return false;
  }

  async function publish() {
    setPublishing(true);
    setMessage('');
    const saved = await save();
    if (!saved) {
      setPublishing(false);
      return;
    }
    const res = await fetch('/api/store/publish', { method: 'POST' });
    const data = await res.json();
    setPublishing(false);
    if (res.ok) {
      setStore({ ...data.store, socialLinks: parseSocialLinks(data.store.socialLinks) });
      setExperienceDoc(parseExperienceDocument(data.store.themeSettings));
      setPublishedAt(data.publishedAt ?? new Date().toISOString());
      setHasUnpublishedChanges(false);
      setMessage('Store published');
      loadHealth();
    } else {
      setMessage(data.error || 'Publish failed');
    }
  }

  async function applyStoreFromMediaResponse(data: { store: StoreSettings }) {
    setStore({ ...data.store, socialLinks: parseSocialLinks(data.store.socialLinks) });
    setExperienceDoc(parseExperienceDocument(data.store.themeSettings));
    setHasUnpublishedChanges(true);
  }

  if (loading) return <p className="text-stone-2">Loading store settings…</p>;
  if (!store || !experienceDoc) return <p className="text-stone-2">No store found.</p>;

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-stone mb-2">Store</p>
          <h1 className="text-3xl font-display">Experience control center</h1>
          <p className="mt-2 text-stone-2">
            Configure, preview, and publish your storefront experience
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/store/${store.publicSlug}`} target="_blank">
            <Button variant="ghost">Open live store ↗</Button>
          </Link>
          <Button variant="ghost" onClick={publish} disabled={publishing || saving}>
            {publishing ? 'Publishing…' : 'Publish'}
          </Button>
          <Button onClick={save} disabled={saving || publishing}>
            {saving ? 'Saving…' : 'Save draft'}
          </Button>
        </div>
      </div>

      {hasUnpublishedChanges && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-sm px-4 py-2">
          You have unpublished changes. Save draft, then publish to update your live store.
        </p>
      )}

      <div className="flex flex-wrap gap-2 border-b border-hairline pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm rounded-sm transition ${
              tab === t.id ? 'bg-ink text-paper' : 'text-stone-2 hover:text-ink hover:bg-paper'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Store readiness" description="Based on real configuration checks">
            <div className="space-y-4">
              <div className="flex items-end gap-3">
                <span className="text-4xl font-display">{health?.score ?? '—'}%</span>
                <span className="text-sm text-stone-2 pb-1 capitalize">{health?.status ?? ''}</span>
              </div>
              <ul className="space-y-2">
                {health?.checks.map((check) => (
                  <li key={check.id} className="flex items-start gap-2 text-sm">
                    <span className={check.passed ? 'text-green-600' : 'text-stone-2'}>
                      {check.passed ? '✓' : '○'}
                    </span>
                    <span className={check.passed ? 'text-ink' : 'text-stone-2'}>
                      {check.label}
                      {!check.passed && check.hint && (
                        <span className="block text-xs text-stone mt-0.5">{check.hint}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card title="Publication" description="Draft vs live storefront">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-stone-2">Status</dt>
                <dd className="font-medium capitalize">{store.status.toLowerCase()}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-stone-2">Live URL</dt>
                <dd>
                  <Link
                    href={`/store/${store.publicSlug}`}
                    className="text-accent hover:underline"
                    target="_blank"
                  >
                    /store/{store.publicSlug}
                  </Link>
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-stone-2">Last published</dt>
                <dd>{publishedAt ? new Date(publishedAt).toLocaleString() : 'Not yet published'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-stone-2">Unpublished changes</dt>
                <dd>{hasUnpublishedChanges ? 'Yes' : 'No'}</dd>
              </div>
            </dl>
          </Card>

          <div className="lg:col-span-2">
            <Card title="Preview storefront" description="Live preview of your draft experience">
              <StorePreviewPanel
                experience={draft}
                storeName={store.name}
                publicSlug={store.publicSlug}
                primaryColor={store.primaryColor}
                secondaryColor={store.secondaryColor}
              />
            </Card>
          </div>
        </div>
      )}

      {tab === 'identity' && (
        <Card title="Store identity" description="Name, logo, favicon, and store description">
          <div className="space-y-5">
            <Input
              label="Store name"
              value={store.name}
              onChange={(e) => setStore({ ...store, name: e.target.value })}
            />
            <Input
              label="Public URL slug"
              value={store.publicSlug}
              onChange={(e) => setStore({ ...store, publicSlug: e.target.value })}
            />
            <p className="text-xs text-stone-2 -mt-2">/store/{store.publicSlug}</p>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={store.description || ''}
                onChange={(e) => setStore({ ...store, description: e.target.value })}
                className="w-full min-h-[100px] p-3 rounded-sm border border-hairline text-sm"
              />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <MediaUploader
                label="Store logo"
                hint="Shown in your storefront header"
                value={store.logoUrl}
                emptyTitle="Upload your store logo"
                emptyHint="PNG, JPG, or WEBP · up to 5 MB"
                previewClassName="aspect-square max-h-40 max-w-[10rem] mx-auto"
                onUpload={async (file) => {
                  const data = await uploadStoreMedia<StoreSettings>('logo', file);
                  await applyStoreFromMediaResponse(data);
                }}
                onRemove={async () => {
                  const data = await deleteStoreMedia<StoreSettings>('logo');
                  await applyStoreFromMediaResponse(data);
                }}
              />
              <MediaUploader
                label="Favicon"
                hint="Browser tab icon for your store"
                accept="image/png,image/jpeg,image/webp,image/x-icon,image/vnd.microsoft.icon"
                value={store.faviconUrl}
                emptyTitle="Upload favicon"
                emptyHint="PNG, JPG, WEBP, or ICO · up to 5 MB"
                previewClassName="aspect-square max-h-24 max-w-[6rem] mx-auto"
                onUpload={async (file) => {
                  const data = await uploadStoreMedia<StoreSettings>('favicon', file);
                  await applyStoreFromMediaResponse(data);
                }}
                onRemove={async () => {
                  const data = await deleteStoreMedia<StoreSettings>('favicon');
                  await applyStoreFromMediaResponse(data);
                }}
              />
            </div>
          </div>
        </Card>
      )}

      {tab === 'homepage' && (
        <div className="space-y-6">
          <Card title="Announcement bar" description="Lightweight message above navigation">
            <div className="space-y-4">
              <Toggle
                label="Show announcement"
                checked={draft.announcement.enabled}
                onChange={(enabled) => updateAnnouncement({ enabled })}
              />
              <Input
                label="Message"
                value={draft.announcement.message}
                onChange={(e) => updateAnnouncement({ message: e.target.value })}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Link URL"
                  value={draft.announcement.link || ''}
                  onChange={(e) => updateAnnouncement({ link: e.target.value || undefined })}
                />
                <Input
                  label="Link label"
                  value={draft.announcement.linkLabel || ''}
                  onChange={(e) => updateAnnouncement({ linkLabel: e.target.value || undefined })}
                />
              </div>
              <Toggle
                label="Dismissible"
                checked={draft.announcement.dismissible}
                onChange={(dismissible) => updateAnnouncement({ dismissible })}
              />
            </div>
          </Card>

          <Card title="Homepage sections" description="Order and visibility of homepage content">
            <ul className="space-y-3">
              {draft.sections.map((section, index) => (
                <li
                  key={section.id}
                  className="flex flex-wrap items-center gap-3 p-3 rounded-sm border border-hairline"
                >
                  <span className="text-sm font-medium flex-1 min-w-[140px]">
                    {SECTION_LABELS[section.type]}
                  </span>
                  <Toggle
                    label="Visible"
                    checked={section.enabled}
                    onChange={(enabled) => {
                      const sections = draft.sections.map((s, i) =>
                        i === index ? { ...s, enabled } : s
                      );
                      updateDraft({ sections });
                    }}
                  />
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveSection(index, -1)}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      type="button"
                      disabled={index === draft.sections.length - 1}
                      onClick={() => moveSection(index, 1)}
                    >
                      ↓
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {tab === 'hero' && (
        <Card title="Hero" description="Premium storefront hero with live preview">
          <div className="space-y-6">
            <Toggle label="Show hero" checked={hero.enabled} onChange={(enabled) => updateHero({ enabled })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Layout"
                value={hero.layout}
                onChange={(e) => updateHero({ layout: e.target.value as StoreHeroConfig['layout'] })}
                options={[
                  { value: 'split', label: 'Split' },
                  { value: 'centered', label: 'Centered' },
                  { value: 'image-focused', label: 'Image focused' },
                ]}
              />
              <Select
                label="Text alignment"
                value={hero.alignment || 'left'}
                onChange={(e) => updateHero({ alignment: e.target.value as 'left' | 'center' })}
                options={[
                  { value: 'left', label: 'Left' },
                  { value: 'center', label: 'Center' },
                ]}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Eyebrow"
                value={hero.eyebrow || ''}
                onChange={(e) => updateHero({ eyebrow: e.target.value })}
              />
              <Input
                label="Headline"
                value={hero.title || ''}
                onChange={(e) => updateHero({ title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={hero.description || ''}
                onChange={(e) => updateHero({ description: e.target.value })}
                className="w-full min-h-[96px] p-3 rounded-sm border border-hairline text-sm"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Primary CTA label"
                value={hero.primaryCta?.label || ''}
                onChange={(e) =>
                  updateHero({
                    primaryCta: {
                      label: e.target.value,
                      href: hero.primaryCta?.href || `/store/${store.publicSlug}/products`,
                    },
                  })
                }
              />
              <Input
                label="Primary CTA link"
                value={hero.primaryCta?.href || ''}
                onChange={(e) =>
                  updateHero({
                    primaryCta: {
                      label: hero.primaryCta?.label || 'Shop collection',
                      href: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <MediaUploader
                label="Hero image"
                hint="Main hero visual"
                value={hero.imageUrl}
                emptyTitle="Upload hero image"
                emptyHint="PNG, JPG, or WEBP · up to 5 MB"
                onUpload={async (file) => {
                  const data = await uploadStoreMedia<StoreSettings>('hero', file);
                  await applyStoreFromMediaResponse(data);
                }}
                onRemove={async () => {
                  const data = await deleteStoreMedia<StoreSettings>('hero');
                  await applyStoreFromMediaResponse(data);
                }}
              />
              <MediaUploader
                label="Mobile hero image"
                hint="Optional image optimized for mobile"
                value={hero.mobileImageUrl}
                emptyTitle="Upload mobile hero image"
                emptyHint="PNG, JPG, or WEBP · up to 5 MB"
                onUpload={async (file) => {
                  const data = await uploadStoreMedia<StoreSettings>('hero-mobile', file);
                  await applyStoreFromMediaResponse(data);
                }}
                onRemove={async () => {
                  const data = await deleteStoreMedia<StoreSettings>('hero-mobile');
                  await applyStoreFromMediaResponse(data);
                }}
              />
            </div>
            <div className="rounded-md border border-hairline bg-paper p-4 sm:p-6">
              <p className="text-xs font-mono uppercase tracking-[0.15em] text-stone mb-4">Live preview</p>
              <StoreHero
                hero={hero}
                storeSlug={store.publicSlug}
                storeName={store.name}
                priority={false}
                preview
              />
            </div>
          </div>
        </Card>
      )}

      {tab === 'appearance' && (
        <Card title="Appearance" description="Brand colors and visual direction">
          <div className="space-y-6">
            <div className="rounded-sm border border-hairline bg-paper p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">Storefront themes</p>
                <p className="text-sm text-stone-2 mt-1">
                  Choose a complete visual direction — typography, layout, and product presentation.
                </p>
              </div>
              <Link
                href="/app/store/themes"
                className="inline-flex items-center justify-center h-10 px-4 text-sm font-medium bg-ink text-paper rounded-sm"
              >
                Open theme library
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(STYLE_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    const applied = applyStylePreset(
                      key as keyof typeof STYLE_PRESETS,
                      draft.appearance
                    );
                    setStore({
                      ...store,
                      primaryColor: applied.primaryColor,
                      secondaryColor: applied.secondaryColor,
                    });
                    updateDraft({ appearance: applied.appearance });
                  }}
                  className={`text-left p-4 rounded-sm border transition ${
                    draft.appearance.preset === key
                      ? 'border-accent ring-1 ring-accent'
                      : 'border-hairline hover:border-stone'
                  }`}
                >
                  <div className="flex gap-2 mb-2">
                    <span
                      className="w-6 h-6 rounded-full border border-hairline"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <span
                      className="w-6 h-6 rounded-full border border-hairline"
                      style={{ backgroundColor: preset.secondary }}
                    />
                  </div>
                  <p className="font-medium text-sm">{preset.label}</p>
                  <p className="text-xs text-stone-2 mt-1">{preset.description}</p>
                </button>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Primary color"
                value={store.primaryColor || ''}
                onChange={(e) => setStore({ ...store, primaryColor: e.target.value || null })}
                placeholder="#5B7CFF"
              />
              <Input
                label="Secondary color"
                value={store.secondaryColor || ''}
                onChange={(e) => setStore({ ...store, secondaryColor: e.target.value || null })}
                placeholder="#101214"
              />
            </div>
            <Select
              label="Typography"
              value={draft.appearance.typography}
              onChange={(e) =>
                updateDraft({
                  appearance: {
                    ...draft.appearance,
                    typography: e.target.value as StoreExperienceConfig['appearance']['typography'],
                  },
                })
              }
              options={[
                { value: 'modern', label: 'Modern' },
                { value: 'editorial', label: 'Editorial' },
                { value: 'minimal', label: 'Minimal' },
                { value: 'luxury', label: 'Luxury' },
              ]}
            />
          </div>
        </Card>
      )}

      {tab === 'seo' && (
        <Card title="SEO" description="Search and social sharing">
          <div className="space-y-4">
            <Input
              label="Page title"
              value={draft.seo.title || ''}
              onChange={(e) => updateDraft({ seo: { ...draft.seo, title: e.target.value } })}
              placeholder={store.name}
            />
            <div>
              <label className="block text-sm font-medium mb-1">Meta description</label>
              <textarea
                value={draft.seo.description || ''}
                onChange={(e) =>
                  updateDraft({ seo: { ...draft.seo, description: e.target.value } })
                }
                className="w-full min-h-[80px] p-3 rounded-sm border border-hairline text-sm"
                placeholder={store.description || ''}
              />
            </div>
            <Toggle
              label="Allow search indexing"
              checked={draft.seo.indexable !== false}
              onChange={(indexable) => updateDraft({ seo: { ...draft.seo, indexable } })}
            />
          </div>
        </Card>
      )}

      {tab === 'contact' && (
        <div className="space-y-6">
          <Card title="Contact & Social" description="Links shown in header and footer">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Instagram"
                  value={store.socialLinks?.instagram || ''}
                  onChange={(e) =>
                    setStore({
                      ...store,
                      socialLinks: {
                        ...parseSocialLinks(store.socialLinks),
                        instagram: e.target.value || null,
                      },
                    })
                  }
                />
                <Input
                  label="WhatsApp"
                  value={store.socialLinks?.whatsapp || ''}
                  onChange={(e) =>
                    setStore({
                      ...store,
                      socialLinks: {
                        ...parseSocialLinks(store.socialLinks),
                        whatsapp: e.target.value || null,
                      },
                    })
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Contact email"
                  value={store.contactEmail || ''}
                  onChange={(e) => setStore({ ...store, contactEmail: e.target.value || null })}
                />
                <Input
                  label="Contact phone"
                  value={store.contactPhone || ''}
                  onChange={(e) => setStore({ ...store, contactPhone: e.target.value || null })}
                />
              </div>
            </div>
          </Card>
          <Card title="Commerce settings" description="Currency, tax, and status">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Currency"
                  value={store.currency || ''}
                  onChange={(e) => setStore({ ...store, currency: e.target.value || null })}
                />
                <Input
                  label="Tax rate (%)"
                  value={String((store.taxRateBps || 0) / 100)}
                  onChange={(e) =>
                    setStore({
                      ...store,
                      taxRateBps: Math.round(parseFloat(e.target.value || '0') * 100),
                    })
                  }
                />
              </div>
              <Select
                label="Store status"
                value={store.status}
                onChange={(e) => setStore({ ...store, status: e.target.value })}
                options={[
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'PAUSED', label: 'Paused' },
                  { value: 'MAINTENANCE', label: 'Maintenance' },
                ]}
              />
            </div>
          </Card>
        </div>
      )}

      {tab === 'policies' && (
        <Card title="Store policies" description="Public policy pages for customer trust">
          <div className="space-y-4">
            {(['shipping', 'returns', 'privacy', 'terms'] as const).map((key) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-1 capitalize">{key} policy</label>
                <textarea
                  value={draft.policies[key] || ''}
                  onChange={(e) =>
                    updateDraft({
                      policies: { ...draft.policies, [key]: e.target.value },
                    })
                  }
                  className="w-full min-h-[120px] p-3 rounded-sm border border-hairline text-sm"
                  placeholder={`Your ${key} policy…`}
                />
                <p className="text-xs text-stone-2 mt-1">
                  Public URL: /store/{store.publicSlug}/policies/{key}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {message && <p className="text-sm text-stone-2">{message}</p>}
    </div>
  );
}
