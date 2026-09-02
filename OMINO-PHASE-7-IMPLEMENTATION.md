# OMINO — Phase 7 Implementation

**Date:** 2026-09-01  
**Scope:** Analytics + Business Intelligence Engine  
**Status:** Implemented — no new database tables; requires existing Phase 1–6 schema

---

## 1. Architecture

ONE centralized analytics layer serves POS, Online Store, Orders, Payments, Products, Inventory, and Customers.

```
Raw commerce data (orders, items, payments, customers, inventory)
        ↓
Analytics query builders (tenant-scoped filters)
        ↓
Metric services (sales, products, customers, inventory, channels)
        ↓
Aggregations + time series + comparisons
        ↓
Dashboard (/app) + Analytics workspace (/app/analytics)
        ↓
AI context snapshot (GET /api/analytics?view=context)
```

**Not built:** separate POS/store/customer analytics engines, BI warehouse, predictive AI.

---

## 2. Database Changes

**None.** Phase 7 reads from existing tables:

| Table | Analytics use |
|-------|----------------|
| `orders` | Revenue, order counts, channel (`source`), status |
| `order_items` | Product revenue/units (snapshot fields) |
| `payments` / `refunds` | Foundation for future payment analytics |
| `customers` | New/returning customer counts |
| `stock_levels` / `stock_movements` | Low stock, movements |

Historical immutability: product analytics use `order_items.product_name`, `sku`, `total_minor` — not live product prices.

---

## 3. Metric Definitions

### Sales (completed orders in date range)

| Metric | Definition |
|--------|------------|
| Gross sales | Sum of `totalMinor` on `COMPLETED` orders |
| Discounts | Sum of `discountAmount` on completed orders |
| Taxes | Sum of `taxAmount` |
| Fees | Sum of `feesAmount` |
| Shipping | Sum of `shippingAmount` |
| Refunds | Sum of `refundedMinor` on completed orders |
| Net sales | `grossSales − refunds` (minor units, integer math) |
| AOV | `grossSales / completedOrders` (rounded) |
| Item count | Sum of line item quantities |

**Date filter:** `COALESCE(completedAt, createdAt)` within range.

### Orders

| Metric | Definition |
|--------|------------|
| Order count | All orders in range (any status) |
| Completed | `status = COMPLETED` |
| Pending | DRAFT, PENDING, CONFIRMED, PROCESSING |
| Cancelled | `status = CANCELLED` |

### Customers

| Metric | Definition |
|--------|------------|
| Total customers | Active non-walk-in customers in org |
| New customers | `createdAt` in range |
| Returning | Had completed order before range start, ordered again in range |
| Repeat rate | `returning / customersWithOrdersInRange` |

### Products

Top products ranked by revenue or units from `order_items` joined to completed orders. Uses snapshot fields.

### Inventory

| Metric | Definition |
|--------|------------|
| Low stock | `available ≤ threshold` (variant or level threshold) |
| Out of stock | `available ≤ 0` |
| Movements | `stock_movements` count in date range |

### Channels

Grouped by `order.source` (POS, ONLINE). Channel totals must reconcile to gross sales.

---

## 4. Services

| Service | File | Responsibilities |
|---------|------|------------------|
| Analytics (orchestrator) | `analytics/analytics-service.ts` | Overview, AI context, reconciliation |
| Sales | `analytics/sales-analytics-service.ts` | Sales metrics, channels, time series |
| Products | `analytics/product-analytics-service.ts` | Top products SQL aggregation |
| Customers | `analytics/customer-analytics-service.ts` | New/returning/repeat rate |
| Inventory | `analytics/inventory-analytics-service.ts` | Alerts, movement counts |
| Signals | `analytics/business-signals-service.ts` | Rule-based business signals |
| Query builders | `analytics/analytics-query.ts` | Tenant-scoped Prisma where clauses |

### Utilities

| File | Purpose |
|------|---------|
| `src/lib/analytics/date-range.ts` | Presets, previous period, series granularity |
| `src/lib/analytics/metrics.ts` | Pure metric math, comparisons |
| `src/types/analytics.ts` | Shared analytics types |

### Legacy (AI tools compatibility)

`src/server/services/analytics-service.ts` — older summary helpers still used by AI tool handlers. New dashboards use the centralized `analytics/` services.

---

## 5. API Routes

| Method | Route | Permission | Notes |
|--------|-------|------------|-------|
| GET | `/api/analytics` | `analytics.read` | Returns `{ overview }` |
| GET | `/api/analytics?preset=last_7_days` | `analytics.read` | Date preset |
| GET | `/api/analytics?view=context` | `analytics.read` | AI-safe `BusinessContextSnapshot` |
| GET | `/api/analytics?storeId=&branchId=&channel=` | `analytics.read` | Optional filters |

Query params: `preset`, `from`, `to`, `storeId`, `branchId`, `channel`.

---

## 6. UI

### `/app` — Business Overview

Server-rendered summary for users with `analytics.read`:

- KPI cards: Revenue, Orders, AOV, New customers (with period comparison)
- Revenue + orders trend charts
- Top products, inventory alerts, customer insights
- Business signals + recent orders
- Empty state when no sales data

### `/app/analytics` — Analytics Workspace

Full analytics workspace with date preset picker, refresh, sales detail KPIs, charts, channels, customers, inventory, top products, signals, recent orders.

### Components

| Component | File |
|-----------|------|
| Overview dashboard | `components/analytics/overview-dashboard.tsx` |
| Analytics workspace | `components/analytics/analytics-workspace.tsx` |
| KPI card | `components/analytics/kpi-card.tsx` |
| Line chart (SVG) | `components/analytics/simple-line-chart.tsx` |

---

## 7. Date Ranges

Presets: `today`, `yesterday`, `last_7_days`, `last_30_days`, `this_month`, `last_month`, `this_year`, `custom`.

Each preset computes a **previous period** of equal duration for comparison percentages.

Time series granularity adapts to range:

| Range | Granularity |
|-------|-------------|
| ≤ 2 days | hourly |
| ≤ 60 days | daily |
| ≤ 180 days | weekly |
| > 180 days | monthly |

---

## 8. Business Signals

Rule-based, deterministic signals (not AI-generated):

| Type | Example |
|------|---------|
| `REVENUE_GROWTH` | Sales up ≥5% vs prior period |
| `REVENUE_DECLINE` | Sales down ≥5% |
| `LOW_STOCK` | Products below threshold / out of stock |
| `HIGH_REFUNDS` | Refund rate ≥5% of gross |
| `TOP_PRODUCT` | Single product ≥20% of revenue |
| `CUSTOMER_GROWTH` | New customers acquired |
| `CHANNEL_GROWTH` | Online outpacing POS |
| `NO_DATA` | Empty state guidance |

Severity: `INFO`, `WARNING`, `CRITICAL`.

---

## 9. AI Context Layer

`getBusinessContextSnapshot()` returns structured data for future OMINO AI:

```json
{
  "generatedAt": "...",
  "organizationId": "...",
  "currency": "USD",
  "period": { "from", "to", "label" },
  "overview": { "revenue", "orders", "customers", "channels", "inventory" },
  "trends": { "revenueSeries", "ordersSeries" },
  "topProducts": [...],
  "signals": [...]
}
```

Future AI must consume `AnalyticsService` / `BusinessContextService` — not raw SQL.

---

## 10. Permissions

Uses existing `analytics.read` (MANAGER+). STAFF without permission see overview message, redirected from `/app/analytics`.

`analytics.manage` not added — export/advanced config deferred.

---

## 11. Reconciliation

`reconcileSalesMetrics()` validates:

- Dashboard gross = sum of completed order `totalMinor`
- Refunds = sum of `refundedMinor`
- POS + ONLINE channel totals = gross

---

## 12. Tests

```bash
npm run test:phase7
```

**Unit tests (no DB):** metric math, date ranges, comparisons, aggregation.

**Integration tests (requires DATABASE_URL):** POS checkout → sales metrics, channel reconciliation, top products, tenant isolation, inventory alerts.

---

## 13. Build Verification

```bash
npm run build
```

Verified: `/app`, `/app/analytics`, `/api/analytics` compile and build successfully.

---

## 14. Known Limitations

- No query result caching (deferred; tenant-safe caching strategy documented for Phase 8+)
- No CSV/PDF export endpoint yet (architecture ready via same services)
- Legacy `analytics-service.ts` still used by AI tool handlers — migrate in Phase 8
- Product profit/margin, inventory valuation, turnover ratios — foundation only
- Marketplace/API/Social channel analytics — architecture via `order.source`, not implemented
- `analytics.manage` permission not added
- Integration tests require live database credentials

---

## 15. Readiness for Phase 8

Phase 7 delivers:

- Centralized metric services with consistent definitions
- Tenant-isolated analytics API
- Business overview + analytics workspace UI
- AI context snapshot endpoint
- Rule-based business signals
- Reconciliation helpers
- Financial precision via minor units

**Ready for Phase 8 — OMINO AI Core + AI Agents**, which should consume `getBusinessContextSnapshot()` and centralized analytics services instead of duplicating queries.

---

## 16. Files Created / Modified

### Created
- `src/types/analytics.ts`
- `src/lib/analytics/date-range.ts`
- `src/lib/analytics/metrics.ts`
- `src/server/services/analytics/analytics-service.ts`
- `src/server/services/analytics/analytics-query.ts`
- `src/server/services/analytics/sales-analytics-service.ts`
- `src/server/services/analytics/product-analytics-service.ts`
- `src/server/services/analytics/customer-analytics-service.ts`
- `src/server/services/analytics/inventory-analytics-service.ts`
- `src/server/services/analytics/business-signals-service.ts`
- `src/app/api/analytics/route.ts`
- `src/components/analytics/kpi-card.tsx`
- `src/components/analytics/simple-line-chart.tsx`
- `src/components/analytics/overview-dashboard.tsx`
- `src/components/analytics/analytics-workspace.tsx`
- `scripts/test-phase7.ts`
- `OMINO-PHASE-7-IMPLEMENTATION.md`

### Modified
- `src/app/app/page.tsx` — real business overview
- `src/app/app/analytics/page.tsx` — analytics workspace
- `package.json` — `test:phase7` script
- `OMINO-CODE-EXTRACTION-LOG.md` — Phase 7 entries
- Minor build fixes in AI layer files (pre-existing type errors)
