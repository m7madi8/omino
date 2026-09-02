# OMINO — Phase 5 Implementation

**Date:** 2026-09-01  
**Scope:** Online Store Engine  
**Status:** Implemented — requires `npx prisma db push` on target database

---

## 1. Architecture

```
                    Commerce Core
                         │
          ┌──────────────┼──────────────┐
          │              │              │
        POS          Online Store    (future)
          │              │
          └────── Cart → Order → Payment → Inventory
```

One product catalog, one inventory system, one order/payment domain. Online store is a **channel** (`OrderSource.ONLINE`, `CartChannel.ONLINE`), not a separate commerce engine.

---

## 2. Database Changes

### Store extensions
- `publicSlug` (globally unique) — public URL `/store/[publicSlug]`
- `status` — ACTIVE | PAUSED | MAINTENANCE
- `description`, `logoUrl`, `faviconUrl`, `contactEmail`, `contactPhone`
- `currency`, `country`, `timezone`, `primaryColor`, `secondaryColor`
- `taxRateBps`, `socialLinks`, `checkoutSettings`

### Cart extensions
- `channel` — POS | ONLINE
- `guestSessionToken` — guest cart persistence (httpOnly cookie)
- `userId` — optional (guest carts have no staff user)
- `shippingAmount`, `couponCode`, `metadata`

### Order extensions
- `guestEmail`, `guestPhone`, `shippingAddress` (JSON snapshot)
- `accessToken` — secure order confirmation lookup
- `userId` — optional for guest online orders

### New table: `shipping_methods`
Per-store shipping options with name, price, estimated delivery, active flag.

### PaymentMethod enum
Added `COD` (Cash on Delivery).

### Migration

```bash
npx prisma db push
# For existing stores, backfill publicSlug:
# UPDATE stores SET public_slug = slug WHERE public_slug IS NULL;
npm run db:seed
```

---

## 3. Services

| Service | File | Responsibility |
|---------|------|----------------|
| Store admin | `store-service.ts` | Settings CRUD, shipping methods |
| Storefront | `storefront-service.ts` | Public catalog, guest cart, online checkout |
| Order (reused) | `order-service.ts` | Totals, order numbers, events |
| Payment (reused) | `payment-service.ts` | COD payment records |
| Inventory (reused) | `inventory-service.ts` | Stock validation + SALE decrement |
| Customer (reused) | `customer-service.ts` | `findOrCreateCustomerFromCheckout` |

### Online checkout flow (`checkoutOnline`)

1. Idempotency check
2. Validate store ACTIVE
3. Load guest cart + validate items
4. Re-validate prices from server (reject `PRICE_CHANGED`)
5. Stock check (`INSUFFICIENT_STOCK`)
6. Create/find customer
7. Create order (`source: ONLINE`, `status: PENDING`, `fulfillment: UNFULFILLED`)
8. Decrement inventory atomically
9. Create COD payment (`status: PENDING`)
10. Complete cart, record events

---

## 4. Routes

### Public storefront
| Route | Description |
|-------|-------------|
| `/store/[storeSlug]` | Store home |
| `/store/[storeSlug]/products` | Product catalog |
| `/store/[storeSlug]/products/[productSlug]` | Product detail + variant selection |
| `/store/[storeSlug]/categories/[categorySlug]` | Category products |
| `/store/[storeSlug]/cart` | Guest cart |
| `/store/[storeSlug]/checkout` | Checkout form |
| `/store/[storeSlug]/order/[orderNumber]?token=` | Order confirmation |

### Public API
| Method | Route | Auth |
|--------|-------|------|
| GET | `/api/storefront/[storeSlug]` | Public |
| GET | `/api/storefront/[storeSlug]/products` | Public |
| GET | `/api/storefront/[storeSlug]/products/[productSlug]` | Public |
| GET | `/api/storefront/[storeSlug]/categories` | Public |
| GET/POST | `/api/storefront/[storeSlug]/cart` | Guest cookie |
| GET/POST | `/api/storefront/[storeSlug]/checkout` | Guest cookie |
| GET | `/api/storefront/[storeSlug]/order/[orderNumber]` | accessToken |

### Business OS admin
| Route | Permission |
|-------|------------|
| `/app/store` | `store.read` / `store.write` |
| `/api/store/settings` | `store.read` / `store.write` |

---

## 5. Security

- All product/variant/cart lookups scoped by `storeId` + `organizationId`
- Prices resolved server-side — never trusted from client
- Order confirmation requires `orderNumber` + `accessToken` UUID
- Guest carts isolated by `guestSessionToken` httpOnly cookie
- Cross-store/cross-org access rejected server-side
- Store PAUSED/MAINTENANCE blocks checkout

---

## 6. Permissions

| Permission | Roles (default) |
|------------|-----------------|
| `store.read` | MANAGER, STAFF |
| `store.write` | MANAGER |
| `store.manage` | OWNER, ADMIN |

---

## 7. Guest Shopping

- No account required
- Cookie-based cart (`omino_guest_{storeSlug}`)
- Customer record created/found at checkout via email/phone
- Architecture ready for future cart merge on login

---

## 8. Events (placeholder)

`storefront-events.ts`: `product_viewed`, `product_added_to_cart`, `cart_updated`, `checkout_started`, `checkout_completed`

---

## 9. Reference Repositories

| Repo | Concepts used |
|------|---------------|
| **spree-main** | Storefront/catalog, cart, checkout, order channel pattern |
| **Nexus-ERP-main** | Tenant isolation, store/org boundaries |
| **caratflow-main** | Checkout state transitions, money handling |
| **genix / multi-agent-business-os** | Event naming for future AI |

---

## 10. Tests

```bash
npm run build          # ✓ passes
npm run test:phase5    # API smoke (requires dev server)
```

---

## 11. Known Limitations

- No payment gateway (Stripe/PayPal) — COD only
- No coupon/promotions UI (schema foundation: `couponCode` on cart)
- No customer accounts / login on storefront
- No custom domains, theme marketplace, page builder
- No email order confirmation
- No stock reservation during checkout window
- Existing DBs need `publicSlug` backfill for stores created before Phase 5

---

## 12. Recommended Phase 6

CRM + Customer Engine — customer accounts, addresses, order history portal, loyalty foundation.
