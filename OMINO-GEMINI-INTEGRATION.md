# OMINO — Gemini Flash Integration

**Status:** Production-ready foundation  
**Provider:** Google Gemini via `@google/genai`  
**Default model:** `gemini-2.5-flash` (configurable)

---

## Architecture

```
User
  ↓
/app/ai (AiChat — SSE streaming)
  ↓
POST /api/ai/conversations/:id/messages?stream=true
  ↓
Conversation Service (persist messages)
  ↓
AI Orchestrator (tool loop, rate limit, sanitization)
  ↓
Business Context Service (pre-calculated metrics)
  ↓
Agent Router → Agent Definitions (OMINO Intelligence prompts)
  ↓
GeminiProvider (via getAIProvider)
  ↓
Tool Registry → Permission Layer → Domain Services
  ↓
Database (Prisma / PostgreSQL)
```

OMINO owns data, calculations, permissions, tools, and actions.  
Gemini provides reasoning, language understanding, and recommendations.

---

## Environment Variables

Add to server `.env` (never commit real keys):

```env
AI_ENABLED=true
AI_PROVIDER=gemini
GEMINI_API_KEY=your-key-here
AI_MODEL=gemini-2.5-flash
AI_DEEP_MODEL=gemini-2.5-pro
AI_TEMPERATURE=0.3
AI_MAX_TOKENS=2048
AI_MAX_TOOL_ITERATIONS=6
AI_MAX_MESSAGES_IN_CONTEXT=20
AI_RATE_LIMIT_PER_MINUTE=30
```

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes (for gemini) | Google AI API key — **server only** |
| `AI_PROVIDER` | No | `mock` \| `gemini` \| `openai` |
| `AI_MODEL` | No | Fast tier model (default: gemini-2.5-flash) |
| `AI_DEEP_MODEL` | No | Deep reasoning tier (future routing) |

**Never use `NEXT_PUBLIC_GEMINI_API_KEY`.**

---

## Provider Abstraction

| File | Role |
|------|------|
| `src/lib/ai/config.ts` | Central provider/model configuration |
| `src/server/ai/providers/types.ts` | `AIProvider`, `StreamingAIProvider` |
| `src/server/ai/providers/gemini-client.ts` | Server-only `GoogleGenAI` singleton |
| `src/server/ai/providers/gemini-provider.ts` | Gemini implementation |
| `src/server/ai/providers/index.ts` | Provider factory |

Switch providers by changing `AI_PROVIDER` — no architectural changes required.

Future providers (DeepSeek, OpenAI, Anthropic) plug into the same interface.

---

## OMINO System Instructions

`src/lib/ai/system-instructions.ts` defines **OMINO Intelligence** behavior:

- Use real OMINO data via tools
- Never invent business numbers
- Distinguish facts from recommendations
- Require confirmation for write actions
- Never access databases or expose secrets

Agent-specific prompts in `src/server/ai/agents/definitions.ts` extend this base.

---

## Business Context

`src/server/ai/context/business-context-service.ts` builds structured snapshots:

- Organization (name, currency, business type)
- Store / branch
- Pre-calculated sales summary (from analytics-service)
- Business signals

Gemini receives interpreted context — not raw SQL or table access.

---

## Tool Registry

20 tools in `src/server/ai/tools/registry.ts`:

**Read:** sales, products, inventory, orders, customers, analytics, store intelligence, merchandising  
**Write (confirmation required):** `adjust_inventory`, `update_product_price`, `create_customer`

Each tool has: name, description, permissions, risk level, Zod input schema.

---

## Action Safety

Write tools flow:

1. Gemini proposes action via tool call
2. Executor runs dry-run → creates `ai_actions` (PENDING)
3. UI shows confirmation card
4. User confirms → `ai.execute` permission required
5. Domain service executes → audit log

---

## Streaming

`POST /api/ai/conversations/:id/messages?stream=true` returns SSE events:

| Event | Payload |
|-------|---------|
| `status` | `{ message: string }` — tool activity |
| `content` | `{ delta: string }` — streamed response text |
| `done` | `{ result: OrchestratorResult }` |
| `error` | `{ error: string }` |

The UI at `/app/ai` uses streaming by default.

---

## Usage Tracking

`src/server/ai/usage-service.ts` records per request:

- organization_id, user_id
- provider (`gemini`), model
- input/output tokens
- tool call count, status

Exposed via `GET /api/ai/memories` (usage summary).

---

## Security

| Protection | Implementation |
|------------|----------------|
| API key isolation | `GEMINI_API_KEY` server-only |
| Tenant isolation | `requireTenantContext` + RLS |
| Rate limiting | Per org/user in-memory limiter |
| Prompt injection | `sanitizeUserMessage` |
| Permission gates | Tool executor + `ai.execute` |
| Error sanitization | Mapped to `AI_*` codes — no raw Gemini errors |
| Tool loop cap | `AI_MAX_TOOL_ITERATIONS` |

---

## Testing

```bash
npm run test:phase8   # AI core (tools, permissions, routing)
npm run test:gemini   # Gemini config, security, optional live test
npm run typecheck
npm run lint
npm run build
```

Live Gemini test runs when `GEMINI_API_KEY` is set in environment.

---

## Production Setup

1. Obtain Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. Set environment variables on your server (not in git)
3. Set `AI_PROVIDER=gemini`
4. Restart the application
5. Open `/app/ai` and ask: "How is my business doing?"
6. Verify tool calls in `/app/ai/activity`

---

## Future: Multi-Provider Routing

```typescript
// src/lib/ai/config.ts already supports:
getModelForTier('fast')  // gemini-2.5-flash
getModelForTier('deep')  // gemini-2.5-pro
```

Orchestrator can route simple tasks to fast models and complex analytics to deep models.

---

## Files Reference

**Created:**
- `src/lib/ai/config.ts`
- `src/lib/ai/system-instructions.ts`
- `src/lib/ai/structured-response.ts`
- `src/server/ai/providers/gemini-client.ts`
- `src/server/ai/providers/gemini-provider.ts`
- `scripts/test-gemini.ts`
- `OMINO-GEMINI-INTEGRATION-AUDIT.md`
- `OMINO-GEMINI-INTEGRATION.md`

**Modified:**
- `src/server/ai/config.ts` (re-export)
- `src/server/ai/providers/index.ts`
- `src/server/ai/providers/types.ts`
- `src/server/ai/providers/openai-provider.ts`
- `src/server/ai/orchestrator.ts`
- `src/server/ai/agents/definitions.ts`
- `src/app/api/ai/conversations/[id]/messages/route.ts`
- `src/components/ai/ai-chat.tsx`
- `scripts/test-phase8.ts`
- `.env.example`
- `package.json`
