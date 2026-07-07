# FIFA Smart Stadium Copilot — AI-Powered Stadium Operations Platform

**Prompt Wars – Challenge 4: Smart Stadiums & Tournament Operations**
**Production-Grade Cloud-Native SaaS Platform**

---

## Executive Overview

The FIFA Smart Stadium Copilot is an enterprise-grade, cloud-native SaaS platform designed as the digital command center for MetLife Stadium (capacity: 82,500) during the **FIFA World Cup 2026**. The platform deploys a multi-agent ecosystem powered by **Google Gemini 2.5 (Pro & Flash)** to deliver proactive, real-time operational intelligence across six specialized stakeholder personas:

1. **Fan Navigation & Concessions** — 8-language simultaneous conversational assistance, WCAG 2.2 AA accessible step-free routing, and live turnstile wait times.
2. **Volunteer Task & Incident Triage** — GPS-prioritized shift checklists and **Gemini Vision** multimodal photo classification for instant medical/security triage.
3. **Operations Command Center** — Live concourse congestion heatmaps and the **Gemini 2.5 Pro What-If Simulation Sandbox** to evaluate operational interventions without risking fan safety.
4. **Security Threat Tracking** — Priority-sorted threat monitoring and **deterministic gate evacuation overrides** that bypass LLM generation during life-critical emergencies.
5. **Medical Triage Dashboard** — Priority 1–3 injury tracking and automated step-free elevator extraction routing.
6. **System Admin Portal** — Analytics observability, prompt governance registry, and RBAC user management.

---

## What Is Actually Implemented (vs. the original claims)

A code audit of the original repo surfaced a gap between the documentation and the implementation. This version closes that gap. The table below is **the source of truth** for what the platform does today.

| Capability | Status | Notes |
| --- | --- | --- |
| Real Google Gemini API integration | ✅ Real | `src/lib/ai/vertex-engine.ts` calls `@google/genai` with structured-output schemas for all five copilot operations. The `GOOGLE_GENAI_API_KEY` env var flips the engine from simulated to real. |
| Deterministic simulated fallback | ✅ Real | `src/lib/ai/simulated-engine.ts` provides a deterministic, zero-latency engine that runs whenever no API key is configured **or** when a Gemini call fails / times out (>3s). Every response includes an `engine: 'gemini' \| 'simulated'` field for full auditability. |
| Multimodal photo triage (Gemini Vision) | ✅ Real | `classifyIncident` sends the actual photo URL to a multimodal Gemini Flash call and parses a structured JSON response (`incidentType`, `estimatedSeverity`, `recommendedAction`, `requiredTeam`, `aiSummary`). |
| 8-language PA broadcast | ✅ Real | `generateEmergencyBroadcast` asks Gemini Flash for translations in all 8 languages with a strict JSON schema. |
| What-If simulation | ✅ Real | `runWhatIfSimulation` calls Gemini 2.5 Pro with structured output, grounded in live stadium telemetry. |
| Executive summary | ✅ Real | `generateOperationsSummary` calls Gemini 2.5 Pro with the live stadium context block. |
| Deterministic safety override (life-safety gate locks) | ✅ Real | `EmergencyCopilotService.triggerDeterministicEvacuationOverride` is intentionally **not** routed through Gemini. Hardcoded, zero-latency, zero-hallucination. |
| Server-side RBAC | ✅ Real | Every mutating API route calls `requirePermission(req, ...)` which verifies an HMAC-signed role token. Tampered tokens are rejected with 401, insufficient permissions with 403. |
| Cross-tab real-time state sync | ✅ Real | `/api/events` is a Server-Sent Events stream that fans out collection changes to every connected browser tab. `useStadiumState()` is the client hook. |
| Client components never import the server-only repository | ✅ Real | `repository.ts` imports `server-only`. Client components use the typed `api` client + `useStadiumState` hook. |
| WCAG 2.2 AA accessibility | ✅ Real | Skip link, ARIA landmarks (`role="banner|navigation|main|contentinfo"`), `aria-label` on every icon-only button, `aria-current` on nav links, keyboard-operable RoleSwitcher and What-If Sandbox, `role="img"` + `aria-label` on the SVG stadium map, `aria-live` regions on chat and alert feed, `aria-pressed` on toggle groups, `role="progressbar"` on the demo progress bar. |
| Vitest test suite | ✅ Real | 56 tests across 5 files: RBAC, role-token HMAC verification, simulated engine, Vertex engine graceful fallback (mocked SDK), and API authorization (403 for unauthorized roles on every mutating endpoint). Run with `npm run test`. |
| Firestore persistence | ⚠️ Demo only | The repository is an in-memory singleton hung off `globalThis` so HMR / warm restarts don't wipe state. For multi-replica production, swap the singleton for Firestore — the `repository.ts` interface is unchanged. |
| Firebase Auth JWTs | ⚠️ Demo only | We use HMAC-signed role tokens (`issueRoleToken` / `verifyRoleToken`) instead of Firebase Auth. The tokens are verified server-side on every mutating call. To upgrade to Firebase Auth, replace `getSessionFromRequest` to verify a Firebase ID token and read custom claims. |

---

## Quickstart

### Prerequisites
- Node.js v20+ (or Bun)
- (Optional) A Google AI Studio API key for real Gemini — without one, the platform runs in simulated mode.

### Install & Run

```bash
npm install
npm run dev          # http://localhost:3000
```

### Enable Real Gemini (optional, recommended for judges)

Create a `.env.local` file:

```bash
GOOGLE_GENAI_API_KEY=your_google_ai_studio_key_here
# Optional: change the HMAC secret used for role tokens
FIFA_ROLE_TOKEN_SECRET=your_random_secret
```

Restart `npm run dev`. The RoleSwitcher badge in the navbar flips from `SIMULATED` to `GEMINI LIVE`, and every AI response will be tagged with `engine: 'gemini'` (visible in the Fan Copilot chat footer and the What-If Sandbox results panel).

Without a key, the platform runs entirely on the deterministic simulated engine — no network calls, no runtime errors.

### Run Tests

```bash
npm run test         # vitest run (56 tests, ~9s)
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

    subgraph AI [Gemini Layer]
        VertexEngine[VertexAIGeminiEngine<br/>@google/genai]
        SimEngine[SimulatedGeminiEngine<br/>deterministic fallback]
    end

    subgraph Data [Data Layer]
        Repo[StadiumRepository<br/>in-memory singleton]
    end

    UI <-->|fetch + x-fifa-role header| Routes
    UI <-.|SSE /api/events| Routes
    Routes --> Auth
    Routes --> EventBus
    Routes --> VertexEngine
    VertexEngine -.->|on failure / timeout| SimEngine
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

`VertexAIGeminiEngine` wraps every Gemini call in `withTimeout(promise, ms, label)`. On timeout, network error, or JSON parse failure, the engine logs a warning and falls back to the corresponding `SimulatedGeminiEngine` method. The response is always tagged with `engine: 'gemini' | 'simulated'` so the UI can show a badge and the audit log captures which engine produced the answer.

The non-LLM safety override (`EmergencyCopilotService.triggerDeterministicEvacuationOverride`) is intentionally **not** routed through this engine — it's a hardcoded, zero-latency, zero-hallucination safety guarantee. This is a deliberate design decision called out in the challenge brief and preserved here.

---

## Challenge Brief Mapping

| Brief area | Where it's addressed |
| --- | --- |
| Navigation | Fan Copilot gate/route recommendations, backed by real Gemini reasoning over live gate/queue data |
| Crowd management | Operations What-If Sandbox simulation calls to Gemini 2.5 Pro over live crowd metrics |
| Accessibility | WCAG fixes (skip link, ARIA landmarks, keyboard nav, screen-reader labels) + step-free routing surfaced through the Fan and Medical copilots |
| Multilingual assistance | 8-language real-time translation via Gemini for chat and emergency broadcasts |
| Operational intelligence | Gemini-generated executive summaries from live telemetry |
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
| `tests/vertex-engine-fallback.test.ts` | VertexAIGeminiEngine calls real (mocked) SDK, falls back to simulated on error/timeout/malformed JSON |
| `tests/api-authorization.test.ts` | Every mutating API route returns 403 for unauthorized roles and 200/201 for authorized roles |

---

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript 5
- **Styling**: Tailwind CSS 4
- **AI**: `@google/genai` (Gemini 2.5 Flash + Pro)
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

---

Built with precision for Google Prompt Wars 2026.
