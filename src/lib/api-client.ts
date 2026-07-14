'use client';

import type {
  SeedDatabase,
} from '@/lib/db/seed-data';
import type {
  Incident,
  IncidentClassificationDTO,
  Gate,
  CrowdMetric,
  Task,
  Announcement,
  Analytics,
  AuditLog,
  FanCopilotResponseDTO,
  WhatIfScenarioDTO,
  WhatIfResultDTO,
  OperationsSummaryDTO,
  AIChatTurn,
  LanguageCode,
} from '@/domain/types';

/**
 * Typed API client. Centralizes fetch + role-token header injection so
 * individual components don't have to repeat the boilerplate.
 *
 * The role token is read from localStorage on every call (set by AuthProvider
 * after /api/auth/switch returns). If absent, requests fall back to the
 * anonymous FAN session — server-side auth will then 403 any mutating call
 * the FAN role isn't allowed to perform.
 */
const TOKEN_KEY = 'fifa_session_token';

/**
 * Reads the HMAC-signed role token from `localStorage`.
 * Returns `null` when called outside a browser context (SSR safety guard).
 *
 * @returns The raw token string, or `null` if absent or non-browser.
 */
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Builds the `x-fifa-role` header object for authenticated API requests.
 * If no token is stored, returns an empty object — the server will treat the
 * caller as an anonymous FAN session and reject any mutating call.
 *
 * @returns A `HeadersInit`-compatible object with the role token, or `{}`.
 */
function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { 'x-fifa-role': token } : {};
}

/**
 * Typed fetch wrapper that injects auth headers, parses the JSON response,
 * and throws a typed error on any non-successful status code or when the
 * server returns `success: false`.
 *
 * All errors include `status` (HTTP status code) and `details` (server
 * validation details, if provided) for upstream error handling.
 *
 * @template T - The expected shape of the `data` field in the JSON response.
 * @param url - The API endpoint URL.
 * @param init - Optional `RequestInit` options (method, body, etc.).
 * @returns The `data` field of the parsed JSON response cast to `T`.
 * @throws An `Error` with `.status` and `.details` on any failure.
 */
async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers as Record<string, string> | undefined),
      ...authHeaders(),
    },
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    const err = new Error(json.error || json.message || `Request failed: ${res.status}`) as Error & {
      status?: number;
      details?: unknown;
    };
    err.status = res.status;
    err.details = json.details;
    throw err;
  }
  return json.data as T;
}

/**
 * Typed REST API client. Centralizes fetch, auth header injection, and
 * error normalization so individual components remain free of boilerplate.
 *
 * Every method injects the HMAC-signed role token from localStorage via
 * `authHeaders()`. On a non-OK response or `success: false` body, each
 * method throws a typed `Error` with `.status` and `.details`.
 */
export const api = {
  /** Fetches the complete server-side stadium state snapshot. */
  getState: () => jsonFetch<SeedDatabase>('/api/state'),

  /**
   * Creates a new incident report via the Volunteer API endpoint.
   * Requires the `CREATE_INCIDENT` RBAC permission.
   *
   * @param body - The incident payload including description and optional photo.
   * @returns The created `Incident` record and the AI classification result.
   */
  createIncident: (body: {
    stadiumId: string;
    description: string;
    photoUrl?: string;
    incidentType: 'MEDICAL' | 'SECURITY' | 'MAINTENANCE' | 'CROWD_CONGESTION';
    location: { sector?: string; concourseLevel?: string; lat?: number; lng?: number };
  }) =>
    jsonFetch<{ incident: Incident; aiClassification: IncidentClassificationDTO }>('/api/incidents', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  /**
   * Sends a message to the AI copilot and retrieves a grounded response.
   * Works for FAN, VOLUNTEER, OPERATIONS, and EMERGENCY copilot types.
   *
   * @param body - The chat payload including copilot type, message, and optional chat history.
   * @returns A `FanCopilotResponseDTO` with the AI response and a suggested action.
   */
  chat: (body: {
    copilotType: 'FAN' | 'VOLUNTEER' | 'OPERATIONS' | 'EMERGENCY';
    message: string;
    stadiumId: string;
    language?: LanguageCode;
    history?: AIChatTurn[];
    userLocation?: string;
  }) => jsonFetch<FanCopilotResponseDTO>('/api/ai/chat', { method: 'POST', body: JSON.stringify(body) }),

  /**
   * Runs a What-If operational simulation through the GLM reasoning engine.
   * Requires the `RUN_WHAT_IF` RBAC permission.
   *
   * @param body - The scenario descriptor including intervention type and target.
   * @returns A `WhatIfResultDTO` with projected metrics and recommended actions.
   */
  runWhatIf: (body: WhatIfScenarioDTO) =>
    jsonFetch<WhatIfResultDTO>('/api/ai/what-if', { method: 'POST', body: JSON.stringify(body) }),

  /** Retrieves the AI-generated executive operations summary markdown report. */
  getOperationsSummary: () => jsonFetch<OperationsSummaryDTO>('/api/ai/operations-summary'),

  /**
   * Triggers a demo simulation act (1–8) in the Admin Command Center.
   * Requires the `RUN_SIMULATION` or `TRIGGER_EMERGENCY` RBAC permission.
   *
   * @param act - The simulation act number (1-indexed).
   * @returns A summary of the triggered act including optional markdown and engine info.
   */
  triggerAct: (act: number) =>
    jsonFetch<{ act: number; message: string; markdownSummary?: string; engine?: 'gemini' | 'simulated' }>(
      '/api/simulation/trigger',
      { method: 'POST', body: JSON.stringify({ act }) }
    ),

  /**
   * Triggers the deterministic gate evacuation override protocol.
   * Requires the `TRIGGER_EVACUATION` RBAC permission (SECURITY/ADMIN only).
   * This call intentionally bypasses GLM — the override is hardcoded for
   * zero-latency, zero-hallucination life-safety guarantees.
   *
   * @param gateId - The gate identifier to lock into EMERGENCY_EXIT_ONLY mode.
   * @returns Confirmation of the override status.
   */
  triggerGateOverride: (gateId: string) =>
    jsonFetch<{ gateId: string; overrideActive: boolean }>('/api/security/override', {
      method: 'POST',
      body: JSON.stringify({ gateId }),
    }),

  /**
   * Dispatches a multilingual emergency broadcast to the specified sectors.
   * Requires the `BROADCAST_EMERGENCY` RBAC permission (SECURITY/ADMIN only).
   *
   * @param body - The English summary, target sector IDs, and priority level.
   * @returns The created `Announcement` record with all 8 language translations.
   */
  broadcastEmergency: (body: { summaryEn: string; targetSectors: string[]; priority: 'HIGH' | 'URGENT' }) =>
    jsonFetch<Announcement>('/api/security/broadcast', { method: 'POST', body: JSON.stringify(body) }),

  /**
   * Updates the status or checklist of a volunteer shift task.
   * Requires the `UPDATE_TASK` RBAC permission.
   *
   * @param taskId - The unique task identifier.
   * @param body - Partial update: new status, updated checklist items, or both.
   * @returns The updated `Task` record.
   */
  updateTask: (taskId: string, body: { status?: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED'; checklist?: Task['checklist'] }) =>
    jsonFetch<Task>(`/api/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(body) }),
};

export type {
  SeedDatabase,
  Incident,
  IncidentClassificationDTO,
  Gate,
  CrowdMetric,
  Task,
  Announcement,
  Analytics,
  AuditLog,
  FanCopilotResponseDTO,
  WhatIfScenarioDTO,
  WhatIfResultDTO,
  OperationsSummaryDTO,
  AIChatTurn,
  LanguageCode,
};
