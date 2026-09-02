# OMINO — Phase 2 Implementation

**Date:** 2026-09-01  
**Scope:** Product Catalog + Inventory Domain  
**Status:** Implemented — requires `npx prisma db push` + RLS SQL on target database

---

## 1. Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Product model | Product → Variants (Spree pattern) | POS, store, orders need variant-level SKUs |
| Single-variant products | Auto-create default variant | Simple products don't require variant UI |
| Money | Integer minor units | CaratFlow/Spree pattern; avoids float errors |
| Inventory | StockLevel per StockLocation | Multi-branch support |
| Stock changes | Immutable StockMovement ledger | Audit, AI, analytics |
| Available qty | Computed: onHand − reserved | Not duplicated in DB |
| Tenancy | `organizationId` on all catalog tables | Phase 1 pattern |
| API layer | REST routes + service layer | Matches Phase 1 |
| Events | Log placeholder (`catalog-events.ts`) | Future BullMQ bus |

---

## 2. Database Schema

### New enums
`ProductStatus`, `ProductType`, `BarcodeType`, `StockMovementType`, `StockTransferStatus`, `StockLocationType`

### New tables

| Table | Purpose |
|-------|---------|
| `categories` | Nested product categories (parentId) |
| `product_options` | Flexible options (Size, Color, Volume…) |
| `product_option_values` | Values per option |
| `products` | Catalog product (org-scoped) |
| `product_option_links` | Product ↔ options |
| `product_variants` | SKU, pricing, barcode, thresholds |
| `product_variant_options` | Variant ↔ option values |
| `product_images` | Multiple images per product |
| `stock_locations` | Branch/warehouse/backroom |
| `stock_levels` | On hand, reserved, incoming per variant+location |
| `stock_movements` | Immutable inventory ledger |
| `stock_transfers` | Inter-location transfer header |
| `stock_transfer_items` | Transfer line items |

**File:** `prisma/schema.prisma`

### Migration steps

```bash
npx prisma db push          # or prisma migrate dev --name phase2_catalog
psql $DATABASE_URL -f prisma/migrations/rls_phase2_policies.sql
npm run db:seed             # adds demo products to demo org
```

---

## 3. Domain Hierarchy

```
Organization
  └── Store
        └── Branch
              └── StockLocation (default per branch on onboarding)
                    └── StockLevel (per Variant)
                          └── StockMovement (audit trail)
Product (org-level, optional storeId)
  └── ProductVariant (SKU, price, barcode)
        └── ProductVariantOption → ProductOptionValue
```

---

## 4. Services

| Service | File | Key functions |
|---------|------|---------------|
| Product | `src/server/services/product-service.ts` | `listProducts`, `createProduct`, `updateProduct`, `archiveProduct`, `getProductDetail` |
| Category | `src/server/services/category-service.ts` | `listCategories`, `createCategory`, `updateCategory`, `archiveCategory` |
| Inventory | `src/server/services/inventory-service.ts` | `adjustStock`, `listInventory`, `listStockLocations`, `createStockTransfer`, `completeStockTransfer`, `ensureDefaultStockLocation` |

### Inventory consistency
- All stock changes run in `prisma.$transaction`
- `adjustStockInTx` used internally for transfers (no nested transactions)
- Negative stock blocked unless `allowNegative: true`
- Every adjustment creates a `StockMovement` with `balanceAfter`

---

## 5. API Routes

| Method | Route | Permission | Action |
|--------|-------|------------|--------|
| GET | `/api/products` | products.read | List (search, filter, paginate) |
| POST | `/api/products` | products.write | Create product + variants |
| GET | `/api/products/[id]` | products.read | Product detail |
| PATCH | `/api/products/[id]` | products.write | Update / activate / archive |
| DELETE | `/api/products/[id]` | products.write | Soft archive |
| GET | `/api/categories` | products.read | List categories |
| POST | `/api/categories` | products.write | Create category |
| GET | `/api/inventory` | inventory.read | List levels / locations |
| POST | `/api/inventory` | inventory.write | Adjust / transfer |
| GET | `/api/inventory/[id]` | inventory.read | Variant inventory detail |

---

## 6. UI Routes

| Route | Description |
|-------|-------------|
| `/app/products` | Product list (table + mobile cards) |
| `/app/products/new` | Create product (tabbed form) |
| `/app/products/[id]` | Product command center (Overview, Variants, Inventory, Images) |
| `/app/inventory` | Inventory overview + low stock filter |
| `/app/inventory/[id]` | Variant stock detail + movement history |

### Components
- `src/components/catalog/products-list.tsx`
- `src/components/catalog/product-form.tsx`
- `src/components/catalog/product-detail.tsx`
- `src/components/catalog/inventory-list.tsx`
- `src/components/catalog/inventory-detail.tsx`
- `src/components/catalog/stock-adjust-dialog.tsx`
- `src/components/catalog/status-badge.tsx`

---

## 7. Permissions (RBAC)

| Permission | OWNER | ADMIN | MANAGER | STAFF |
|------------|-------|-------|---------|-------|
| products.read | ✓ | ✓ | ✓ | ✓ |
| products.write | ✓ | ✓ | ✓ | ✗ |
| inventory.read | ✓ | ✓ | ✓ | ✓ |
| inventory.write | ✓ | ✓ | ✓ | ✗ |

Enforced server-side via `requireTenantContext(permission)` — not UI-only.

---

## 8. Security & RLS

- Application layer: all queries filter by `organizationId` from JWT session
- RLS policies: `prisma/migrations/rls_phase2_policies.sql`
- `setTenantContext()` called in `requireTenantContext()` before sensitive ops
- Cross-org access returns 403/404

---

## 9. Future Events (prepared, not bus)

```text
product.created
product.updated
product.archived
variant.created
inventory.adjusted
inventory.low_stock
inventory.transferred
category.created
category.updated
```

Emitter: `src/server/events/catalog-events.ts`

---

## 10. Tests

```bash
npm run test:phase2
```

**Coverage:**
- Product CRUD + archive
- Category create
- Stock adjustment + negative stock block
- Multi-tenant isolation (Org A vs Org B)
- Stock location isolation

Requires database with schema pushed.

---

## 11. Reference Repositories Used

| Repo | What we took |
|------|--------------|
| **spree-main** | Product/Variant, StockLevel, StockMovement, Category, event naming |
| **Nexus-ERP-main** | Tenant middleware pattern (not flat product.stock) |
| **caratflow-main** | Money minor units, TenantAwareService, event catalog shape |
| **genix-main** | Structured data for future AI (concept only, no GPL code) |
| **multi-agent-business-os** | RAG/event architecture reference (deferred) |

See `OMINO-CODE-EXTRACTION-LOG.md` for file-level mapping.

---

## 12. Known Limitations

- Image upload: URL-only (no file storage provider yet)
- Variant creation UI: only on product create form (no add-variant on detail page yet)
- Price lists / multi-currency per variant: schema-ready, not implemented
- Stock reservations: `quantityReserved` field exists; reservation logic in Phase 8 (Orders)
- Full transfer UI: API exists; no dedicated transfer wizard page
- Event bus: placeholder logging only
- `prisma db push` + RLS SQL must be run manually on target DB

---

## 13. Files Created

```
prisma/migrations/rls_phase2_policies.sql
src/lib/money.ts
src/lib/api/tenant.ts
src/types/catalog.ts
src/types/prisma-enums.ts
src/server/events/catalog-events.ts
src/server/services/product-service.ts
src/server/services/category-service.ts
src/server/services/inventory-service.ts
src/app/api/products/route.ts
src/app/api/products/[id]/route.ts
src/app/api/categories/route.ts
src/app/api/inventory/route.ts
src/app/api/inventory/[id]/route.ts
src/app/app/products/new/page.tsx
src/app/app/products/[id]/page.tsx
src/app/app/inventory/[id]/page.tsx
src/components/catalog/*.tsx (6 files)
scripts/test-phase2.ts
OMINO-CODE-EXTRACTION-LOG.md
OMINO-PHASE-2-IMPLEMENTATION.md
```

## 14. Files Modified

```
prisma/schema.prisma
prisma/seed.ts
package.json
src/app/app/products/page.tsx
src/app/app/inventory/page.tsx
src/server/services/organization-service.ts (auto-create stock location on onboarding)
src/app/onboarding/page.tsx (build fix: duplicate `update` identifier)
src/lib/auth/index.ts (build fix: session type cast)
```

---

## 15. Recommended Phase 3

**POS Module** — consume Product + Inventory domain:
- Barcode/SKU search
- Cart builder
- `sale.completed` event → stock decrement via `adjustStock(type: SALE)`
- Receipt generation

Prerequisite: run database migration on production/staging before POS work.
