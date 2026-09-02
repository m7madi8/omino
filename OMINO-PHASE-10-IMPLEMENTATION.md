# OMINO — Phase 10 Implementation

**Date:** 2026-09-01  
**Scope:** Marketing Engine  
**Status:** Implemented

---

## 1. Marketing Architecture

Native marketing domain integrated with Customers, Orders, Analytics, Automations, and Online Store.

```
Customers → Audiences (segments) → Campaigns → Promotions/Coupons
       ↓              ↓                ↓              ↓
   CRM data    Segment rules    Tracking code    Cart/Checkout
       ↓              ↓                ↓              ↓
              Automation events → Orders → Attribution → Analytics → AI
```

**Not built:** Email/WhatsApp/SMS providers, ads integrations, predictive marketing, autonomous AI campaigns.

---

## 2. Database Changes

### New tables

| Table | Purpose |
|-------|---------|
| `marketing_audiences` | Segment definitions with JSON rules |
| `marketing_promotions` | Discount rules (%, fixed, restrictions) |
| `marketing_coupons` | Coupon codes linked to promotions |
| `marketing_campaigns` | Campaign lifecycle, audience, promotion, tracking |
| `marketing_campaign_events` | Campaign activity log |
| `marketing_conversions` | Last-touch attribution (campaign → order) |
| `marketing_promotion_redemptions` | Promotion usage ledger |

### Extended tables

| Table | Fields added |
|-------|--------------|
| `carts` | `promotion_id`, `campaign_id` (coupon_code existed) |
| `orders` | `coupon_code`, `promotion_id`, `campaign_id` (snapshots) |

### Enums

- `MarketingCampaignStatus`: DRAFT, SCHEDULED, ACTIVE, PAUSED, COMPLETED, ARCHIVED
- `MarketingPromotionStatus`: DRAFT, ACTIVE, PAUSED, EXPIRED, ARCHIVED
- `MarketingChannel`: IN_APP, STORE, EMAIL, WHATSAPP, SMS, PUSH, SOCIAL (future channels reserved)

---

## 3. Metric & Promotion Definitions

### Promotions

- **PERCENT**: `discountValue` in basis points (1000 = 10%)
- **FIXED**: `discountValue` in minor units
- **Net discount**: via existing `calculateCartTotals` / `calculateOrderTotals`
- Restrictions: min order, product IDs, category IDs, customer tags, audience, usage limits

### Campaign attribution

- **Model**: Last marketing touch (campaign on cart/order)
- **Revenue**: `order.totalMinor` at conversion time
- **Conversion**: one per order (unique `order_id`)

---

## 4. Services

| Service | File |
|---------|------|
| Audience | `audience-service.ts` |
| Promotion/Coupon | `promotion-service.ts` |
| Campaign | `campaign-service.ts` |
| Attribution | `attribution-service.ts` |
| Marketing analytics | `marketing-analytics-service.ts` |
| Segment rules | `lib/marketing/segment-rules.ts` |
| Templates | `templates.ts` |
| Events | `events/marketing-events.ts` |

---

## 5. API Routes

| Route | Permission |
|-------|------------|
| `GET /api/marketing` | `marketing.read` |
| `GET/POST /api/marketing/campaigns` | read / `marketing.create_campaign` |
| `GET/PATCH /api/marketing/campaigns/[id]` | read / write + activate/pause |
| `GET/POST /api/marketing/audiences` | read / `marketing.manage_audiences` |
| `GET/PATCH /api/marketing/audiences/[id]` | read / manage |
| `GET/POST /api/marketing/promotions` | read / `marketing.manage_promotions` |
| `GET/PATCH /api/marketing/promotions/[id]` | read / manage |
| `POST /api/marketing/coupons/validate` | public (org-scoped body) |
| Storefront `POST cart action=coupon` | guest session |

---

## 6. UI Routes

| Route | Purpose |
|-------|---------|
| `/app/marketing` | Overview dashboard |
| `/app/marketing/campaigns` | Campaign list |
| `/app/marketing/campaigns/new` | Template picker |
| `/app/marketing/campaigns/[id]` | Campaign detail + activate/pause |
| `/app/marketing/audiences` | Audience list |
| `/app/marketing/audiences/new` | Segment builder |
| `/app/marketing/audiences/[id]` | Audience detail + count refresh |
| `/app/marketing/promotions` | Promotion list |
| `/app/marketing/promotions/new` | Promotion + coupon creator |
| `/app/marketing/promotions/[id]` | Promotion detail |

---

## 7. Segment Rules

Structured JSON `SegmentRuleGroup` with AND/OR logic.

Supported fields:

- Customer: `status`, `source`, `tagId`, `createdDaysAgo`, `country`
- Purchase: `completedOrders`, `totalSpendMinor`, `daysSinceLastOrder`, `orderSource`
- Product: `purchasedProductId`, `purchasedCategoryId`

Audience counts computed **server-side** via `countAudienceMembers()`.

---

## 8. Store Integration

- Online cart: apply/remove coupon via storefront API
- Checkout: snapshots `couponCode`, `promotionId`, `campaignId` on order
- Redemption recorded in `marketing_promotion_redemptions`
- Attribution recorded in `marketing_conversions`

---

## 9. Automation Integration

- Marketing events published via existing `publishBusinessEvent` (Phase 9 bus)
- Campaign scheduling via `processScheduledCampaigns()` hooked into `/api/automations/process` cron
- Campaigns can reference `automationId` for future workflow linkage

Event types: `campaign.created`, `campaign.started`, `campaign.paused`, `campaign.completed`, `campaign.clicked`, `campaign.converted`, `promotion.created`, `promotion.redeemed`, `campaign.audience_created`

---

## 10. AI Integration (Safe)

- AI-generated campaigns from templates always start as **DRAFT**
- Activation requires explicit user action (`marketing.activate_campaign`)
- No AI auto-send or auto-launch
- Marketing overview consumable by GROWTH agent via existing analytics tools

---

## 11. Permissions

```
marketing.read
marketing.write
marketing.create_campaign
marketing.activate_campaign
marketing.pause_campaign
marketing.manage_audiences
marketing.manage_promotions
marketing.view_analytics
marketing.export
```

MANAGER+ receives marketing permissions. STAFF does not.

---

## 12. Campaign Templates

- Win Back Customers
- VIP Customers
- New Customer Follow-up
- Product Promotion
- Slow-Moving Inventory (foundation)

All create **draft** campaigns only.

---

## 13. Tests

```bash
npm run test:phase10
```

Covers: coupon validation, audience creation, promotion creation, campaign DRAFT→ACTIVE, min order enforcement, server-side audience count.

---

## 14. Build Verification

```bash
npm run build   # ✓ passes
```

---

## 15. Known Limitations

- No external channel delivery (email/WhatsApp/SMS)
- POS coupon UI not yet added (service layer ready via `applyCouponToCart`)
- Campaign tracking via URL param (`?ref=TRACKING_CODE`) — cart assignment endpoint can be added
- No multi-touch attribution
- No predictive/churn marketing
- Export foundation prepared via permissions; CSV endpoint deferred
- Inventory-aware marketing templates are structural only (no auto product selection)
- RLS policies for marketing tables should be added in migration SQL on deploy

---

## 16. Readiness

Phase 10 delivers a real integrated Marketing Engine. Phase 11+ can add external channel providers, advanced segment builder UI, POS coupon UX, and AI marketing draft tools.

**Phase 11 NOT started.**
