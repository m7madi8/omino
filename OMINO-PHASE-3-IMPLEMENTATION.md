# OMINO — Phase 3 Implementation

**Date:** 2026-09-01  
**Scope:** POS Engine (sessions, carts, orders, payments, inventory integration)  
**Status:** Implemented — requires database push/migrate + RLS SQL on target database

---

## 1. Architecture

```
User → Organization → Store → Branch → Register → PosSession → Cart → Order → Payment → StockMovement (SALE)
```

The POS consumes the **existing** Product, Variant, and Inventory domains. No duplicate catalog or stock systems.

| Layer | Responsibility |
|-------|----------------|
| `PosTerminal` (UI) | Product search, cart, payment modal, receipt |
| API routes (`/api/pos/*`) | Auth, tenant context, validation |
| `pos-service.ts` | Sessions, carts, checkout, void |
| `order-service.ts` | Order numbers, totals, list/detail, cancel |
| `payment-service.ts` | Payment creation with idempotency |
| `inventory-service.ts` | `adjustStockInTx` inside checkout transaction |

---

## 2. Database

Commerce tables were present in `prisma/schema.prisma` (Phase 4 blueprint values adapted for Phase 3):

| Table | Purpose |
|-------|---------|
| `registers` | Multiple registers per branch |
| `pos_sessions` | Open/close register, cash reconciliation |
| `customers` | Minimal walk-in / named customer reference |
| `carts` / `cart_items` | Active, held, completed carts |
| `orders` / `order_items` | Historical sale records with snapshot fields |
| `order_adjustments` | Discount and tax line items |
| `order_number_sequences` | `OM-YYYY-NNNNNN` numbering |
| `order_events` | Audit timeline for future automation |
| `payments` / `payment_attempts` | CASH, CARD, OTHER — split-payment ready |
| `refunds` / `refund_items` | Foundation only (not fully exposed in UI) |

### Order statuses (POS)
- `COMPLETED` — successful sale
- `CANCELLED` — voided POS order (restocks inventory)

### POS session statuses
- `OPEN` / `CLOSED` (SUSPENDED, RECONCILIATION_REQUIRED reserved in enum)

### Migration

```bash
npx prisma db push   # or prisma migrate dev
psql $DATABASE_URL -f prisma/migrations/rls_phase4_policies.sql
npm run db:seed
```

---

## 3. POS Session & Register

- `ensureDefaultRegister()` creates "Register 1" per branch if none exists
- `openPosSession()` — opening cash, notes; one open session per user/register
- `closePosSession()` — closing cash, expected cash, difference
- Session tracks `cashSales`, `cardSales`, `otherSales`, `totalSales`, `orderCount`

---

## 4. Cart

- `getOrCreateActiveCart()` — one active cart per user/session
- `addToCart`, `updateCartItem`, `applyCartDiscount`, `setCartTaxRate`
- `holdCart` / `resumeHeldCart` / `listHeldCarts` — persisted held carts
- Line items store `productId`, `variantId`, `productName`, `sku`, `unitPriceMinor` (historical snapshot at cart time)
- Totals via `calculateOrderTotals()` from order-service

---

## 5. Checkout (Atomic Transaction)

`checkout()` in `pos-service.ts`:

1. Idempotency check (`Order.idempotencyKey`)
2. Load cart + validate stock per variant (`INSUFFICIENT_STOCK`)
3. Create order + order items + adjustments
4. Decrement inventory via `adjustStockInTx(type: SALE)` — same transaction
5. Create payment(s) via `createPayment()` — supports multiple payments per order
6. Update cart status → `COMPLETED`
7. Update POS session sales counters
8. Record order events + audit log

**No partial commits** — order, payment, and inventory succeed or fail together.

---

## 6. Idempotency

- `idempotencyKey` on `Order` (unique) and `Payment`
- Client generates UUID per Pay action; duplicate requests return existing order
- `payLock` ref in UI prevents double-submit

---

## 7. Payments

Methods: `CASH`, `CARD`, `OTHER`  
Cash flow: `amountReceived` → `changeMinor` validated server-side (`amountReceived >= total`)  
No card numbers, CVV, or gateway secrets stored.

---

## 8. Tax & Discounts

- Cart-level: `discountType` (PERCENT/FIXED), `discountValue`, `taxRateBps`
- Calculation: `subtotal - discount + tax = total`
- Not hardcoded to any country — configurable per cart

---

## 9. Void

- `voidPosOrder()` — requires `pos.void` permission
- Sets order `CANCELLED`, restocks inventory (`RETURN` movement)
- Reverses session cash/total counters
- Records `cancelledAt`, `cancelledById`, `cancelReason`

---

## 10. Permissions

| Permission | Roles (default) |
|------------|-------------------|
| `pos.read` | MANAGER, STAFF |
| `pos.sell` | MANAGER, STAFF |
| `pos.manage_sessions` | MANAGER |
| `pos.void` | MANAGER, OWNER, ADMIN |
| `pos.refund` | MANAGER |
| `orders.read` | MANAGER, STAFF |
| `payments.read` / `payments.write` | MANAGER, STAFF |

All enforced server-side via `requireTenantContext(permission)`.

---

## 11. RLS

`prisma/migrations/rls_phase4_policies.sql` — org isolation on registers, sessions, carts, orders, payments, events.

---

## 12. Routes

### UI
| Route | Description |
|-------|-------------|
| `/app/pos` | POS workspace (permission: `pos.sell`) |
| `/app/orders` | Sales history list |
| `/app/orders/[id]` | Order detail + void |

### API
| Method | Route | Permission |
|--------|-------|------------|
| GET | `/api/pos/registers` | pos.read |
| GET/POST | `/api/pos/sessions` | pos.read / pos.manage_sessions |
| GET | `/api/pos/products?q=` | pos.read |
| GET/POST | `/api/pos/carts` | pos.read / pos.sell |
| GET/POST | `/api/pos` | pos.read / pos.sell (alternate consolidated API) |
| GET | `/api/orders` | orders.read |
| GET/POST | `/api/orders/[id]` | orders.read / pos.void (void) |
| GET/POST | `/api/customers` | customers.read / customers.write |

---

## 13. Services

| File | Functions |
|------|-----------|
| `pos-service.ts` | `openPosSession`, `closePosSession`, `getOrCreateActiveCart`, `searchPosProducts`, `addToCart`, `updateCartItem`, `applyCartDiscount`, `setCartTaxRate`, `holdCart`, `resumeHeldCart`, `checkout`, `voidPosOrder` |
| `order-service.ts` | `listOrders`, `getOrderDetail`, `calculateOrderTotals`, `generateOrderNumber`, `cancelOrder` |
| `payment-service.ts` | `createPayment`, `createRefund` |
| `customer-service.ts` | `listCustomers`, `createCustomer`, `getOrCreateWalkInCustomer` |
| `inventory-service.ts` | `adjustStockInTx` (exported for transactional use) |

---

## 14. Events (placeholder)

Prepared event types in `order-events.ts` and `catalog-events.ts`:
- `pos.session.opened`, `pos.session.closed`
- `order.created`, `order.completed`, `order.cancelled`
- `payment.created`, `inventory.decremented` (via stock movement)

Console-logged in development; no event bus yet.

---

## 15. Reference Repositories

| Repo | Concepts studied |
|------|------------------|
| **spree-main** | Cart, line items, order states, adjustments, idempotency |
| **Nexus-ERP-main** | Multi-tenant sales, audit trail |
| **caratflow-main** | Transaction boundaries, money handling |
| **genix / multi-agent-business-os** | Event naming for future AI (not implemented) |

---

## 16. Tests

```bash
npm run build          # ✓ passes
npm run test:phase3    # API smoke (requires dev server for full run)
```

### Manual verification checklist
1. Login → open register → search → add → pay cash → receipt
2. Inventory decrements correctly
3. Oversell rejected (`INSUFFICIENT_STOCK`)
4. Double Pay creates one order only
5. Hold → resume → complete
6. Void restores stock (MANAGER+)
7. Org A cannot see Org B orders
8. STAFF cannot void

---

## 17. Known Limitations

- No real payment gateway integration
- No split-payment UI (architecture supports multiple payments)
- No full refunds UI (schema ready)
- No thermal/PDF/email receipts (receipt modal only)
- No camera barcode scanning (keyboard scanner supported)
- Lint: `next lint` prompts for ESLint setup (pre-existing)
- Integration tests require running PostgreSQL + dev server

---

## 18. Recommended Phase 4

- Online store checkout (reuse order/payment domain)
- Full refunds + partial refunds UI
- Promotions engine
- Customer CRM expansion
- Receipt print/PDF/email
- POS analytics dashboard (sales by branch, cashier, payment method)
- Event bus (BullMQ/Redis) for automations
