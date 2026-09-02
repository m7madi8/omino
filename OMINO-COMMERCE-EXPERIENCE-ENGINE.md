# OMINO Commerce Experience Engine

Architecture documentation for the OMINO storefront experience system — the layer that turns business content into a premium, art-directed commerce experience.

## Philosophy

> **You provide the business. OMINO designs the experience.**

Store owners supply brand, products, images, content, and business rules. OMINO composes layout, hierarchy, responsive behavior, visual rhythm, navigation, product presentation, conversion structure, performance, and accessibility.

## System boundaries

| Surface | Path | Purpose |
|---------|------|---------|
| Marketing site | `/main` | Public OMINO marketing (unchanged by CEE) |
| Business OS | `/app` | Operations, inventory, orders, AI |
| Store management | `/app/store` | Experience Control Center |
| Public storefront | `/store/[storeSlug]` | Customer-facing commerce |

Store management and the storefront share design tokens and primitives but remain separate experiences.

## Core architecture

```
Store.themeSettings (JSON, v2)
        │
        ▼
parseExperienceDocument()
        │
   ┌────┴────┐
   │         │
 live      draft
   │         │
   ▼         ▼
Public    Admin preview
store     + save draft
          + publish → live
```

### Key modules

| Module | Path | Role |
|--------|------|------|
| Experience types | `src/types/store-experience.ts` | v2 config model |
| Experience engine | `src/lib/storefront/store-experience-engine.ts` | Parse, migrate, presets, CSS vars, publish |
| Store health | `src/lib/storefront/store-health.ts` | Deterministic readiness score |
| Experience service | `src/server/services/store-experience-service.ts` | Draft merge, publish |
| Storefront service | `src/server/services/storefront-service.ts` | Resolves live experience for public store |

## Data model (`themeSettings` v2)

```typescript
{
  version: 2,
  publishedAt: string | null,
  live: StoreExperienceConfig,
  draft: StoreExperienceConfig
}
```

`StoreExperienceConfig` contains:

- `hero` — Hero engine config (layouts: split, centered, image-focused)
- `announcement` — Announcement bar
- `appearance` — Style preset, typography, radius
- `sections` — Ordered homepage sections
- `seo` — Title, description, OG image, indexing
- `policies` — Shipping, returns, privacy, terms

Legacy `{ hero: ... }` documents auto-migrate on read via `parseExperienceDocument()`.

## Publishing model

1. **Edit** — Changes go to `draft` via `PATCH /api/store/settings`
2. **Preview** — Admin renders draft with `StorePreviewPanel` and inline hero preview
3. **Publish** — `POST /api/store/publish` copies `draft` → `live` and sets `publishedAt`

Public storefront always reads **live** experience via `getLiveExperience()`.

## Store Experience Engine

`store-experience-engine.ts` is the design intelligence layer:

- **Style presets** — minimal, editorial, modern, luxury, bold
- **Typography presets** — modern, editorial, minimal, luxury
- **CSS variable derivation** — `--store-primary`, `--sf-font-display`, `--sf-radius`, etc.
- **Section defaults** — Opinionated homepage section order

Brand colors on the `Store` record (`primaryColor`, `secondaryColor`) override preset primaries when set.

## Hero system

Implemented in `src/components/storefront/store-hero.tsx`.

Layouts:

- **Split** — Text + visual composition
- **Centered** — Editorial centered layout
- **Image-focused** — Image-dominant with optional overlay

Configuration: enabled, layout, eyebrow, headline, description, CTAs, images, position, fit, focal point, overlay, alignment.

Images upload via `MediaUploader` → `POST /api/store/media` (tenant-isolated storage).

## Navigation

`src/components/storefront/store-header.tsx` — adaptive header with:

- Logo, primary links, categories, search, cart
- Dedicated mobile drawer (large touch targets, hierarchy)

Navigation density adapts to catalog size.

## Homepage sections

`src/components/storefront/homepage-sections.tsx` renders enabled sections in order:

| Type | Component behavior |
|------|-------------------|
| hero | `StoreHero` |
| featured-products | `FeaturedProducts` |
| category-showcase | `CategoryProductSections` |
| featured-collection | Curated category grid |
| promotional-banner | CTA banner |
| brand-story | Editorial text block |
| newsletter | Signup placeholder |
| rich-text | Custom content |

Admin supports reorder (↑↓) and visibility toggle — no drag-and-drop builder.

## Announcement bar

`src/components/storefront/announcement-bar.tsx` — dismissible, configurable message/link/colors. Persisted dismiss state in `localStorage` per store slug.

## Preview system

`src/components/store-admin/store-preview-panel.tsx`:

- Device frames: desktop, tablet, mobile
- Renders real `AnnouncementBar` + `StoreHero` with draft config and derived CSS vars
- Not a mockup — uses production storefront components

## Store health

`GET /api/store/health` — deterministic checks only:

- Store active, logo, description, hero, products, product images, contact, shipping, SEO

Never invents data. Score = weighted pass rate.

## SEO

- Admin: SEO tab in Experience Control Center
- Public: `generateMetadata()` in `src/app/store/[storeSlug]/layout.tsx`
- Defaults from store name/description when custom SEO empty

## Policies

Public routes: `/store/[storeSlug]/policies/[policy]` where policy ∈ shipping | returns | privacy | terms.

Footer links appear only when policy content exists.

## Media

All images via direct upload (`MediaUploader`). Storage: `public/uploads/organizations/{orgId}/stores/{storeId}/`. Tenant isolation enforced server-side.

## APIs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/store/settings` | GET/PATCH | Store + experience draft |
| `/api/store/publish` | POST | Publish draft → live |
| `/api/store/health` | GET | Readiness report |
| `/api/store/media` | POST/DELETE | Logo, favicon, hero images |

## Security

- All store APIs use `requireTenantContext` with `store.read` / `store.write`
- Organization/store IDs from session — never trusted from client
- Media paths scoped to tenant storage
- Publish requires `store.write`

## Localization foundation

- RTL-safe utility classes and layout patterns in storefront components
- No hardcoded English-only assumptions in section renderers
- Full i18n integration planned for future phase

## AI integration (foundation)

AI store assistant tools are not yet registered. Architecture supports:

- Read-only analysis of live experience config
- Suggestions with confirmation before write actions
- Integration via existing OMINO Tool Registry

## Performance

- Server components for storefront pages
- Hero images prioritized when appropriate
- Product images lazy-loaded in grids
- Client components isolated to cart, header drawer, announcement dismiss

## Accessibility

- Semantic HTML in sections and navigation
- ARIA on announcement bar, mobile menu, toggles
- Focus-visible styles on storefront buttons/links
- Reduced-motion respected in CSS

## Future extension points

- Custom domains
- Full iframe preview with draft token
- AI storefront improvement tool
- Conversion intelligence from analytics
- Newsletter integration
- Additional hero layouts via section type registry
- Personalization by segment/locale (architecture only)

## File index

### New / primary CEE files

- `src/types/store-experience.ts`
- `src/lib/storefront/store-experience-engine.ts`
- `src/lib/storefront/store-health.ts`
- `src/server/services/store-experience-service.ts`
- `src/components/storefront/announcement-bar.tsx`
- `src/components/storefront/homepage-sections.tsx`
- `src/components/store-admin/store-preview-panel.tsx`
- `src/app/api/store/publish/route.ts`
- `src/app/api/store/health/route.ts`
- `src/app/store/[storeSlug]/policies/[policy]/page.tsx`

### Modified integration points

- `src/app/app/store/store-admin-client.tsx` — Experience Control Center
- `src/app/store/[storeSlug]/layout.tsx` — SEO + experience CSS vars
- `src/app/store/[storeSlug]/page.tsx` — Homepage sections engine
- `src/components/storefront/storefront-shell.tsx` — Announcement bar
- `src/server/services/storefront-service.ts` — Live experience on store model
