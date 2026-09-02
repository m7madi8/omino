# OMINO Visual Experience Audit

Audit date: 2026-03-03. Baseline before world-class visual transformation.

---

## A. Existing Assets to Reuse

| Area | Status | Key files |
|------|--------|-----------|
| Platform tokens | Ready (partial) | `src/app/globals.css`, `tailwind.config.ts` |
| Store themes (5) | Ready | `src/lib/themes/registry.ts` — aura, noir, form, atelier, pulse |
| Experience engine | Ready | `src/lib/storefront/store-experience-engine.ts`, `src/types/store-experience.ts` |
| Draft/publish | Ready | `theme-service.ts`, `POST /api/store/publish` |
| Preview cookie | Ready | `preview-session.ts`, `themes-library.tsx` |
| UI primitives | Minimal | `src/components/ui/` — Button, Input, Card, Select, EmptyState |
| Palestine shell | Ready | `app-shell.tsx`, `simple-mobile-nav.tsx`, `merchant-provider.tsx` |
| i18n | Partial | `src/lib/i18n/messages/{ar,en}.ts` — simple surfaces keyed |
| Storefront components | Ready | `src/components/storefront/*`, `storefront-themes.css` |

---

## B. Visual Debt Inventory

### Token fragmentation
- Platform colors duplicated in `globals.css` and `tailwind.config.ts`
- Marketing site (`main/css/omino.css`) has richer tokens not wired to Next.js app
- Storefront `--store-*` vars separate from platform `--ink/--paper`
- `appearance.typography` and `appearance.radius` stored in DB but never applied to CSS

### Style/theme overlap
- `STYLE_PRESETS` (5) map to `themeId` — no independent Style layer
- Legacy `preset` field conflates style with theme selection
- `ThemeComponentVariants` declared but header/footer/hero are CSS-only

### Dashboard visual debt
- Card-heavy layouts on Today and Overview
- Inconsistent page widths: `max-w-lg`, `max-w-3xl`, `max-w-6xl`, `max-w-2xl`
- Arabic font loaded but not applied to dashboard body
- RTL sidebar slides from physical left; progress bar uses `origin-left`
- Search inputs use `left-3`/`pl-10` not logical properties
- `MODULE_NAV` labels hardcoded English
- Settings page: no skeleton, no PageHeader, no i18n

### Storefront visual debt
- Category/collection pages bypass `ThemedProductGrid` — always bento
- PDP theme-agnostic — no style composition
- Draft homepage sections not reflected in preview (layout reads draft, page reads live)
- Newsletter section shows "coming soon" placeholder

### Loading/empty/error gaps
- Missing: `today/loading.tsx`, settings skeleton
- Products mobile empty state missing
- POS uses `alert()` for errors
- Orders loading width mismatch (`max-w-6xl` vs content `max-w-3xl`)

---

## C. Dashboard Page Audit

| Page | Issues | Priority |
|------|--------|----------|
| Today | Card grid KPIs; needs stat-strip | P1 |
| Orders | Good mobile cards; tab overflow risk | P1 |
| Products | English-only; table/card split; empty gap mobile | P1 |
| POS | English cart/payment; height vs bottom nav | P1 |
| Settings | No loading; no RTL; no PageHeader | P1 |
| Overview | English GettingStarted cards | P2 |
| Store admin | Nested cards; appearance tab flat | P2 |
| Analytics/AI/Marketing | No shared page chrome | P2 |
| Advanced hub | English module labels | P2 |

---

## D. Storefront Audit

| Surface | Issues |
|---------|--------|
| Homepage | Section composer works; hero interactive heavy |
| PLP / categories | Grid bypass; no style variants |
| PDP | Generic layout; no style-aware gallery |
| Cart | Functional; generic form feel |
| Checkout | PS default good; needs trust/clarity polish |
| Header/footer | CSS-only theme variants |

---

## E. Responsive Breakpoint Matrix

Target verification: 320, 360, 375, 390, 414, 768, 1024, 1280, 1440, 1920.

Known failures:
- Horizontal scroll on orders tabs (minor)
- POS height clipping with bottom nav
- Table overflow on products (md+ only — mobile cards OK)

---

## F. Performance Hotspots

- Heavy client islands: POS, store-admin-client, analytics charts
- Missing route-level loading for today, settings
- Lucide full icon imports in app-shell
- Hero interactive shapes always loaded
- Duplicate fetch on settings page mount

---

## G. Risk Register

| Risk | Mitigation |
|------|------------|
| Breaking live stores | Default styleId/layoutId from theme variants in parseAppearance |
| Palestine regression | Verify simple nav + RTL after shell changes |
| Combinatorial CSS explosion | Style adjusts tokens; compound CSS for top pairs only |
| Scope creep | Phase commits; each phase independently verifiable |
| Publish flow break | No Prisma changes; extend JSON appearance only |

---

## H. Implementation Targets

1. Unified token system (`src/lib/design/tokens/`)
2. Style + Layout registries independent of Theme
3. `resolveDesignExperience()` pipeline
4. Dashboard OS language (page-chrome, stat-strip, data-list)
5. UI component upgrade with states
6. Design Studio admin UX with presets
7. Storefront style-aware components
8. Full responsive/RTL QA
