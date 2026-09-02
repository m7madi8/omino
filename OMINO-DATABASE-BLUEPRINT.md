# OMINO — Database Blueprint

**Date:** 2026-09-01  
**Status:** Conceptual design — no migrations in this phase  
**ORM:** Prisma 6 with split schema files (pattern: `caratflow-main/packages/db/prisma/schema/`)

---

## 1. Design Principles

| Principle | Rule |
|-----------|------|
| Tenancy | `organizationId` on every tenant-scoped table |
| Keys | UUID primary keys; prefixed public IDs for APIs (`ord_`, `prod_`) |
| Money | Integer minor units (cents/fils) — never float |
| Soft delete | `deletedAt` on user-facing entities |
| Extensibility | `metadata JSONB` on Product, Customer, Order (Spree pattern) |
| Audit | Immutable `audit_logs` — no updates, no deletes |
| Isolation | Row-level security enforced in application layer + optional Postgres RLS |

---

## 2. Tenancy Hierarchy

```
User
  └── Membership (user ↔ organization + role)
        └── Organization
              └── Store
                    └── Branch
                          └── Employee (membership scoped to branch)
```

---

## 3. Entity Catalog

### 3.1 Core & Identity

#### `organizations`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID PK | |
| name | String | Business legal/display name |
| slug | String UNIQUE | URL-safe identifier |
| country | String | ISO 3166-1 alpha-2 |
| currency | String | ISO 4217 (e.g. ILS, USD) |
| timezone | String | IANA |
| businessType | Enum | retail, restaurant, services, other |
| foundingPlan | Enum? | starter, pro, business — locked at signup |
| planLockedUntil | DateTime? | Founding price lock |
| foundingNumber | Int? | 1–50 for founding cohort |
| status | Enum | active, suspended, cancelled |
| metadata | JSONB | |
| createdAt, updatedAt | DateTime | |

**Relationships:** has many Stores, Memberships, Roles  
**Ownership:** Platform-level; no `organizationId` (is the tenant root)  
**Security:** Only members can read; only Owner/Admin can update

---

#### `users`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID PK | |
| email | String UNIQUE | |
| passwordHash | String | bcrypt/argon2 |
| fullname | String | |
| phone | String? | |
| locale | Enum | en, ar |
| emailVerifiedAt | DateTime? | |
| createdAt, updatedAt | DateTime | |

**Relationships:** has many Memberships, Sessions, AuditLogs  
**Ownership:** Global — not tenant-scoped  
**Security:** User can read/update own record only

---

#### `memberships`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID PK | |
| userId | UUID FK → users | |
| organizationId | UUID FK → organizations | |
| roleId | UUID FK → roles | |
| status | Enum | invited, active, suspended |
| invitedAt, joinedAt | DateTime? | |

**Relationships:** belongs to User, Organization, Role  
**Ownership:** `organizationId`  
**Security:** Org admins manage; users see own memberships

---

#### `roles`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID PK | |
| organizationId | UUID FK | |
| name | String | Owner, Admin, Manager, Cashier, Viewer |
| isSystem | Boolean | Cannot delete system roles |
| description | String? | |

**Relationships:** has many RolePermissions, Memberships  
**Ownership:** `organizationId`  
**Security:** Owner/Admin only

---

#### `permissions`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID PK | |
| module | String | orders, pos, inventory, ai, … |
| action | String | read, write, approve, delete |
| description | String? | |

**Relationships:** global seed table; linked via role_permissions  
**Ownership:** Platform (not tenant-scoped)  
**Security:** Read-only for app; managed by migrations/seeds

---

#### `role_permissions`

| Field | Type | Notes |
|-------|------|-------|
| roleId | UUID FK | |
| permissionId | UUID FK | |

**Ownership:** Derived from role's `organizationId`

---

#### `sessions`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID PK | |
| userId | UUID FK | |
| refreshTokenHash | String | |
| userAgent | String? | |
| ipAddress | String? | |
| expiresAt | DateTime | |
| revokedAt | DateTime? | |

**Ownership:** User-scoped  
**Security:** Server-only; never exposed to client except httpOnly cookie

---

#### `audit_logs`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID PK | |
| organizationId | UUID FK | |
| userId | UUID FK? | Null for system actions |
| action | String | e.g. `order.created`, `ai.tool.approved` |
| entityType | String? | Order, Product, … |
| entityId | UUID? | |
| metadata | JSONB | Before/after snapshots |
| ipAddress | String? | |
| createdAt | DateTime | Immutable |

**Ownership:** `organizationId`  
**Security:** Append-only; Admin/Owner read; 90-day retention policy (configurable)

**Reference:** Nexus `AuditLog`, CaratFlow `AuditLog`

---

### 3.2 Stores & Branches

#### `stores`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID PK | |
| organizationId | UUID FK | |
| name | String | |
| slug | String | Unique per org |
| currency | String | Override org default |
| timezone | String | |
| storefrontEnabled | Boolean | |
| posEnabled | Boolean | |
| createdAt, updatedAt | DateTime | |

**Relationships:** has many Branches, Products, Orders  
**Ownership:** `organizationId`

---

#### `branches`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID PK | |
| storeId | UUID FK | |
| organizationId | UUID FK | Denormalized for query efficiency |
| name | String | |
| address | JSONB | street, city, country, postal |
| phone | String? | |
| isDefault | Boolean | |
| status | Enum | active, closed |

**Relationships:** has many Warehouses, Employees  
**Ownership:** `organizationId` via store

---

#### `employees`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID PK | |
| membershipId | UUID FK | Links to user+org |
| branchId | UUID FK? | Null = all branches |
| organizationId | UUID FK | |
| employeeNumber | String? | |
| pin | String? | Hashed — for POS quick login |
| status | Enum | active, inactive |

**Ownership:** `organizationId`  
**Security:** Manager+ can manage; Cashier cannot see other employees' pins

---

### 3.3 Catalog

#### `products`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID PK | |
| organizationId | UUID FK | |
| storeId | UUID FK | |
| name | String | |
| description | Text? | |
| status | Enum | draft, active, archived |
| metadata | JSONB | |
| createdAt, updatedAt, deletedAt | DateTime | |

**Reference:** Spree `product.rb`

---

#### `product_variants`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID PK | |
| productId | UUID FK | |
| organizationId | UUID FK | |
| sku | String | Unique per org |
| barcode | String? | |
| name | String? | Override product name |
| trackInventory | Boolean | |
| weight | Int? | Grams |
| position | Int | Display order |
| metadata | JSONB | |

**Reference:** Spree `variant.rb`

---

#### `categories`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID PK | |
| storeId | UUID FK | |
| organizationId | UUID FK | |
| parentId | UUID FK? | Nested categories |
| name | String | |
| position | Int | |

---

#### `product_categories`

| productId | UUID FK |
| categoryId | UUID FK |

Join table.

---

#### `prices`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID PK | |
| variantId | UUID FK | |
| organizationId | UUID FK | |
| amount | Int | Minor units |
| currency | String | |
| priceListId | UUID FK? | Null = default |
| compareAtAmount | Int? | "Was" price |

**Reference:** Spree `price.rb`

---

### 3.4 Inventory

#### `warehouses`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID PK | |
| branchId | UUID FK | |
| organizationId | UUID FK | |
| name | String | |
| isDefault | Boolean | |

---

#### `inventory` (stock levels)

| Field | Type | Notes |
|-------|------|-------|
| id | UUID PK | |
| variantId | UUID FK | |
| warehouseId | UUID FK | |
| organizationId | UUID FK | |
| quantityOnHand | Int | |
| quantityReserved | Int | For pending orders |
| reorderPoint | Int? | Low-stock alert threshold |
| updatedAt | DateTime | |

**Unique:** `(variantId, warehouseId)`

**Reference:** Spree `stock_level.rb`

---

#### `inventory_movements`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID PK | |
| variantId | UUID FK | |
| warehouseId | UUID FK | |
| organizationId | UUID FK | |
| quantity | Int | Positive = in, negative = out |
| reason | Enum | sale, return, adjustment, transfer, receive |
| referenceType | String? | Order, Transfer, … |
| referenceId | UUID? | |
| notes | String? | |
| userId | UUID FK? | Who performed |
| createdAt | DateTime | Immutable |

**Reference:** Spree `stock_movement.rb`, CaratFlow `StockMovement`

---

### 3.5 Commerce

#### `customers`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID PK | |
| organizationId | UUID FK | |
| name | String | |
| email | String? | |
| phone | String? | |
| whatsapp | String? | MENA-first |
| metadata | JSONB | |
| totalSpent | Int | Denormalized |
| orderCount | Int | Denormalized |
| createdAt, updatedAt, deletedAt | DateTime | |

**Reference:** Spree `customer.rb`, Nexus `Customer`

---

#### `customer_segments`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID PK | |
| organizationId | UUID FK | |
| name | String | |
| rules | JSONB | Filter criteria |
| customerCount | Int | Cached |

---

#### `carts`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID PK | |
| organizationId | UUID FK | |
| storeId | UUID FK | |
| customerId | UUID FK? | |
| channel | Enum | web, pos |
| status | Enum | active, abandoned, completed |
| currency | String | |
| subtotalAmount | Int | |
| taxAmount | Int | |
| totalAmount | Int | |
| expiresAt | DateTime? | |
| metadata | JSONB | |

**Reference:** Spree `cart.rb` — mutable until checkout complete

---

#### `cart_items`

| cartId | UUID FK |
| variantId | UUID FK |
| quantity | Int |
| unitPrice | Int | Snapshotted at add time |
| organizationId | UUID FK |

---

#### `orders`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID PK | |
| publicId | String | `ord_xxx` |
| organizationId | UUID FK | |
| storeId | UUID FK | |
| branchId | UUID FK? | POS origin |
| customerId | UUID FK? | |
| cartId | UUID FK? | Source cart |
| channel | Enum | web, pos |
| status | Enum | placed, fulfilled, cancelled, returned |
| currency | String | |
| subtotalAmount | Int | Immutable after placement |
| taxAmount | Int | |
| discountAmount | Int | |
| totalAmount | Int | |
| placedAt | DateTime | |
| metadata | JSONB | |

**Reference:** Spree `order.rb` — immutable after placement

---

#### `order_items`

| orderId | UUID FK |
| variantId | UUID FK |
| sku | String | Snapshotted |
| name | String | Snapshotted |
| quantity | Int |
| unitPrice | Int |
| totalPrice | Int |
| organizationId | UUID FK |

---

### 3.6 Payments

#### `payments`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID PK | |
| organizationId | UUID FK | |
| orderId | UUID FK? | |
| cartId | UUID FK? | Pre-completion |
| amount | Int | |
| currency | String | |
| status | Enum | pending, completed, failed, refunded |
| provider | String | stripe, cash, manual |
| providerRef | String? | External ID |
| metadata | JSONB | |

**Reference:** Spree `payment.rb`

---

#### `transactions`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID PK | |
| organizationId | UUID FK | |
| paymentId | UUID FK? | |
| type | Enum | charge, refund, fee, payout |
| amount | Int | |
| currency | String | |
| description | String? | |
| createdAt | DateTime | |

Ledger entries for reconciliation.

---

#### `payment_methods`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID PK | |
| organizationId | UUID FK | |
| type | Enum | card, cash, bank_transfer |
| name | String | Display name |
| config | JSONB | Encrypted provider credentials |
| isDefault | Boolean | |
| status | Enum | active, inactive |

---

### 3.7 Promotions

#### `discounts`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID PK | |
| organizationId | UUID FK | |
| name | String | |
| type | Enum | percentage, fixed |
| value | Int | |
| appliesTo | Enum | order, product, category |

---

#### `promotions`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID PK | |
| organizationId | UUID FK | |
| storeId | UUID FK | |
| name | String | |
| rules | JSONB | Conditions |
| actions | JSONB | Effects |
| startsAt, endsAt | DateTime? | |
| status | Enum | draft, active, expired |

**Reference:** Spree `promotion.rb`

---

#### `coupons`

| code | String UNIQUE per org |
| promotionId | UUID FK |
| usageLimit | Int? |
| usageCount | Int |
| organizationId | UUID FK |

---

### 3.8 Notifications

#### `notifications`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID PK | |
| organizationId | UUID FK | |
| userId | UUID FK | |
| type | String | low_stock, order_placed, ai_approval |
| title | String | |
| body | String | |
| readAt | DateTime? | |
| metadata | JSONB | |
| createdAt | DateTime | |

---

### 3.9 AI

#### `ai_agents`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID PK | |
| slug | String | sales, inventory, crm, general |
| name | String | |
| description | Text | |
| systemPrompt | Text | |
| isActive | Boolean | Platform-level config |

Agent definitions — not per-tenant.

---

#### `ai_tools`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID PK | |
| slug | String | query_sales, stock_alert |
| name | String | |
| description | Text | For LLM tool selection |
| apiEndpoint | String | REST path |
| httpMethod | String | GET, POST |
| requiresApproval | Boolean | True for writes |
| permissionRequired | String? | e.g. `orders:write` |

Platform-level tool registry.

---

#### `ai_tasks` (approval queue)

| Field | Type | Notes |
|-------|------|-------|
| id | UUID PK | |
| organizationId | UUID FK | |
| userId | UUID FK | Requesting user |
| agentSlug | String | |
| toolSlug | String | |
| status | Enum | proposed, approved, rejected, executed, failed |
| input | JSONB | Tool arguments |
| output | JSONB? | Result |
| approvedBy | UUID FK? | |
| approvedAt | DateTime? | |
| executedAt | DateTime? | |
| createdAt | DateTime | |

---

#### `ai_runs` (conversation sessions)

| Field | Type | Notes |
|-------|------|-------|
| id | UUID PK | |
| organizationId | UUID FK | |
| userId | UUID FK | |
| agentSlug | String | |
| status | Enum | active, completed |
| context | JSONB | Page route, selected entity |
| createdAt, updatedAt | DateTime | |

---

#### `ai_messages`

| runId | UUID FK |
| role | Enum | user, assistant, system, tool |
| content | Text | |
| toolCalls | JSONB? | |
| tokensUsed | Int? | |
| createdAt | DateTime |

---

### 3.10 Automation & Workflows

#### `workflows`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID PK | |
| organizationId | UUID FK | |
| type | String | refund_approval, po_approval |
| name | String | |
| steps | JSONB | Step definitions |
| isActive | Boolean | |

---

#### `workflow_runs`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID PK | |
| workflowId | UUID FK | |
| organizationId | UUID FK | |
| status | Enum | pending, in_progress, completed, rejected |
| currentStep | Int | |
| context | JSONB | Entity refs, approver chain |
| startedAt, completedAt | DateTime? | |

---

#### `automation_rules`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID PK | |
| organizationId | UUID FK | |
| name | String | |
| trigger | String | sale.completed, stock.below_threshold |
| conditions | JSONB | |
| actions | JSONB | send_notification, create_task |
| isActive | Boolean | |
| lastTriggeredAt | DateTime? | |

---

## 4. Prisma Schema File Split

```
packages/db/prisma/schema/
├── core.prisma          # organizations, users, memberships, roles, permissions, audit_logs
├── stores.prisma        # stores, branches, employees
├── catalog.prisma       # products, variants, categories, prices
├── inventory.prisma     # warehouses, inventory, inventory_movements
├── commerce.prisma      # customers, carts, orders
├── payments.prisma      # payments, transactions, payment_methods
├── promotions.prisma    # discounts, promotions, coupons
├── notifications.prisma # notifications
├── ai.prisma            # ai_agents, ai_tools, ai_tasks, ai_runs, ai_messages
└── automation.prisma    # workflows, workflow_runs, automation_rules
```

---

## 5. Row-Level Security Requirements

| Requirement | Implementation |
|-------------|----------------|
| Tenant isolation | Every query includes `WHERE organizationId = :jwtOrgId` |
| Cross-tenant reads | Impossible — middleware rejects mismatched JWT |
| Cross-tenant writes | Impossible — `organizationId` set server-side from JWT |
| Branch scoping | Cashier role filtered to assigned `branchId` |
| AI tool scope | Tools receive `organizationId` from run context, not LLM |
| Audit immutability | No UPDATE/DELETE on `audit_logs` |
| Payment config | `payment_methods.config` encrypted at rest |

**Optional Postgres RLS (Phase 14):** Policy per table: `organization_id = current_setting('app.organization_id')::uuid`

---

## 6. Index Strategy

| Table | Index |
|-------|-------|
| All tenant tables | `(organizationId)` |
| orders | `(organizationId, placedAt DESC)` |
| products | `(organizationId, storeId, status)` |
| product_variants | `(organizationId, sku)` UNIQUE |
| inventory | `(variantId, warehouseId)` UNIQUE |
| inventory_movements | `(organizationId, createdAt DESC)` |
| customers | `(organizationId, email)`, `(organizationId, phone)` |
| audit_logs | `(organizationId, createdAt DESC)` |
| ai_tasks | `(organizationId, status)` |

---

## 7. Migration Order (Future)

1. core (organizations, users, roles)
2. stores (stores, branches)
3. catalog (products, variants)
4. inventory
5. commerce (customers, carts, orders)
6. payments
7. promotions
8. notifications, audit_logs
9. ai
10. automation

---

*See also: `OMINO-TARGET-ARCHITECTURE.md` §6 Multi-Tenancy, `OMINO-AI-ARCHITECTURE.md`*
