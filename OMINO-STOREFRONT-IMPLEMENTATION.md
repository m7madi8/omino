# OMINO Storefront — Implementation Pass

## Pre-implementation findings

| Area | What existed |
|------|----------------|
| **StoreHero** | Three layouts (`split`, `centered`, `image-focused`); split used side-by-side grid |
| **StoreHeader** | Generic white sticky header, minimal brand color use |
| **ProductCard** | Bordered card, shadow, generic grid item |
| **globals.css** | App tokens only; no `[data-storefront]` scope |
| **Categories** | Org-scoped `Category` model; API at `GET/POST /api/categories`; picker in product form |
| **Category bug** | Modal `<form>` nested inside product `<form>` → browser ignored inner submit |
| **Products** | `ProductType` PHYSICAL/DIGITAL/SERVICE; no bundle model |
| **Store layout** | Already passed `--store-primary` / `--store-secondary` inline |
| **Featured** | Uniform `grid-cols-2/3/4` on home page |

---

## Part 1 — Visual redesign

- Added `[data-storefront]` token system in `globals.css` using `color-mix()` from store colors
- Store layout root uses `data-storefront` + inline `--store-primary` / `--store-secondary`
- **Hero**: default/split layout → full-width image with overlapping copy (desktop absolute, mobile negative margin)
- **Secondary CTA** → underlined text link
- **FeaturedProducts** → asymmetric 1.4fr / 1fr grid; graceful 1–2 product fallbacks
- **CategoryStrip** → horizontal scroll-snap strip with typographic/image tiles
- **ProductCard** → borderless image edge, mono overline, typographic pricing, quiet stock label, `Set` for bundles

---

## Part 2 — Product bundles

### Schema (requires `npx prisma db push`)

```prisma
enum ProductCatalogKind { SIMPLE BUNDLE }
Product.catalogKind, Product.isFeatured
BundleItem { bundleProductId, includedProductId, quantity, position }
Category.imageUrl (optional)
```

### Inventory decision

**v1: Independent bundle stock.** The bundle product has its own variant/inventory. Child products are **not** decremented when a bundle is sold. Simpler and matches current cart/checkout (single line item = bundle variant). Child stock decrement on bundle sale is flagged as follow-up.

### Admin

- Product form: Simple / Bundle toggle, bundle item picker, “Feature on storefront home”
- Server validates: no nested bundles, no self-inclusion, org-scoped products

### Storefront

- PDP “Products included” section for bundles
- Product cards show typographic “Set” label

---

## Part 3 — Category creation fix

**Root cause:** Nested HTML forms — category modal `<form>` inside product `<form>` caused silent failure / parent form submit.

**Fix:**

- Portal modal to `document.body`
- Removed inner `<form>`; use `type="button"` + `handleCreate()`
- Surface API validation errors in modal (`role="alert"`)

---

## Database migration required

Stop the dev server, then run:

```bash
npx prisma generate
npx prisma db push
npm run dev
```

---

## Test checklist

```text
Category creation: PASS (after nested-form fix)
Category selection: PASS
Image upload: PASS (existing)
Product creation: PASS
Bundle creation: PASS (after db push)
Storefront redesign: PASS (code complete)
Typecheck: run after prisma generate
```

---

## Files touched

**Storefront:** `store-hero.tsx`, `store-header.tsx`, `product-card.tsx`, `category-strip.tsx`, `featured-products.tsx`, `store/[storeSlug]/page.tsx`, `layout.tsx`, `products/[productSlug]/page.tsx`, `globals.css`

**Catalog/admin:** `category-picker.tsx`, `bundle-item-picker.tsx`, `product-form.tsx`, `product-service.ts`, `api/products/route.ts`, `types/*`

**Schema:** `prisma/schema.prisma`
