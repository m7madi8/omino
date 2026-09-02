# OMINO Palestine Mode — Audit

**Date:** 2026-09-03  
**Status:** Pre-implementation audit (Step 0)

---

## A. What Exists Today

| Area | Status | Key Files |
|------|--------|-----------|
| Multi-tenant org/store | Ready | `prisma/schema.prisma`, `src/server/services/organization-service.ts` |
| Onboarding PS/ILS defaults | Ready | `src/app/onboarding/page.tsx` — `country: 'PS'`, `currency: 'ILS'` |
| COD checkout | Partial | `src/server/services/storefront-service.ts` — `Payment(PENDING, COD)` |
| Order state machine | Defined, underused | `src/server/services/order-service.ts` — `ORDER_TRANSITIONS` only in cancel |
| POS terminal | Ready | `src/components/commerce/pos-terminal.tsx`, `src/server/services/pos-service.ts` |
| Customer phone dedup | Ready | `src/server/services/customer-service.ts` — `phoneNormalized` |
| Today analytics data | Mostly ready | `src/server/services/analytics/analytics-service.ts` — channel split, low stock |
| Shipping methods | Reusable as zones | `ShippingMethod` model |
| Mobile bottom nav | Ready to refactor | `src/components/app/mobile-bottom-nav.tsx`, `app-shell.tsx` |
| Business signals | Rules foundation | `src/server/services/analytics/business-signals-service.ts` |
| WhatsApp (store settings) | Link only | `src/app/app/store/store-admin-client.tsx` |

---

## B. Critical Gaps

1. Orders page filters `source: 'POS'` only — hides online/COD orders
2. No COD collection workflow (`collectCodPayment`)
3. No order progression API (confirm → deliver → collect)
4. No Arabic i18n in Next.js app
5. No Simple Mode navigation (14+ modules visible)
6. No `/app/today` route
7. No quick product add flow
8. `OrderSource` lacks `MANUAL`
9. Fulfillment never updated post-checkout
10. Production section load errors (Prisma/schema)

---

## C. Reusable Assets

- `getAnalyticsOverview({ preset: 'today' })` for Today dashboard
- `ShippingMethod` for delivery zones (no new model)
- `findOrCreateCustomerFromCheckout` for manual orders
- `createPayment` + idempotency for offline POS sync
- `MODULE_NAV` for Advanced hub
- `OrderEvent` metadata for delivery sub-states (no schema change)

---

## D. Files That Will Change

| Category | Files |
|----------|-------|
| Schema | `prisma/schema.prisma` |
| i18n | `src/lib/i18n/**`, `src/components/providers/locale-provider.tsx` |
| Merchant | `src/lib/merchant/**` |
| Nav | `app-shell.tsx`, `mobile-bottom-nav.tsx`, `add-action-sheet.tsx` |
| Pages | `app/today`, `app/advanced`, `app/products/quick`, `app/orders/new` |
| Services | `today-dashboard-service`, `manual-order-service`, `business-insights-service`, `payment-service`, `order-service` |
| API | `api/orders`, `api/products/quick`, `api/merchant/insights` |
| Onboarding | `onboarding/page.tsx`, `api/onboarding/route.ts`, `organization-service.ts` |

---

## E. Existing APIs (reuse)

- `GET /api/analytics?preset=today`
- `GET /api/orders` (extend filters)
- `PATCH /api/orders/[id]` (extend actions)
- `POST /api/products` (full create — quick variant wraps this)
- `POST /api/storefront/[slug]/checkout` (COD)
- POS APIs under `/api/pos/*`

---

## F. New APIs Required

| Endpoint | Purpose |
|----------|---------|
| `GET /api/merchant/today` | Slim today dashboard payload |
| `POST /api/products/quick` | Minimal product create |
| `POST /api/orders/manual` | Manual/WhatsApp order |
| `GET /api/merchant/insights` | Top 3 attention cards |
| `PATCH /api/orders/[id]` | Lifecycle + COD collect actions |
| `GET/POST /api/store/delivery-zones` | ShippingMethod CRUD alias |

---

## G. Database Changes

| Change | Type |
|--------|------|
| `Organization.locale` | `String @default("en")` |
| `Organization.merchantExperienceMode` | `String @default("standard")` |
| `OrderSource.MANUAL` | Enum value |

Delivery stages via `OrderEvent` — no new columns on Order.

---

## H. Risks

| Risk | Mitigation |
|------|------------|
| Breaking advanced users | `merchantExperienceMode` gate |
| Order state confusion | Arabic UI labels + mapping doc |
| i18n incomplete | Simple Mode Arabic first |
| Offline duplicates | Idempotency keys |
| Scope creep (WhatsApp API) | Share links + manual notify only |

---

## I. Implementation Plan

See phased delivery in repo plan. Order:

1. Phase 1 — Audit + shell (i18n, nav, schema)
2. Phase 2 — Today dashboard
3. Phase 3 — Quick product
4. Phase 4 — Manual orders
5. Phase 5 — WhatsApp sharing
6. Phase 6 — COD workflow
7. Phase 7 — Delivery zones
8. Phase 8 — POS accessibility
9. Phase 9 — Offline POS foundation
10. Phase 10 — Business insights
11. Phase 11 — Polish + report

---

## Order Lifecycle Mapping

| Arabic | Order.status | fulfillmentStatus | OrderEvent |
|--------|--------------|---------------------|------------|
| جديد | PENDING | UNFULFILLED | order.created |
| تم التأكيد | CONFIRMED | UNFULFILLED | order.confirmed |
| قيد التجهيز | PROCESSING | UNFULFILLED | order.processing |
| مع السائق | PROCESSING | PARTIALLY_FULFILLED | delivery.out_for_delivery |
| تم التسليم | PROCESSING | FULFILLED | delivery.delivered |
| تم التحصيل | COMPLETED | FULFILLED | payment.collected |
| ملغي | CANCELLED | CANCELLED | order.cancelled |
