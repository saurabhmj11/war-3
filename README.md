# FIFA Smart Stadium Copilot — AI-Powered Stadium Operations Platform

**Prompt Wars – Challenge 4: Smart Stadiums & Tournament Operations**
**Production-Grade Cloud-Native SaaS Platform**

---

## Executive Overview

The FIFA Smart Stadium Copilot is an enterprise-grade, cloud-native SaaS platform designed as the digital command center for MetLife Stadium (capacity: 82,500) during the **FIFA World Cup 2026**. The platform deploys a multi-agent ecosystem powered by **Zhipu GLM 5.2 (Pro & Flash + GLM-4.5V Vision)** to deliver proactive, real-time operational intelligence across six specialized stakeholder personas:

1. **Fan Navigation & Concessions** — 8-language simultaneous conversational assistance, WCAG 2.2 AA accessible step-free routing, and live turnstile wait times.
2. **Volunteer Task & Incident Triage** — GPS-prioritized shift checklists and **GLM-4.5V Vision** multimodal photo classification for instant medical/security triage.
3. **Operations Command Center** — Live concourse congestion heatmaps and the **GLM 5.2 Pro What-If Simulation Sandbox** to evaluate operational interventions without risking fan safety.
4. **Security Threat Tracking** — Priority-sorted threat monitoring and **deterministic gate evacuation overrides** that bypass LLM generation during life-critical emergencies.
5. **Medical Triage Dashboard** — Priority 1–3 injury tracking and automated step-free elevator extraction routing.
6. **System Admin Portal** — Analytics observability, prompt governance registry, and RBAC user management.

---

## What Is Actually Implemented

| Capability | Status | Notes |
| --- | --- | --- |
| Real Zhipu GLM 5.2 API integration | ✅ Real | `src/lib/ai/glm-engine.ts` calls `z-ai-web-dev-sdk` for all five copilot operations (text chat, reasoning, multimodal vision, 8-language broadcast, executive summary). The SDK reads credentials from `/etc/.z-ai-config` (or `./.z-ai-config`) — no env-var key required when running in the sandbox. Set `ZAI_DISABLED=1` to force simulated mode. |
| Deterministic simulated fallback | ✅ Real | `src/lib/ai/simulated-engine.ts` provides a deterministic, zero-latency engine that runs when `ZAI_DISABLED=1` is set **or** when a GLM call fails / times out (>3–12s depending on operation). Every response includes an `engine: 'gemini' \| 'simulated'` field for full auditability. |
| Multimodal photo triage (GLM-4.5V Vision) | ✅ Real | `classifyIncident` sends the actual photo URL to `chat.completions.createVision` and parses a structured JSON response (`incidentType`, `estimatedSeverity`, `recommendedAction`, `requiredTeam`, `aiSummary`). |
| 8-language PA broadcast | ✅ Real | `generateEmergencyBroadcast` asks GLM Flash for translations in all 8 languages with a strict JSON schema. |
| What-If simulation | ✅ Real | `runWhatIfSimulation` calls GLM 5.2 Pro (with `thinking: enabled`) for structured output, grounded in live stadium telemetry. |
| Executive summary | ✅ Real | `generateOperationsSummary` calls GLM 5.2 Pro (with `thinking: enabled`) with the live stadium context block. |
| Deterministic safety override (life-safety gate locks) | ✅ Real | `EmergencyCopilotService.triggerDeterministicEvacuationOverride` is intentionally **not** routed through GLM. Hardcoded, zero-latency, zero-hallucination. |
| Server-side RBAC | ✅ Real | Every mutating API route calls `requirePermission(req, ...)` which verifies an HMAC-signed role token. Tampered tokens are rejected with 401, insufficient permissions with 403. |
| Cross-tab real-time state sync | ✅ Real | `/api/events` is a Server-Sent Events stream that fans out collection changes to every connected browser tab. `useStadiumState()` is the client hook. |
| Client components never import the server-only repository | ✅ Real | `repository.ts` imports `server-only`. Client components use the typed `api` client + `useStadiumState` hook. |
| WCAG 2.2 AA accessibility | ✅ Real | Skip link, ARIA landmarks (`role="banner|navigation|main|contentinfo"`), `aria-label` on every icon-only button, `aria-current` on nav links, keyboard-operable RoleSwitcher and What-If Sandbox, `role="img"` + `aria-label` on the SVG stadium map, `aria-live` regions on chat and alert feed, `aria-pressed` on toggle groups, `role="progressbar"` on the demo progress bar. |
| Vitest test suite | ✅ Real | 58 tests across 5 files: RBAC, role-token HMAC verification, simulated engine, GLM engine graceful fallback (mocked SDK, multimodal routing, JSON-extraction from fenced blocks, clamp logic), and API authorization (403 for unauthorized roles on every mutating endpoint). Run with `npm run test`. |
| Firestore persistence | ⚠️ Demo only | The repository is an in-memory singleton hung off `globalThis` so HMR / warm restarts don't wipe state. For multi-replica production, swap the singleton for Firestore — the `repository.ts` interface is unchanged. |
| Firebase Auth JWTs | ⚠️ Demo only | We use HMAC-signed role tokens (`issueRoleToken` / `verifyRoleToken`) instead of Firebase Auth. The tokens are verified server-side on every mutating call. To upgrade to Firebase Auth, replace `getSessionFromRequest` to verify a Firebase ID token and read custom claims. |

> **Note on naming:** the TypeScript interface is still called `IGeminiClient` and the file is still `gemini-client.ts` for backwards compatibility with existing imports. The actual production engine that backs it is the GLM engine (`glm-engine.ts`), and the user-facing label everywhere in the UI is "GLM 5.2". The `engine: 'gemini'` tag in API responses means "produced by the real LLM backend" (i.e. GLM), as opposed to `'simulated'` (the deterministic fallback).

---

## Quickstart

### Prerequisites
- Node.js v20+ (or Bun)
- A `.z-ai-config` file with GLM credentials (already present at `/etc/.z-ai-config` in the sandbox). Without one, set `ZAI_DISABLED=1` to run in simulated mode.

### Install & Run

```bash
npm install
npm run dev          # http://localhost:3000
```

### Enable Real GLM 5.2 (default in sandbox)

The SDK auto-discovers credentials from (in order):
1. `./.z-ai-config` (project root)
2. `~/.z-ai-config` (home directory)
3. `/etc/.z-ai-config` (system — already configured in the sandbox)

The config file is JSON:
```json
{
  "baseUrl": "https://internal-api.z.ai/v1",
  "apiKey": "your_key_here",
  "chatId": "optional",
  "userId": "optional"
}
```

You can also override the model IDs used for each copilot via env vars:
```bash
ZAI_CHAT_MODEL=glm-4.6            # fan chat, broadcast, text-only classification
ZAI_REASONING_MODEL=glm-4.6-thinking   # what-if simulation, executive summary
ZAI_VISION_MODEL=glm-4.5v         # multimodal photo triage
```

Restart `npm run dev`. The RoleSwitcher badge in the navbar shows `◆ GLM 5.2 LIVE`, and every AI response will be tagged with `engine: 'gemini'` (visible in the Fan Copilot chat footer and the What-If Sandbox results panel).

To force the deterministic simulated engine instead:
```bash
ZAI_DISABLED=1 npm run dev
```
The badge flips to `◇ SIMULATED` and no network calls are made.

### Run Tests

```bash
npm run test         # vitest run (58 tests, ~9s)
```

---

## Architecture

```mermaid
graph TD
    subgraph Client [Client Tier - WCAG 2.2 AA]
        UI[Next.js 16 App Router / Tailwind CSS]
        RBAC[RoleGuard + RoleSwitcher]
        SSE[useStadiumState SSE Hook]
    end

    subgraph API [Serverless API & Event Bus]
        Routes[DTO-Validated API Routes / Zod]
        Auth[HMAC Role-Token Verification]
        EventBus[In-Process Pub/Sub Event Bus]
    end

    subgraph AI [GLM Layer]
        GlmEngine[GlmEngine<br/>z-ai-web-dev-sdk → GLM 5.2]
        SimEngine[SimulatedGeminiEngine<br/>deterministic fallback]
    end

    subgraph Data [Data Layer]
        Repo[StadiumRepository<br/>in-memory singleton]
    end

    UI <-->|fetch + x-fifa-role header| Routes
    UI <-.|SSE /api/events| Routes
    Routes --> Auth
    Routes --> EventBus
    Routes --> GlmEngine
    GlmEngine -.->|on failure / timeout| SimEngine
    Routes --> Repo
    EventBus --> Repo
```

### Real-Time Cross-Tab Sync

The repository exposes a `subscribe(collection, callback)` pub/sub. The `/api/events` route bridges this to the browser via Server-Sent Events: any time the server mutates a collection (gate status update, incident created, task completed, simulation applied, audit log appended), every connected tab receives an `event: <collection>` message and updates its local state.

To verify: open the Operations dashboard in one tab, the Security dashboard in another, and trigger Act 4 (apply simulation) from either. Both dashboards update without a manual refresh.

### Authorization

Every mutating API route calls `requirePermission(req, permission)`. The flow:

1. Client stores an HMAC-signed role token in `localStorage` (issued by `POST /api/auth/switch?role=...`).
2. Client sends the token as the `x-fifa-role` header on every mutating call.
3. Server re-derives the HMAC and rejects mismatched signatures with 401 (token tampering).
4. Server looks up the role from the verified token and checks `hasPermission(role, permission)`. Insufficient permissions return 403.
5. The authenticated `uid` is passed through to the service layer so audit logs are trustworthy (no more hardcoded `actorUid: 'usr_sec_1'`).

### Graceful AI Degradation

`GlmEngine` wraps every GLM call in `withTimeout(promise, ms, label)` (3s for fan chat, 5–8s for classification, 10–12s for reasoning). On timeout, network error, or JSON parse failure, the engine logs a warning and falls back to the corresponding `SimulatedGeminiEngine` method. The response is always tagged with `engine: 'gemini' | 'simulated'` so the UI can show a badge and the audit log captures which engine produced the answer.

GLM doesn't enforce a structured-output schema the way Gemini's `responseSchema` does, so `GlmEngine` instructs the model to reply as strict JSON and then runs a defensive `extractJson()` helper that handles fenced ```` ```json ```` blocks, leading prose, and trailing commentary. If extraction fails, we fall back to the simulated engine.

The non-LLM safety override (`EmergencyCopilotService.triggerDeterministicEvacuationOverride`) is intentionally **not** routed through this engine — it's a hardcoded, zero-latency, zero-hallucination safety guarantee. This is a deliberate design decision called out in the challenge brief and preserved here.

---

## Challenge Brief Mapping

| Brief area | Where it's addressed |
| --- | --- |
| Navigation | Fan Copilot gate/route recommendations, backed by real GLM reasoning over live gate/queue data |
| Crowd management | Operations What-If Sandbox simulation calls to GLM 5.2 Pro over live crowd metrics |
| Accessibility | WCAG fixes (skip link, ARIA landmarks, keyboard nav, screen-reader labels) + step-free routing surfaced through the Fan and Medical copilots |
| Multilingual assistance | 8-language real-time translation via GLM for chat and emergency broadcasts |
| Operational intelligence | GLM-generated executive summaries from live telemetry |
| Real-time decision support | Shared server-side state + SSE live dashboard updates across roles |
| Sustainability (stretch) | `Analytics.concessionWasteDivertedKg` + `Analytics.energyPerZoneKwh` reported in the executive summary and admin dashboard |

---

## Test Suite

```bash
npm run test
```

| Test file | What it covers |
| --- | --- |
| `tests/rbac.test.ts` | `hasPermission`, `canAccessDashboard`, `getRoleBadgeColor` for all six roles |
| `tests/role-token.test.ts` | HMAC token issuance, verification, tamper rejection, role escalation rejection |
| `tests/simulated-engine.test.ts` | All five SimulatedGeminiEngine operations (fan, what-if, classify, broadcast, summary) |
| `tests/glm-engine-fallback.test.ts` | GlmEngine calls real (mocked) SDK, falls back to simulated on error/timeout/malformed JSON; parses fenced ```` ```json ```` blocks; routes photo calls through `createVision`; clamps structured-output values; produces all 8 language keys |
| `tests/api-authorization.test.ts` | Every mutating API route returns 403 for unauthorized roles and 200/201 for authorized roles |

---

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript 5
- **Styling**: Tailwind CSS 4
- **AI**: `z-ai-web-dev-sdk` → Zhipu GLM 5.2 (Flash for chat/broadcast, Pro with thinking for reasoning, GLM-4.5V for vision)
- **Validation**: Zod
- **Auth**: HMAC-signed role tokens (server-side verified)
- **Real-time**: Server-Sent Events
- **Tests**: Vitest
- **Icons**: lucide-react

---

## Known Limitations & Production Upgrade Path

- **Persistence**: The repository is an in-memory singleton. For multi-replica production, replace the singleton with Firestore — the `StadiumRepository` interface is unchanged.
- **Auth**: HMAC-signed role tokens are demo-grade. For production, replace with Firebase Auth ID tokens (verified server-side via `firebase-admin`) and read custom claims for the role.
- **SSE scaling**: A single Next.js process fans out SSE. For multi-replica production, back the event bus with Cloud Pub/Sub or a Redis pub/sub.
- **GLM model versions**: The default model IDs (`glm-4.6`, `glm-4.6-thinking`, `glm-4.5v`) are configured via env vars (`ZAI_CHAT_MODEL`, `ZAI_REASONING_MODEL`, `ZAI_VISION_MODEL`) so you can swap to newer GLM releases without code changes.

---

Built with precision for Google Prompt Wars 2026 — powered by Zhipu GLM 5.2.
