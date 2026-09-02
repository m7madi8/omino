# OMINO Theme System

Premium multi-theme storefront engine for OMINO AI Business OS.

## Product vision

Merchants choose a **visual direction**. OMINO handles design language — typography, spacing, layout, composition, navigation behavior, product presentation, motion personality.

**Themes are not color skins.** Each theme is a complete visual system.

### Distinction

| Layer | Owner | Examples |
|-------|-------|----------|
| Brand settings | Merchant | Logo, primary/secondary colors, images, copy |
| Theme | OMINO | Layout, typography system, component variants, motion |
| Store content | Merchant | Products, categories, hero content, collections |

Themes consume merchant content dynamically. No theme is hardcoded for a specific brand.

---

## Architecture

```
src/lib/themes/
  types.ts          — Theme types, token shapes, variant keys
  registry.ts       — THEME_REGISTRY (5 themes), list/get helpers
  tokens.ts         — resolveThemeId(), themeToCssVars()
  recommend.ts      — Future: explainable theme recommendations
  index.ts

src/components/storefront/themes/
  theme-context.tsx       — StoreThemeProvider, useStoreTheme()
  themed-product-grid.tsx — Grid variant dispatcher (bento vs uniform)

src/server/services/theme-service.ts — Apply, list, preview cookie
src/lib/storefront/preview-session.ts — Preview cookie reader (storefront)

src/app/storefront-themes.css — Per-theme CSS overrides ([data-theme])
```

### ThemeRegistry

Each theme defines:

- `id`, `version`, `name`, `description`, `philosophy`, `bestFor`, `tags`, `categories`
- `tokens` — typography, radius, spacing, shadows, motion
- `variants` — header, hero, productCard, footer, category, productGrid
- `motion` — subtle | sharp | minimal | editorial | energetic

### Initial collection (v1)

| ID | Direction | Grid | Personality |
|----|-----------|------|-------------|
| `aura` | Quiet luxury / beauty | Bento | Subtle, serif headings, soft radius |
| `noir` | High-fashion / luxury | Editorial | Sharp, uppercase, zero radius, strong borders |
| `form` | Modern product-first | Uniform 4-col | Minimal motion, bordered cards |
| `atelier` | Editorial storytelling | Bento | Italic serif, narrative rhythm |
| `pulse` | Bold / energetic | Bento/mosaic | Large CTAs, pill chips, rounded |

---

## Persistence

Themes are stored in existing `Store.themeSettings` JSON (v2 document):

```ts
appearance: {
  themeId: 'aura' | 'noir' | 'form' | 'atelier' | 'pulse',
  themeVersion: '1.0.0',
  // legacy fields preserved for migration
  preset?: 'modern' | ...
}
```

**Draft / published flow** (existing):

- `PATCH /api/store/settings` → updates `draft`
- `POST /api/store/themes/apply` → sets `draft.appearance.themeId`
- `POST /api/store/publish` → copies draft → live

Live storefront reads `live`. Preview reads `draft` + preview cookie.

Legacy `appearance.preset` maps to `themeId` via `presetToThemeId()`.

---

## Theme tokens

Semantic CSS variables injected on `[data-storefront]`:

```text
--store-primary          (merchant brand, overridable)
--store-secondary
--store-background
--store-foreground
--store-muted
--store-surface
--store-border
--store-accent
--store-font-heading
--store-font-body
--store-radius-sm/md/lg
--store-space-section
--store-space-content
--store-shadow-card
--store-shadow-floating
--store-motion-duration
--store-motion-ease
```

`experienceToCssVars()` delegates to `themeToCssVars()`. Merchant `primaryColor` / `secondaryColor` columns always override preset defaults.

Storefront layout sets `data-theme={themeId}` for scoped CSS in `storefront-themes.css`.

---

## Component variants

| Component | Mechanism |
|-----------|-----------|
| ProductCard | `useStoreTheme()` → theme-specific shell classes |
| Product grid | `ThemedProductGrid` → bento vs uniform by `theme.variants.productGrid` |
| Header / Hero / Footer | `data-theme` CSS + existing components (extend per theme in CSS) |
| Category chips | Shared component; pulse theme gets pill styling via CSS |

Shared commerce logic is never theme-specific.

---

## Admin: Theme Library

**Route:** `/app/store/themes`

**Navigation:** Store section nav includes dedicated **Themes** link (not hidden in Appearance).

Features:

- Current draft + published theme indicators
- Search + category filters
- Theme cards with preview gradient, tags, Preview / Apply
- Apply confirmation copy (content unchanged, presentation only)
- Device preview (desktop / tablet / mobile) via iframe
- Link from Appearance tab → theme library

### APIs

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/store/themes` | List themes + store theme state |
| POST | `/api/store/themes/apply` | Apply theme to draft |
| POST | `/api/store/themes/preview` | Set preview cookie (30 min) |
| DELETE | `/api/store/themes/preview` | Clear preview |

---

## Preview flow

1. Merchant clicks **Preview** → `POST /api/store/themes/preview` with `{ themeId, mode: 'draft' }`
2. HttpOnly cookie `omino_sf_preview_theme` set
3. Iframe loads `/store/{slug}` — layout reads cookie
4. Storefront renders draft experience + preview themeId
5. Banner: "Theme preview — changes are not live until you publish"
6. **Apply** updates draft only; **Publish** makes live

---

## Security

- All theme APIs use `requireTenantContext()` — organization-scoped
- `updateStoreSettings(organizationId, storeId, …)` verifies store ownership
- Preview cookie scoped to `storeSlug` — no cross-store leakage
- No `storeId` trusted from client without server auth

---

## Performance

- Single theme loaded per request (no multi-theme bundle)
- Registry is static data — tree-shakeable
- `ThemedProductGrid` lazy path: only bento or uniform grid renders
- CSS overrides via `data-theme` — no runtime style injection per component

---

## Accessibility

- All themes inherit focus rings, semantic HTML, keyboard nav
- `prefers-reduced-motion` respected in motion utilities
- Preview banner is readable; contrast from merchant brand colors + theme tokens

---

## Adding a new theme

1. Add id to `STORE_THEME_IDS` in `types.ts`
2. Register in `THEME_REGISTRY` with tokens + variants + metadata
3. Add `[data-theme='newtheme']` rules in `storefront-themes.css`
4. Optionally add product card / header class branches if structural change needed
5. Theme appears automatically in admin library — no route changes required

### Versioning

`themeVersion` stored per store. Future migrations can compare `themeVersion` and offer controlled upgrades — never auto-upgrade live merchants.

---

## Testing checklist

- [ ] Select theme in `/app/store/themes`
- [ ] Preview with real products (iframe + cookie)
- [ ] Apply → draft updated, live unchanged
- [ ] Publish → live storefront reflects theme
- [ ] Brand colors still apply across themes
- [ ] Mobile 320–1440 — no horizontal scroll
- [ ] `prefers-reduced-motion`
- [ ] Tenant isolation on APIs
- [ ] Legacy `preset` stores migrate to `themeId`

---

## Future extensions (not in v1)

- Theme marketplace / third-party themes
- Theme builder / arbitrary CSS
- ML recommendations (architecture ready in `recommend.ts`)
- Per-theme hero component TSX variants (lazy-loaded)

---

## Merchant UX

1. **Choose** a theme in the library  
2. **Preview** with their real store  
3. **Apply** to draft  
4. **Publish** when ready  

No CSS. No layout configuration. Choose your style — OMINO handles the rest.
