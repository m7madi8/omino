# OMINO — AI Architecture

**Date:** 2026-09-01  
**Status:** Implemented in Phase 8 (`src/server/ai/`)  
**Product rule (from `main/OMINO_README.md`):** AI recommends → user approves → system executes. AI never acts without authorization.

---

## 1. Philosophy

OMINO AI is **not a chat page**. It is a core system that:

1. **Understands** business context (current page, org data, conversation history)
2. **Reasons** over live data (never hallucinates numbers)
3. **Uses tools** to read and propose actions via the same API as the UI
4. **Requests approval** before any write operation
5. **Executes** approved actions with full audit trail

```
                    OMINO AI
                       │
              Agent Orchestrator
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   Sales Agent   Inventory Agent   CRM Agent
        │              │              │
        └──────────────┼──────────────┘
                       │
                     Tools
                       │
        ┌──────────────┼──────────────┐
        │              │              │
      POS          Inventory       Orders
        │              │              │
        └──────────────┼──────────────┘
                       │
                  OMINO Database
                  (via REST API)
```

---

## 2. Reference Patterns Adopted

| Pattern | Source | OMINO adaptation |
|---------|--------|------------------|
| Discovery → execution two-call | genix `route_turn.go` | Planner classifies intent; executor uses tools |
| Supervisor multi-agent routing | multi-agent `multi_agent.py` | Orchestrator delegates to domain agents |
| Tool registry with permissions | genix `llm/prompts.go` | Typed tools bound to REST API + RBAC |
| Approval gate on mutations | OMINO_README + genix `MutationRoutes` | `ai_tasks` table with propose→approve→execute |
| Workspace-scoped RAG | multi-agent `services/rag/` | Per-organization vector index |
| Action summary persistence | genix `finish.summary` | Prevents re-doing completed actions |
| SSE streaming | multi-agent `chat.py`, genix `ws.go` | Real-time status in `/app/ai` panel |
| Provider abstraction | multi-agent `services/llm.py` | OpenAI / Anthropic / local switch |
| Event-driven side effects | CaratFlow event bus | `ai.insight.generated` → notification |

**Not adopted:** genix GPL code, UI-only automation without API tools, multi-agent's lack of approval gates.

---

## 3. System Components

### 3.1 Agent Orchestrator

**Location:** `src/server/ai/orchestrator.ts`

**Responsibilities:**
- Receive user message + surface context
- Run discovery/planner (intent classification)
- Route to appropriate domain agent
- Manage tool-calling loop with iteration caps
- Enforce approval gates on write tools
- Persist conversation and tool runs

**Flow:**
```
User message
  → Discovery Planner (LLM #1, fast/cheap model)
      → Intent: query | recommend | action | explain
      → Domain: sales | inventory | crm | general
      → Required tools: [query_sales, ...]
  → Domain Agent (LLM #2, user-selected or default model)
      → Tool loop (max 8 iterations)
      → If write tool → create ai_task (proposed) → await approval
      → finish(message, summary)
  → SSE stream to client
```

**Reference files:**
- `omino/genix-main/backend/agent/route_turn.go`
- `omino/genix-main/backend/agent/discovery/planner.go`
- `omino/multi-agent-business-os-main/backend/app/agents/multi_agent.py`

---

### 3.2 Domain Agents

| Agent | Slug | Scope | Example capabilities |
|-------|------|-------|---------------------|
| Sales Agent | `sales` | Orders, revenue, trends | "How did we do this week?", "Top products" |
| Inventory Agent | `inventory` | Stock, alerts, movements | "What's low?", "Reorder suggestion" |
| CRM Agent | `crm` | Customers, segments | "Who hasn't ordered in 30 days?" |
| General Agent | `general` | Cross-domain, onboarding help | "How do I add a product?" |

Each agent has:
- System prompt (EN + AR variants)
- Allowed tool subset
- Permission requirements

**Future agents:** Marketing, Finance, POS Assistant

---

### 3.3 Tool Registry

**Location:** `src/server/ai/tools/registry.ts`

Tools are **wrappers around OMINO REST API** — same endpoints the UI uses.

#### Read tools (no approval)

| Tool slug | API endpoint | Permission |
|-----------|--------------|------------|
| `query_sales` | `GET /api/v1/admin/analytics/sales` | `analytics:read` |
| `query_inventory` | `GET /api/v1/admin/inventory` | `inventory:read` |
| `query_orders` | `GET /api/v1/admin/orders` | `orders:read` |
| `query_customers` | `GET /api/v1/admin/customers` | `crm:read` |
| `query_product` | `GET /api/v1/admin/products/:id` | `products:read` |
| `search_knowledge` | RAG endpoint | `ai:read` |

#### Write tools (approval required)

| Tool slug | API endpoint | Permission |
|-----------|--------------|------------|
| `create_product` | `POST /api/v1/admin/products` | `products:write` |
| `adjust_stock` | `POST /api/v1/admin/inventory/adjust` | `inventory:write` |
| `create_order` | `POST /api/v1/admin/orders` | `orders:write` |
| `send_customer_message` | `POST /api/v1/admin/customers/:id/message` | `crm:write` |
| `apply_discount` | `POST /api/v1/admin/orders/:id/discount` | `orders:approve` |

**Tool schema (for LLM):**
```typescript
{
  name: "query_sales",
  description: "Get sales summary for a date range. Returns revenue, order count, top products.",
  parameters: {
    type: "object",
    properties: {
      startDate: { type: "string", format: "date" },
      endDate: { type: "string", format: "date" },
      storeId: { type: "string", format: "uuid" }
    },
    required: ["startDate", "endDate"]
  }
}
```

**Reference:** Spree prefixed IDs (`ord_`, `prod_`) for agent-friendly responses

---

## 4. Context & Memory

### 4.1 Surface context (per turn)

Sent from `/app` frontend with every message:

```typescript
interface SurfaceContext {
  route: string;           // e.g. "/app/orders/ord_abc123"
  module: string;          // orders, products, pos
  selectedEntityId?: string;
  selectedEntityType?: string;
  locale: "en" | "ar";
}
```

**Reference:** genix `frontend/core/agent/agent.svelte.ts` — `AgentSurfaceContext`

### 4.2 Conversation memory

| Layer | Storage | Retention |
|-------|---------|-----------|
| Active run | `ai_runs` + `ai_messages` | Per session |
| Completed turn summaries | `ai_messages.summary` | Last 5 turn pairs in context |
| Action log | `ai_tasks` | Permanent |
| Business RAG | Vector DB per org | Until document deleted |

### 4.3 Context pruning (from genix)

- Keep discovery bundle in system prompt (survives pruning)
- Prune tool rounds beyond last 2
- Strip page snapshots except latest
- Replay action summaries: `[Actions already completed in this conversation]`

**Reference:** `omino/genix-main/backend/agent/chat_loop.go` — `pruneToolRounds()`

---

## 5. Execution Model

### 5.1 Read path (immediate)

```
User: "What were sales yesterday?"
  → Orchestrator → Sales Agent
  → Tool: query_sales({ startDate, endDate })
  → API returns live data
  → Agent formats response with real numbers
  → Stream to UI
```

**Rule:** Agent must call tools for numeric claims — never invent figures.

### 5.2 Write path (approval required)

```
User: "Create a 10% discount for customer Ahmed"
  → Orchestrator → CRM Agent
  → Tool: apply_discount({ customerId, percent: 10 })
  → Tool marked requiresApproval=true
  → Create ai_task (status: proposed)
  → UI shows Approval Card:
      "Apply 10% discount to Ahmed Al-Masri?"
      [Approve] [Reject] [Edit]
  → User approves
  → ai_task (status: approved)
  → Worker executes API call
  → ai_task (status: executed)
  → Audit log entry
  → Agent confirms completion
```

**LangGraph interrupt pattern (future):** Pause graph at write tool until approval received.

**Reference:** multi-agent lacks this — OMINO differentiator.

---

## 6. Permissions & Safety

### 6.1 Permission matrix

| Check | When |
|-------|------|
| User has `ai:read` | Any agent interaction |
| User has tool's `permissionRequired` | Before tool execution |
| User has `orders:approve` | Before approving write tasks |
| `organizationId` match | Every API call from tool |

### 6.2 Safety mechanisms

| Mechanism | Implementation |
|-----------|----------------|
| Iteration cap | Max 8 tool calls per turn |
| Rate limiting | 20 req/min on `/api/v1/ai/*` (multi-agent pattern) |
| Prompt injection defense | RAG context marked untrusted (multi-agent `retriever.py`) |
| Mutation allowlist | Write tools only from approved registry |
| No cross-tenant RAG | Vector index keyed by `organizationId` |
| No raw SQL tools | All data access via typed API |
| Audit trail | Every tool call logged to `audit_logs` |
| Token budget | Per-org monthly limit (future billing) |

### 6.3 Human-in-the-loop

| Scenario | Behavior |
|----------|----------|
| Read query | Auto-execute |
| Recommendation | Display only, no side effects |
| Write action | Always require approval |
| Bulk action | Require approval + confirmation count |
| Payment/refund | Require Owner/Admin role |
| Delete | Require explicit confirmation phrase |

---

## 7. RAG (Retrieval-Augmented Generation)

### 7.1 Knowledge sources

| Source | Ingestion | Use |
|--------|-----------|-----|
| OMINO help docs | Platform index | "How do I..." questions |
| Org uploaded docs | Per-org ingest job | Policy, SOPs, product sheets |
| Product catalog | Sync from DB | Semantic product search |

### 7.2 Pipeline (from multi-agent)

```
Document upload
  → Load (PDF, DOCX, web)
  → Chunk (1000 chars, 150 overlap)
  → Embed (OpenAI or local)
  → Store in vector DB (org-scoped)
  → Available to search_knowledge tool
```

**Reference files:**
- `omino/multi-agent-business-os-main/backend/app/services/rag/`
- `omino/genix-main/backend/agent/knowledge/search.go`

### 7.3 Production vector store

- **MVP:** pgvector extension on PostgreSQL (same DB)
- **Scale:** Dedicated vector DB (Qdrant/Pinecone) per org namespace

---

## 8. Async Execution

| Operation | Execution | Queue |
|-----------|-----------|-------|
| Chat turn (read) | Sync, SSE stream | — |
| Chat turn (write) | Async after approval | BullMQ `ai-actions` |
| Document ingest | Async | BullMQ `ai-ingest` |
| Report generation | Async | BullMQ `ai-reports` |
| Morning briefing | Cron daily | BullMQ `ai-scheduled` |

**Reference:** multi-agent Celery split (`celery_app.py`), CaratFlow BullMQ

---

## 9. API Endpoints (Future)

```
POST   /api/v1/ai/chat              — Start/continue conversation (SSE)
GET    /api/v1/ai/runs/:id          — Get run status
GET    /api/v1/ai/tasks             — List pending approvals
POST   /api/v1/ai/tasks/:id/approve — Approve proposed action
POST   /api/v1/ai/tasks/:id/reject  — Reject proposed action
POST   /api/v1/ai/documents         — Upload for RAG (202 + job)
GET    /api/v1/ai/models            — Available LLM models
```

---

## 10. Frontend Integration (`/app/ai`)

### 10.1 UI components

| Component | Purpose |
|-----------|---------|
| AI Panel | Slide-over chat from any `/app` page |
| Approval Card | Inline card for pending `ai_tasks` |
| Insight Banner | Proactive alerts ("3 products low on stock") |
| Morning Briefing | Dashboard widget with AI summary |

### 10.2 Context injection

Every `/app` page provides surface context to AI panel via React context:

```typescript
<AIProvider surface={{ route, module, selectedEntityId }}>
  {children}
</AIProvider>
```

**Optional future:** genix-style component registry for UI automation (Phase 13+).

---

## 11. Failure Handling

| Failure | Response |
|---------|----------|
| LLM timeout | Retry once; then "I couldn't complete that. Try again." |
| Tool API error | Surface error to user; log to `ai_tasks` |
| Approval timeout | Task expires after 24h (configurable) |
| Rate limit | 429 with retry-after |
| Invalid tool args | Agent self-corrects (1 retry) |
| Cross-tenant attempt | Block + security alert |

---

## 12. Audit Requirements

Every AI action logs:

```json
{
  "action": "ai.tool.executed",
  "entityType": "AiTask",
  "entityId": "uuid",
  "metadata": {
    "agentSlug": "inventory",
    "toolSlug": "adjust_stock",
    "input": { "variantId": "...", "quantity": -5 },
    "output": { "movementId": "..." },
    "approvedBy": "user-uuid",
    "modelUsed": "gpt-4o",
    "tokensUsed": 1250
  }
}
```

---

## 13. Arabic AI Considerations

- System prompts authored in Arabic for AR locale — not translated English
- Font: Zain (display), IBM Plex Sans Arabic (body) — matches marketing
- RTL layout in AI panel
- Number formatting: locale-aware (Arabic-Indic optional)
- WhatsApp as primary customer channel in tool descriptions

---

## 14. Package Structure (Future)

```
packages/ai/
├── src/
│   ├── orchestrator/
│   │   ├── index.ts
│   │   ├── planner.ts
│   │   └── router.ts
│   ├── agents/
│   │   ├── sales.ts
│   │   ├── inventory.ts
│   │   └── crm.ts
│   ├── tools/
│   │   ├── registry.ts
│   │   ├── read/
│   │   └── write/
│   ├── prompts/
│   │   ├── system.en.ts
│   │   └── system.ar.ts
│   ├── rag/
│   │   ├── ingest.ts
│   │   └── search.ts
│   └── types/
└── package.json
```

---

## 15. What NOT to Build from References

| Source | Avoid |
|--------|-------|
| genix | GPL code, ScyllaDB storage, UI-only tools without API |
| multi-agent | Hardcoded `kb_search` only, no approval gates |
| Nexus `ai.js` | Simple Gemini forecast without tool registry |
| CaratFlow chatbot | Jewelry-specific FAQ bot |

---

*See also: `OMINO-TARGET-ARCHITECTURE.md` §5.16, `OMINO-DATABASE-BLUEPRINT.md` §3.9*
