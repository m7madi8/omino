# OMINO Visual Experience — Implementation Report

Date: 2026-03-03

## Summary

Implemented the world-class visual experience transformation: unified design tokens, Theme + Style + Layout engine, dashboard OS layout primitives, upgraded UI components, Design Studio admin UX, storefront style-aware rendering, and RTL/loading polish — without backend rewrites or Prisma schema changes.

---

## CHANGED

### Design system core
- [`src/lib/design/tokens/platform.ts`](src/lib/design/tokens/platform.ts) — platform spacing, radii, motion, page widths
- [`src/lib/design/tokens/typography.ts`](src/lib/design/tokens/typography.ts) — typography presets wired to CSS
- [`src/lib/design/styles/registry.ts`](src/lib/design/styles/registry.ts) — 8 styles (minimal → experimental)
- [`src/lib/design/layouts/registry.ts`](src/lib/design/layouts/registry.ts) — 7 product layouts
- [`src/lib/design/resolve-design-experience.ts`](src/lib/design/resolve-design-experience.ts) — Theme + Style + Layout resolver
- [`src/lib/design/presets.ts`](src/lib/design/presets.ts) — 8 curated design presets
- [`src/lib/design/cn-variants.ts`](src/lib/design/cn-variants.ts) — shared button/card variants
- [`src/lib/themes/tokens.ts`](src/lib/themes/tokens.ts) — delegates to design resolver
- [`src/types/store-experience.ts`](src/types/store-experience.ts) — `styleId`, `layoutId`, `spacing`
- [`src/lib/storefront/store-experience-engine.ts`](src/lib/storefront/store-experience-engine.ts) — parse/migrate new appearance fields

### Dashboard
- [`src/components/app/app-shell.tsx`](src/components/app/app-shell.tsx) — RTL sidebar, i18n nav labels
- [`src/components/app/navigation-progress.tsx`](src/components/app/navigation-progress.tsx) — RTL progress origin
- [`src/components/providers/merchant-provider.tsx`](src/components/providers/merchant-provider.tsx) — Arabic font on dashboard
- [`src/components/merchant/today-dashboard.tsx`](src/components/merchant/today-dashboard.tsx) — stat-strip + data-list OS layout
- [`src/app/app/settings/page.tsx`](src/app/app/settings/page.tsx) — PageChrome, loading skeleton, i18n
- [`src/lib/permissions/constants.ts`](src/lib/permissions/constants.ts) — MODULE_NAV labelKey for i18n
- [`src/lib/i18n/messages/en.ts`](src/lib/i18n/messages/en.ts), [`ar.ts`](src/lib/i18n/messages/ar.ts) — module nav + empty/settings keys
- [`src/app/globals.css`](src/app/globals.css) — page width vars, sheet animation, reduced motion

### Storefront
- [`src/app/store/[storeSlug]/layout.tsx`](src/app/store/[storeSlug]/layout.tsx) — `data-style`, `data-layout`, resolved CSS vars
- [`src/components/storefront/themes/theme-context.tsx`](src/components/storefront/themes/theme-context.tsx) — styleId/layoutId in context
- [`src/components/storefront/product-card.tsx`](src/components/storefront/product-card.tsx) — style shell classes
- [`src/components/storefront/themes/themed-product-grid.tsx`](src/components/storefront/themes/themed-product-grid.tsx) — style-aware card sizing
- [`src/app/store/[storeSlug]/categories/[categorySlug]/page.tsx`](src/app/store/[storeSlug]/categories/[categorySlug]/page.tsx) — ThemedProductGrid routing
- [`src/components/storefront/collection-products-view.tsx`](src/components/storefront/collection-products-view.tsx) — ThemedProductGrid routing
- [`src/app/storefront-themes.css`](src/app/storefront-themes.css) — style layer CSS hooks

### Admin
- [`src/app/app/store/store-admin-client.tsx`](src/app/app/store/store-admin-client.tsx) — Design Studio appearance tab
- [`src/components/store-admin/design-studio.tsx`](src/components/store-admin/design-studio.tsx) — visual preset/theme/style/layout picker

---

## ADDED

| File | Purpose |
|------|---------|
| `OMINO-VISUAL-EXPERIENCE-AUDIT.md` | Pre-implementation audit |
| `src/lib/design/index.ts` | Design system barrel export |
| `src/components/ui/badge.tsx` | Status badges |
| `src/components/ui/skeleton.tsx` | Loading skeletons |
| `src/components/ui/sheet.tsx` | Mobile bottom sheet |
| `src/components/ui/tabs.tsx` | Accessible tab bar |
| `src/components/app/dashboard/page-chrome.tsx` | Unified page wrapper |
| `src/components/app/dashboard/stat-strip.tsx` | Horizontal KPI strip |
| `src/components/app/dashboard/section-block.tsx` | Titled sections without card noise |
| `src/components/app/dashboard/data-list.tsx` | Mobile-native list rows |
| `src/app/app/today/loading.tsx` | Today route skeleton |
| `src/app/app/settings/loading.tsx` | Settings route skeleton |

---

## DESIGN SYSTEM

### Architecture: Theme ≠ Style ≠ Layout

```
Store.themeSettings.appearance
  themeId   → THEME_REGISTRY (aura, noir, form, atelier, pulse)
  styleId   → STYLE_REGISTRY (minimal, editorial, luxury, bold, organic, modern, classic, experimental)
  layoutId  → LAYOUT_REGISTRY (grid, editorial, masonry, large-feature, compact, magazine, horizontal-scroll)
  typography, radius, spacing → CSS var overrides
```

Runtime: `resolveDesignExperience()` → merged CSS vars + component variants → `data-theme`, `data-style`, `data-layout` on storefront root.

### Curated presets (Design Studio)
Minimal Studio, Editorial Fashion, Quiet Luxury, Modern Commerce, Bold Brand, Organic Living, Classic Boutique, Experimental Atelier.

---

## PERFORMANCE

- Route-level loading for `/app/today` and `/app/settings`
- Store theme context memoizes resolved design experience
- Build passes with 83 routes; no new heavy client bundles for core flows
- `prefers-reduced-motion` respected for experimental style transforms

---

## RESPONSIVE

- Page width tokens: `--page-width-narrow`, `--page-width-default`, `--page-width-wide`
- Orders loading skeleton aligned to narrow page width
- Sheet component with safe-area inset + 44px touch targets
- RTL sidebar slides from logical start/end
- Arabic dashboard body uses `font-ar` via MerchantProvider

---

## QA

| Check | Result |
|-------|--------|
| `npm run build` | Pass (83 routes) |
| Prisma schema | Unchanged |
| Palestine simple mode | Preserved (nav, i18n, RTL fixes) |
| Store publish/preview | Compatible (JSON appearance extension) |
| Existing APIs | Unchanged |

---

## REMAINING (future work)

1. **Full dashboard module pass** — Analytics, Marketing, AI pages still use legacy card layouts; apply PageChrome/DataList systematically
2. **PDP style compositions** — Product detail page still largely theme-agnostic; add style-aware gallery layouts
3. **Checkout visual polish** — Trust blocks, sticky mobile summary refinement
4. **Header/footer React variants** — Still CSS-only per theme; implement swappable components
5. **Live iframe preview debounce** — Design Studio updates draft; full iframe auto-refresh on every tile click not yet wired
6. **Playwright visual regression** — Manual QA checklist only; automated breakpoint tests deferred
7. **Dark mode** — Not in scope
8. **Novae seed** — Minor TS fixes applied; other seed type issues may remain in dev-only paths

---

## How to verify

1. **Dashboard:** `/app/today` — stat strip layout, Arabic RTL, WhatsApp share in header
2. **Settings:** `/app/settings` — skeleton while loading, PageChrome layout
3. **Design Studio:** `/app/store` → Appearance — pick preset, theme, style, layout; publish
4. **Storefront:** Visit store with `data-style` visible in DOM; category/collection pages respect layoutId
5. **Build:** `npm run build`
