# OMINO — Phase 6 Implementation

**Date:** 2026-09-01  
**Scope:** CRM + Customer Engine  
**Status:** Implemented — requires `npx prisma db push` + RLS SQL on target database

---

## 1. Architecture

ONE centralized `Customer` domain serves POS, Online Store, Orders, Payments, Marketing, and future AI.

```
POS ──────────┐
Online Store ─┼→ Customer Service → Orders / Payments / Timeline
Manual CRM ───┘
```

**Customer ≠ User** — business employees use `Membership`; shoppers use `Customer`.

---

## 2. Database Changes

### Evolved `customers`
| Field | Notes |
|-------|-------|
| firstName, lastName | Optional structured name |
| name | Display name (preserved from Phase 3) |
| emailNormalized, phoneNormalized | Deduplication / search |
| status | ACTIVE, INACTIVE, BLOCKED |
| source | POS, ONLINE_STORE, MANUAL, IMPORT, API |
| notes | Internal profile notes |
| externalId, externalSource | Import foundation |
| deletedAt | Soft archive |

### New tables
| Table | Purpose |
|-------|---------|
| `customer_addresses` | Shipping/billing addresses |
| `customer_tags` | Org-scoped tags |
| `customer_tag_assignments` | Many-to-many |
| `customer_notes` | Internal staff notes |
| `customer_events` | Customer timeline |

**File:** `prisma/schema.prisma`

### Migration
```bash
npx prisma db push
psql $DATABASE_URL -f prisma/migrations/rls_phase6_policies.sql
npm run db:seed
npm run test:phase6
```

---

## 3. Services

| Service | File | Responsibilities |
|---------|------|------------------|
| Customer | `customer-service.ts` | CRUD, dedup, checkout match, cart attach, order activity |
| Search | `customer-search-service.ts` | Paginated search, filters |
| Metrics | `customer-metrics-service.ts` | Revenue, AOV, order counts, AI context |
| Address | `customer-address-service.ts` | Address CRUD |
| Tags | `customer-tag-service.ts` | Tag management, attach/detach |
| Timeline | `customer-timeline-service.ts` | Notes, detail, export |

### Utilities
`src/lib/customer-utils.ts` — email/phone normalization, display name

### Events
`src/server/events/customer-events.ts` — placeholder emitter for automations

---

## 4. API Routes

| Method | Route | Permission |
|--------|-------|------------|
| GET | `/api/customers` | customers.read |
| GET | `/api/customers?match=true` | customers.read |
| GET | `/api/customers?export=true` | customers.export |
| POST | `/api/customers` | customers.write |
| GET | `/api/customers/[id]` | customers.read |
| GET | `/api/customers/[id]?context=ai` | customers.read |
| PATCH | `/api/customers/[id]` | customers.write |
| DELETE | `/api/customers/[id]` | customers.delete |
| GET/POST | `/api/customers/[id]/notes` | read / manage_notes |
| GET/POST | `/api/customers/[id]/addresses` | read / write |
| GET/POST | `/api/customers/tags` | read / manage_tags |
| POST | `/api/pos/carts` action `set_customer` | pos.sell |

---

## 5. UI Routes

| Route | Description |
|-------|-------------|
| `/app/customers` | Customer list with search, filters, metrics columns |
| `/app/customers/new` | Create customer with duplicate detection |
| `/app/customers/[id]` | Profile — metrics, orders, addresses, tags, notes, timeline |
| `/app/customers/[id]/edit` | Edit customer |

### POS Integration
`/app/pos` — attach/search/create customer on cart via customer modal

---

## 6. Permissions

| Permission | OWNER | ADMIN | MANAGER | STAFF |
|------------|-------|-------|---------|-------|
| customers.read | ✓ | ✓ | ✓ | ✓ |
| customers.write | ✓ | ✓ | ✓ | ✓ |
| customers.delete | ✓ | ✓ | ✓ | ✗ |
| customers.manage_tags | ✓ | ✓ | ✓ | ✗ |
| customers.manage_notes | ✓ | ✓ | ✓ | ✗ |
| customers.export | ✓ | ✓ | ✓ | ✗ |

---

## 7. Deduplication

- Email exact match (normalized)
- Phone match (digits-only)
- Name match (fallback, lower confidence)
- `DUPLICATE_CUSTOMER` returned on create with match list
- `findOrCreateCustomerFromCheckout()` for guest checkout (Online Store ready)

---

## 8. Customer Metrics (server-side)

- totalOrders, completedOrders, cancelledOrders, refundedOrders
- totalRevenueMinor, refundedMinor, netRevenueMinor
- averageOrderValueMinor
- firstOrderAt, lastOrderAt

---

## 9. AI Readiness

`GET /api/customers/[id]?context=ai` returns structured `CustomerContext`:
- profile, metrics, recentOrders, activitySummary

---

## 10. Online Store Integration (foundation)

`findOrCreateCustomerFromCheckout()` in customer-service:
- Match by email/phone
- Create if no confident match
- Link order via existing `customerId` on Order

Full storefront checkout customer capture uses this when Phase 5 checkout is wired.

---

## 11. Merge Foundation

Not exposed in UI. Documented approach:
- Primary customer retains identity
- Orders/addresses/notes/tags/events re-pointed
- No deletion of commerce history

---

## 12. Security

- Tenant isolation via `organizationId`
- RLS: `prisma/migrations/rls_phase6_policies.sql`
- Internal notes never in public APIs
- Export requires `customers.export` + audit log

---

## 13. Tests

**File:** `scripts/test-phase6.ts`  
Covers: create, update, archive, dedup, search, addresses, tags, notes, metrics, checkout match, tenant isolation.

---

## 14. Reference Repositories

| Repo | Concepts adapted |
|------|------------------|
| Nexus-ERP | CRM contacts, tenant isolation, audit |
| Spree | Customer/order relationship, guest customers, addresses |
| Caratflow | Activity timeline, lifecycle events |
| Genix | Event-ready structured data |
| multi-agent-business-os | AI customer context shape |

---

## 15. Known Limitations

- No customer merge UI
- No import wizard
- No loyalty/rewards/campaigns
- Online Store checkout customer UI depends on Phase 5 storefront completion
- Full-text/fuzzy search not implemented (indexed prefix/contains only)

---

## 16. Recommended Phase 7

Analytics + Business Intelligence consuming customer metrics and `customer_events`.
