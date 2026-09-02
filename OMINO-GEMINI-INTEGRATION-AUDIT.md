# OMINO — Gemini Flash Integration Audit

**Date:** 2026-09-02  
**Scope:** Integrate Google Gemini Flash as the primary AI provider within OMINO's existing Phase 8 AI architecture.

---

## Executive Summary

OMINO already has a **production-ready AI foundation** (Phase 8). This integration adds Gemini as a first-class provider without duplicating orchestration, tools, permissions, or conversation services. The existing architecture is provider-agnostic by design.

| Component | Status Before | Action |
|-----------|---------------|--------|
| AI Orchestrator | ✅ Implemented | Reuse as-is |
| Tool Registry (20 tools) | ✅ Implemented | Reuse as-is |
| Business Context Service | ✅ Implemented | Reuse as-is |
| Conversation / Action / Usage services | ✅ Implemented | Reuse as-is |
| Permission layer | ✅ Implemented | Reuse as-is |
| Mock + OpenAI providers | ✅ Implemented | Extend with Gemini |
| Gemini provider | ❌ Missing | **Create** |
| Central lib AI config | ❌ Missing | **Create** `src/lib/ai/config.ts` |
| OMINO system instructions | ⚠️ Partial | **Centralize** in `src/lib/ai/system-instructions.ts` |
| Structured AI responses | ❌ Missing | **Create** types |
| Streaming | ⚠️ Types only | **Wire** Gemini streaming + SSE route |
| `@google/genai` SDK | ❌ Missing | **Install** |

**Database:** PostgreSQL via Prisma (no Supabase). No schema changes required.

---

## Existing AI Architecture

### Request Flow (unchanged)

```
User → /app/ai (AiChat)
     → POST /api/ai/conversations/:id/messages
     → runOrchestrator()
         → rate limit + prompt sanitize
         → conversation-service (persist user message)
         → agents/router (keyword routing)
         → business-context-service (structured snapshot)
         → memory-service (user/org memories)
         → getAIProvider() → generate() tool loop
         → tools/executor (permission + validation)
         → action-service (write confirmation gate)
         → usage-service (token tracking)
     → JSON response → UI
```

### Core Files (reuse, do not duplicate)

| File | Role |
|------|------|
| `src/server/ai/orchestrator.ts` | Main AI loop, tool iterations, usage recording |
| `src/server/ai/conversation-service.ts` | Conversations, messages, tool-call audit |
| `src/server/ai/action-service.ts` | Write-action approval workflow |
| `src/server/ai/memory-service.ts` | Persistent AI memories |
| `src/server/ai/usage-service.ts` | Token/latency tracking per org/user |
| `src/server/ai/context/business-context-service.ts` | Structured business context (no raw DB) |
| `src/server/ai/tools/registry.ts` | 20 tool definitions + Zod schemas |
| `src/server/ai/tools/executor.ts` | Permission checks, validation, dry-run writes |
| `src/server/ai/tools/handlers.ts` | Domain service adapters |
| `src/server/ai/agents/definitions.ts` | 4 agents (ANALYST, OPERATIONS, CUSTOMER, GROWTH) |
| `src/server/ai/agents/router.ts` | Keyword-based agent routing |
| `src/lib/security/rate-limit.ts` | Per-org/user rate limiting |
| `src/lib/security/prompt-sanitizer.ts` | Prompt injection filtering |

### Providers (extend)

| File | Role |
|------|------|
| `src/server/ai/providers/types.ts` | `AIProvider`, `StreamingAIProvider` interfaces |
| `src/server/ai/providers/index.ts` | Provider factory (`getAIProvider`) |
| `src/server/ai/providers/mock-provider.ts` | Dev/test without API keys |
| `src/server/ai/providers/openai-provider.ts` | OpenAI via fetch |

### API Routes (reuse)

| Route | Permission | Purpose |
|-------|------------|---------|
| `GET/POST /api/ai/conversations` | `ai.use` | List/create conversations |
| `GET/DELETE /api/ai/conversations/[id]` | `ai.use` | Get/delete thread |
| `POST /api/ai/conversations/[id]/messages` | `ai.use` | Run orchestrator |
| `GET/POST /api/ai/actions/[id]` | `ai.execute` (confirm) | Write-action approval |
| `GET/POST/DELETE /api/ai/memories` | `ai.use` | Memory management |

### UI (reuse, minor streaming update)

| File | Route |
|------|-------|
| `src/app/app/ai/page.tsx` | `/app/ai` |
| `src/app/app/ai/activity/page.tsx` | `/app/ai/activity` |
| `src/components/ai/ai-chat.tsx` | Chat interface |
| `src/components/ai/activity-list.tsx` | Action audit list |

### Database (Prisma — no changes)

```
ai_conversations, ai_messages, ai_tool_calls,
ai_actions, ai_memories, ai_usage
```

RLS policies: `prisma/migrations/rls_phase8_policies.sql`

### Environment (before)

```
AI_ENABLED, AI_PROVIDER, AI_MODEL, AI_TEMPERATURE,
AI_MAX_TOKENS, AI_RATE_LIMIT_PER_MINUTE, OPENAI_API_KEY
```

---

## Integration Points for Gemini

1. **`GeminiProvider`** implements existing `AIProvider` (+ `StreamingAIProvider`)
2. **`getAIProvider()`** adds `case 'gemini'`
3. **`src/lib/ai/config.ts`** centralizes provider/model config with multi-provider support
4. **`gemini-client.ts`** server-only `GoogleGenAI` singleton
5. **System instructions** injected via agent definitions (already in orchestrator system prompt)
6. **Tool declarations** mapped from existing `ToolDefinition.parameters` JSON Schema
7. **Usage tracking** unchanged — `provider.name` becomes `'gemini'`

Gemini never receives: Supabase credentials, SQL, env vars, service keys, or direct DB access.

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/ai/config.ts` | Central AI provider/model configuration |
| `src/lib/ai/system-instructions.ts` | OMINO Intelligence core behavior |
| `src/lib/ai/structured-response.ts` | Structured response types |
| `src/server/ai/providers/gemini-client.ts` | Server-only Gemini client |
| `src/server/ai/providers/gemini-provider.ts` | Gemini Flash provider |
| `src/app/api/ai/conversations/[id]/messages/stream/route.ts` | SSE streaming endpoint |
| `scripts/test-gemini.ts` | Provider + security tests |
| `OMINO-GEMINI-INTEGRATION.md` | Integration documentation |

## Files to Modify

| File | Change |
|------|--------|
| `src/server/ai/config.ts` | Re-export from lib, add gemini provider |
| `src/server/ai/providers/index.ts` | Register GeminiProvider |
| `src/server/ai/agents/definitions.ts` | Use central system instructions |
| `src/server/ai/orchestrator.ts` | Optional streaming support, Gemini error mapping |
| `src/components/ai/ai-chat.tsx` | SSE streaming for final response |
| `.env.example` | Add GEMINI_API_KEY, AI_PROVIDER=gemini |
| `package.json` | Add test:gemini script |
| `scripts/test-phase8.ts` | Fix rate-limit import path |

---

## Services Reused (no duplication)

- `buildBusinessContext` / `contextToSystemPrompt` — metrics from analytics-service
- `getSalesSummary`, `getBusinessSignals` — OMINO calculates, Gemini interprets
- `store-intelligence-service` — `analyze_storefront`, `analyze_product_merchandising` tools
- All 20 tool handlers — domain service layer unchanged
- `recordUsage` — monetization-ready tracking
- `checkRateLimit` — abuse prevention
- `sanitizeUserMessage` — prompt injection defense

---

## Security Considerations

| Risk | Mitigation |
|------|------------|
| API key exposure | `GEMINI_API_KEY` server-only; never `NEXT_PUBLIC_*` |
| Client bundle leak | `gemini-client.ts` imported only from server paths |
| Prompt injection | Existing sanitizer on user messages |
| Tenant isolation | `requireTenantContext` + org-scoped queries + RLS |
| Permission bypass | Tool executor checks `ai.use` + domain permissions |
| Unauthorized writes | Dry-run → `ai_actions` PENDING → user confirm → `ai.execute` |
| Tool abuse | Rate limiting per org/user |
| Hallucinated metrics | Business context pre-calculated; system instructions forbid invention |
| Recursive tool loops | `AI_MAX_TOOL_ITERATIONS` (default 6) |
| Raw provider errors | Map to user-safe messages in provider + API |
| Oversized prompts | Message length limit (4000 chars) + context window cap |

**Action:** Rotate any API key shared in chat/logs. Store only in server `.env`, never commit.

---

## Migration Strategy

1. **Phase A (this PR):** Add Gemini provider behind `AI_PROVIDER=gemini` env flag
2. **Phase B:** Set `AI_PROVIDER=gemini` and `AI_MODEL=gemini-2.5-flash` in production `.env`
3. **Phase C (future):** Add DeepSeek/OpenAI via same provider interface; task-tier routing (FAST/DEEP)
4. **No DB migration** required
5. **Fallback:** If `GEMINI_API_KEY` missing, config falls back to `mock` provider
6. **Rollback:** Set `AI_PROVIDER=mock` or `openai` — zero code changes

---

## What Is NOT in Scope

- WhatsApp/SMS/voice AI
- Autonomous agents without approval
- Arbitrary SQL/code execution
- Vector DB / RAG (`search_knowledge`)
- AI billing system
- New write tools (refunds, bulk delete, etc.)

---

## Testing Plan

1. `npm run test:phase8` — existing AI core tests (fix rate-limit import)
2. `npm run test:gemini` — provider mapping, security, error handling
3. Manual: `/app/ai` with `AI_PROVIDER=gemini` + valid key
4. Verify tool calls fetch real analytics data
5. Verify write actions require confirmation
6. `npm run typecheck && npm run lint && npm run build`
