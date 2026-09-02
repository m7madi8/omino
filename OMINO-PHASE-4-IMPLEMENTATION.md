# OMINO — Phase 4 Implementation

**Date:** 2026-09-01  
**Scope:** Orders + Payments Commerce Core  
**Status:** Implemented — requires `npx prisma db push` + RLS SQL on target database

---

## 1. Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Single order engine | Evolved Phase 3 schema | Avoid duplicate order systems |
| Order states | Separate order / payment / fulfillment status | Online commerce readiness (Spree pattern) |
| Order numbers | `OM-{year}-{seq}` per org | Human-readable, concurrent-safe via `order_number_sequences` |
| Money | Integer minor units | Consistent with Phase 2 |
| Snapshots | Immutable `order_items` fields | Historical accuracy when catalog changes |
| Adjustments | `order_adjustments` table | Generic discount/tax/shipping/fee without schema churn |
| Payments | Multiple per order + `payment_attempts` | Split pay, retries, online gateway prep |
| Refunds | Separate `refunds` + `refund_items` | Traceable; never mutate original payment |
| Idempotency | `idempotency_key` on order/payment/refund | Double-click / retry safety |
| Events | `order_events` + log emitter | AI/automation hook without full bus |
| Audit | `audit_logs` append-only | Nexus pattern |
| POS flow | Cart → checkout → order + payment + inventory | One engine for all channels |

---

## 2. State Machines

### Order Status
`DRAFT → PENDING → CONFIRMED → PROCESSING → COMPLETED`  
Terminal: `CANCELLED`  
Invalid transitions throw `INVALID_STATE_TRANSITION`.

### Payment Status (stored on order, derived from payments/refunds)
`PENDING | AUTHORIZED | PAID | PARTIALLY_PAID | FAILED | REFUNDED | PARTIALLY_REFUNDED | CANCELLED`

### Fulfillment Status
`UNFULFILLED | PARTIALLY_FULFILLED | FULFILLED | CANCELLED`  
POS checkout sets `FULFILLED` immediately.

### Order Source
`POS | ONLINE` (extensible enum)

---

## 3. Database Changes

### Evolved enums
- `OrderStatus`, `PaymentStatus`, `FulfillmentStatus`, `OrderSource`, `AdjustmentType`, `RefundStatus`

### New tables
| Table | Purpose |
|-------|---------|
| `order_adjustments` | Generic financial adjustments |
| `order_number_sequences` | Concurrent order number generation |
| `payment_attempts` | Payment retry history |
| `refunds` | Refund records |
| `refund_items` | Line-level partial refunds |
| `order_events` | Order timeline |
| `audit_logs` | Critical action audit trail |

### Order model additions
`source`, `paymentStatus`, `fulfillmentStatus`, `shippingAmount`, `feesAmount`, `paidMinor`, `refundedMinor`, `metadata`, cancel fields

**File:** `prisma/schema.prisma`

### Migration steps

```bash
npx prisma db push
psql $DATABASE_URL -f prisma/migrations/rls_phase4_policies.sql
npm run db:seed   # re-seeds permissions including orders.cancel, payments.refund
npm run test:phase4
```

---

## 4. Services

| Service | File | Key functions |
|---------|------|---------------|
| Order | `src/server/services/order-service.ts` | `listOrders`, `getOrderDetail`, `cancelOrder`, `generateOrderNumber`, `calculateOrderTotals` |
| Payment | `src/server/services/payment-service.ts` | `createPayment`, `createRefund`, `listPayments`, `recordPaymentFailure` |
| POS | `src/server/services/pos-service.ts` | `checkout`, `addToCart`, `searchPosProducts`, session/cart management |
| Audit | `src/server/services/audit-service.ts` | `logAudit` |
| Events | `src/server/events/order-events.ts` | `emitOrderEvent` (placeholder) |

### Transaction boundaries
`checkout()` runs in a single Prisma transaction:
1. Validate stock
2. Create order + snapshots + adjustments
3. Deduct inventory (`SALE` movements)
4. Create payment(s) with attempts
5. Update session totals
6. Record events + audit

`createRefund()` validates refundable amount, creates refund record, optionally restocks (`RETURN`).

---

## 5. API Routes

| Method | Route | Permission | Action |
|--------|-------|------------|--------|
| GET | `/api/orders` | orders.read | List (search, filter, paginate) |
| GET | `/api/orders/[id]` | orders.read | Order detail |
| POST | `/api/orders/[id]` | orders.cancel / orders.refund | Cancel or refund |
| GET | `/api/payments` | payments.read | Payment list |
| GET/POST | `/api/pos/carts` | pos.read / pos.sell | Cart CRUD, checkout |
| GET | `/api/pos/products` | pos.read | POS product search |
| GET/POST | `/api/pos/sessions` | pos.read / pos.manage_sessions | Session open/close |

---

## 6. UI Routes

| Route | Description |
|-------|-------------|
| `/app/orders` | Order list — search, filters, pagination, mobile cards |
| `/app/orders/[id]` | Order command center — items, payments, timeline, inventory, refund/cancel |
| `/app/pos` | POS terminal — product grid, cart, cash/card checkout |
| `/app/payments` | Payment history list |

### Components
- `src/components/commerce/orders-list.tsx`
- `src/components/commerce/order-detail.tsx`
- `src/components/commerce/pos-terminal.tsx`
- `src/components/commerce/status-badge.tsx`

---

## 7. Permissions (RBAC)

| Permission | OWNER | ADMIN | MANAGER | STAFF |
|------------|-------|-------|---------|-------|
| orders.read | ✓ | ✓ | ✓ | ✓ |
| orders.write | ✓ | ✓ | ✓ | ✓ |
| orders.cancel | ✓ | ✓ | ✓ | ✗ |
| orders.refund | ✓ | ✓ | ✓ | ✗ |
| payments.read | ✓ | ✓ | ✓ | ✓ |
| payments.write | ✓ | ✓ | ✓ | ✓ |
| payments.refund | ✓ | ✓ | ✓ | ✗ |
| pos.sell | ✓ | ✓ | ✓ | ✓ |

---

## 8. Security & RLS

- Server-side `requireTenantContext(permission)` on all routes
- Org-scoped queries in services
- RLS: `prisma/migrations/rls_phase4_policies.sql`
- No card data stored
- Refund amount validated server-side
- Idempotency keys prevent duplicate transactions

---

## 9. Reference Repositories

| Repo | Concepts adapted |
|------|------------------|
| spree-main | Order states, line item snapshots, adjustments, payment attempts |
| Nexus-ERP-main | Audit logs, tenant isolation |
| caratflow-main | State transitions, workflow patterns |
| genix-main | Event naming for future automation |
| multi-agent-business-os | Structured commerce data for future AI tools |

---

## 10. Tests

**File:** `scripts/test-phase4.ts`  
**Run:** `npm run test:phase4`

Covers: checkout, order numbers, snapshots, idempotency, inventory deduction, tenant isolation, partial refund, refund limits, state transitions.

---

## 11. Known Limitations

- No real payment gateway (Stripe etc.)
- No online store checkout UI
- No shipping carrier integration
- No advanced promotions engine
- Lint not configured (Next.js ESLint setup pending)
- Database migration must be run manually when DB is available

---

## 12. Recommended Phase 5

1. Online Store frontend (uses same order engine with `source: ONLINE`)
2. Customer CRM enhancements
3. Stripe/payment gateway integration
4. Shipping & fulfillment workflow
5. Analytics dashboards consuming order/payment domain
