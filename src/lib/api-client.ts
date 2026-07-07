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

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { 'x-fifa-role': token } : {};
}

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

export const api = {
  // --- Auth ---
  // (handled inline in AuthProvider — kept here for completeness)
  // --- State ---
  getState: () => jsonFetch<SeedDatabase>('/api/state'),

  // --- Incidents ---
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

  // --- AI ---
  chat: (body: {
    copilotType: 'FAN' | 'VOLUNTEER' | 'OPERATIONS' | 'EMERGENCY';
    message: string;
    stadiumId: string;
    language?: LanguageCode;
    history?: AIChatTurn[];
    userLocation?: string;
  }) => jsonFetch<FanCopilotResponseDTO>('/api/ai/chat', { method: 'POST', body: JSON.stringify(body) }),

  runWhatIf: (body: WhatIfScenarioDTO) =>
    jsonFetch<WhatIfResultDTO>('/api/ai/what-if', { method: 'POST', body: JSON.stringify(body) }),

  getOperationsSummary: () => jsonFetch<OperationsSummaryDTO>('/api/ai/operations-summary'),

  // --- Simulation ---
  triggerAct: (act: number) =>
    jsonFetch<{ act: number; message: string; markdownSummary?: string; engine?: 'gemini' | 'simulated' }>(
      '/api/simulation/trigger',
      { method: 'POST', body: JSON.stringify({ act }) }
    ),

  // --- Security ---
  triggerGateOverride: (gateId: string) =>
    jsonFetch<{ gateId: string; overrideActive: boolean }>('/api/security/override', {
      method: 'POST',
      body: JSON.stringify({ gateId }),
    }),

  broadcastEmergency: (body: { summaryEn: string; targetSectors: string[]; priority: 'HIGH' | 'URGENT' }) =>
    jsonFetch<Announcement>('/api/security/broadcast', { method: 'POST', body: JSON.stringify(body) }),

  // --- Tasks ---
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
