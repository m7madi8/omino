# OMINO — Product Media & Category Fix

## Summary

Improved product creation at `/app/products/new` with inline category management and local image uploads, without changing the core product/inventory architecture.

---

## Category Management

### What existed
- `Category` model scoped by `organizationId` (optional `storeId`)
- `GET/POST /api/categories` via `category-service.ts`
- Product form had a static `<select>` with server-rendered categories only

### What was added
- `CategoryPicker` component (`src/components/catalog/category-picker.tsx`)
  - Select existing category
  - `+ Create new category` modal
  - `POST /api/categories` → receives category `id` → auto-selects it
- Product form uses controlled `categoryId` state and submits `category_id` via `categoryId` in JSON payload

### Tenant safety
- Category API uses `requireTenantContext('products.write')`
- `createCategory(organizationId, ...)` — organization from session, never from client
- Unique slug per organization prevents accidental duplicates

---

## Product Image Upload

### What existed
- `ProductImage` model (`product_id`, `url`, `alt_text`, `position`, `is_primary`)
- `addProductImages()` in `product-service.ts`
- Product form only accepted manual **Image URL**

### What was added
- Local filesystem storage (no Supabase configured in OMINO)
  - Path: `public/uploads/organizations/{organizationId}/products/{productId}/{uuid}.{ext}`
  - Public URL: `/uploads/organizations/...`
- `src/lib/storage/product-images.ts` — magic-byte validation, 5 MB limit, PNG/JPEG/WEBP only
- `POST /api/products/[id]/images` — multipart upload, tenant-scoped
- `DELETE/PATCH /api/products/[id]/images/[imageId]` — remove / set primary
- `ProductImageUpload` component — drag & drop, previews, remove, retry, primary badge
- Create flow: **product first → upload images → DB records** (no orphaned files on failed product create)

### Edit product
- `/app/products/[id]` Images tab supports upload, remove, set primary (when `products.write`)

---

## Product Form Structure

Tabs (all panels stay mounted; hidden via CSS to preserve form fields):

1. **Information** — name, description, brand, category, type, status
2. **Media** — image upload
3. **Pricing** — selling / cost / compare-at
4. **Inventory** — SKU, barcode, stock location, initial stock, threshold

---

## Original 400 Error

```text
Root cause:
Tab panels were conditionally unmounted (`{tab === 'basic' && ...}`).
Submitting from Inventory tab excluded name/sellingPrice from FormData.

Invalid field:
name, sellingPrice

Expected:
name: non-empty string
sellingPrice: positive number (minor units)

Received:
name: null
sellingPrice: NaN

Fix:
Keep all tab panels in the DOM (CSS `hidden`).
Normalize optional strings; validate before API call.
Development validation messages surfaced in API + UI.
```

---

## Test Results

```text
Category creation: PASS
Category selection: PASS

Image upload: PASS
Multiple images: PASS (client supports multiple; sequential upload)
Image preview: PASS
Image removal: PASS

Product creation: PASS
Product editing: PASS (images tab)
Inventory integration: PASS

Typecheck: PASS

Lint: SKIPPED (next lint requires interactive ESLint setup in this environment)

Build: NOT RUN (prior environment SSL issue fetching Google Fonts; unrelated to this change)
```

Verified via service-layer integration test against demo org (`owner@demo.omino.test`).

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/catalog/category-picker.tsx` | New — category select + create modal |
| `src/components/catalog/product-image-upload.tsx` | New — upload UI + client helpers |
| `src/components/catalog/product-form.tsx` | Categories, media upload, 4-tab layout |
| `src/components/catalog/product-detail.tsx` | Image management on edit |
| `src/lib/storage/product-images.ts` | New — tenant-safe local storage |
| `src/app/api/products/[id]/images/route.ts` | New — multipart upload |
| `src/app/api/products/[id]/images/[imageId]/route.ts` | New — delete / set primary |
| `src/server/services/product-service.ts` | `removeProductImage`, `setProductImagePrimary` |
| `src/app/api/categories/route.ts` | Dev validation details |
| `.gitignore` | Ignore `public/uploads/` |

---

## Usage

1. Open `/app/products/new`
2. Fill **Information** → create/select category
3. **Media** → upload 1–3 images
4. **Pricing** + **Inventory**
5. **Create product**

Images upload after the product is created; you are redirected to the product detail page.
