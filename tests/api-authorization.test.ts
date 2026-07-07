import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Stub server-only so we can import the route handlers in tests.
vi.mock('server-only', () => ({}));

// Mock repository with an in-memory singleton.
const inMemory: Record<string, unknown[]> = {
  incidents: [],
  gates: [],
  crowdMetrics: [],
  tasks: [],
  announcements: [],
  auditLogs: [],
  aiSessions: [],
  users: [
    { uid: 'usr_fan_1', role: 'FAN', displayName: 'Fan' },
    { uid: 'usr_vol_1', role: 'VOLUNTEER', displayName: 'Elena' },
    { uid: 'usr_ops_1', role: 'OPERATIONS', displayName: 'Marcus' },
    { uid: 'usr_sec_1', role: 'SECURITY', displayName: 'Sarah' },
    { uid: 'usr_med_1', role: 'MEDICAL', displayName: 'Aris' },
    { uid: 'usr_admin_1', role: 'ADMIN', displayName: 'David' },
  ],
};

vi.mock('@/lib/db/repository', () => ({
  repository: {
    getIncidents: async () => [...inMemory.incidents],
    createIncident: async (data: any) => {
      const inc = { ...data, incidentId: `inc-${Date.now()}`, status: 'REPORTED', severity: data.severity ?? 5, createdAt: new Date().toISOString() };
      inMemory.incidents.unshift(inc);
      return inc;
    },
    getUserProfile: async (uid: string) => inMemory.users.find((u: any) => u.uid === uid) ?? null,
    getAllUsers: async () => [...inMemory.users],
    logAudit: async () => ({}),
    updateGateStatus: async () => ({}),
    updateCrowdMetric: async () => ({}),
    createTask: async () => ({}),
    createAnnouncement: async () => ({}),
    saveAISessionTurn: async () => ({}),
    snapshot: async () => inMemory,
    resetToSeedState: () => {
      /* noop */
    },
    subscribe: () => () => undefined,
  },
  CollectionName: {},
}));

// Mock the Gemini engine — we don't want real API calls during tests.
vi.mock('@/lib/ai/gemini-client', () => ({
  getGeminiClient: async () => ({
    engineName: 'simulated' as const,
    generateFanResponse: async () => ({ responseText: 'mock', translatedLanguage: 'en', engine: 'simulated' }),
    runWhatIfSimulation: async () => ({
      scenarioId: 'sim-test',
      projectedCongestionReductionPct: 30,
      newEstimatedWaitMinutes: 14,
      affectedSectors: ['101'],
      recommendedActions: ['Mock action'],
      executiveSummary: 'Mock summary',
      riskSeverityAfter: 3,
      engine: 'simulated' as const,
    }),
    classifyIncident: async () => ({
      incidentType: 'MEDICAL',
      estimatedSeverity: 8,
      recommendedAction: 'Mock',
      requiredTeam: 'MEDICAL',
      aiSummary: 'Mock',
      engine: 'simulated' as const,
    }),
    generateEmergencyBroadcast: async () => ({
      translations: { en: 'mock', es: 'mock', fr: 'mock', pt: 'mock', ar: 'mock', ja: 'mock', hi: 'mock', de: 'mock' },
      engine: 'simulated' as const,
    }),
    generateOperationsSummary: async () => ({ markdown: 'mock', engine: 'simulated' as const }),
  }),
  isGeminiLiveConfigured: () => false,
  geminiClient: {
    engineName: 'simulated' as const,
    generateFanResponse: async () => ({ responseText: 'mock', translatedLanguage: 'en', engine: 'simulated' }),
    runWhatIfSimulation: async () => ({
      scenarioId: 'sim-test',
      projectedCongestionReductionPct: 30,
      newEstimatedWaitMinutes: 14,
      affectedSectors: ['101'],
      recommendedActions: ['Mock action'],
      executiveSummary: 'Mock summary',
      riskSeverityAfter: 3,
      engine: 'simulated' as const,
    }),
    classifyIncident: async () => ({
      incidentType: 'MEDICAL',
      estimatedSeverity: 8,
      recommendedAction: 'Mock',
      requiredTeam: 'MEDICAL',
      aiSummary: 'Mock',
      engine: 'simulated' as const,
    }),
    generateEmergencyBroadcast: async () => ({
      translations: { en: 'mock', es: 'mock', fr: 'mock', pt: 'mock', ar: 'mock', ja: 'mock', hi: 'mock', de: 'mock' },
      engine: 'simulated' as const,
    }),
    generateOperationsSummary: async () => ({ markdown: 'mock', engine: 'simulated' as const }),
  },
  __setGeminiClientForTesting: () => undefined,
}));

import { issueRoleToken } from '@/lib/auth/session';
import { POST as incidentsPOST } from '@/app/api/incidents/route';
import { POST as whatifPOST } from '@/app/api/ai/what-if/route';
import { POST as triggerPOST } from '@/app/api/simulation/trigger/route';
import { POST as overridePOST } from '@/app/api/security/override/route';
import { POST as broadcastPOST } from '@/app/api/security/broadcast/route';

/** Maps each role to the actual uid of the seeded user with that role. */
const ROLE_UID: Record<string, string> = {
  FAN: 'usr_fan_1',
  VOLUNTEER: 'usr_vol_1',
  OPERATIONS: 'usr_ops_1',
  SECURITY: 'usr_sec_1',
  MEDICAL: 'usr_med_1',
  ADMIN: 'usr_admin_1',
};

function makeReq(url: string, role: string, body?: unknown): NextRequest {
  const token = issueRoleToken(ROLE_UID[role], role as any);
  return new NextRequest(`http://localhost${url}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-fifa-role': token,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('API route authorization', () => {
  beforeEach(() => {
    inMemory.incidents = [];
  });

  describe('POST /api/incidents', () => {
    const body = {
      stadiumId: 'metlife-ny-nj',
      description: 'Spectator heat exhaustion',
      incidentType: 'MAINTENANCE' as const,
      location: { sector: '112' },
    };

    it('rejects FAN with 403', async () => {
      const res = await incidentsPOST(makeReq('/api/incidents', 'FAN', body));
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe('Forbidden');
    });

    it('accepts VOLUNTEER', async () => {
      const res = await incidentsPOST(makeReq('/api/incidents', 'VOLUNTEER', body));
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.aiClassification.incidentType).toBe('MEDICAL');
    });

    it('accepts ADMIN (full access)', async () => {
      const res = await incidentsPOST(makeReq('/api/incidents', 'ADMIN', body));
      expect(res.status).toBe(201);
    });

    it('rejects SECURITY, MEDICAL, OPERATIONS (no CREATE_INCIDENT permission)', async () => {
      // These roles can READ/UPDATE incidents but only VOLUNTEER/ADMIN can create them.
      for (const role of ['SECURITY', 'MEDICAL', 'OPERATIONS']) {
        const res = await incidentsPOST(makeReq('/api/incidents', role, body));
        expect(res.status, `role ${role}`).toBe(403);
      }
    });

    it('rejects requests with no role token (anonymous)', async () => {
      const req = new NextRequest('http://localhost/api/incidents', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const res = await incidentsPOST(req);
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/ai/what-if', () => {
    const body = {
      stadiumId: 'metlife-ny-nj',
      interventionType: 'OPEN_AUXILIARY_GATE' as const,
      targetGateId: 'gate-d',
      description: 'Redirect commuter rail surge',
    };

    it('rejects FAN with 403', async () => {
      const res = await whatifPOST(makeReq('/api/ai/what-if', 'FAN', body));
      expect(res.status).toBe(403);
    });

    it('rejects VOLUNTEER with 403', async () => {
      const res = await whatifPOST(makeReq('/api/ai/what-if', 'VOLUNTEER', body));
      expect(res.status).toBe(403);
    });

    it('accepts OPERATIONS', async () => {
      const res = await whatifPOST(makeReq('/api/ai/what-if', 'OPERATIONS', body));
      expect(res.status).toBe(200);
    });

    it('accepts ADMIN', async () => {
      const res = await whatifPOST(makeReq('/api/ai/what-if', 'ADMIN', body));
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/simulation/trigger (act 8 — emergency)', () => {
    it('rejects OPERATIONS with 403 (act 8 requires SECURITY/ADMIN)', async () => {
      const res = await triggerPOST(makeReq('/api/simulation/trigger', 'OPERATIONS', { act: 8 }));
      expect(res.status).toBe(403);
    });

    it('accepts SECURITY', async () => {
      const res = await triggerPOST(makeReq('/api/simulation/trigger', 'SECURITY', { act: 8 }));
      expect(res.status).toBe(200);
    });

    it('accepts ADMIN', async () => {
      const res = await triggerPOST(makeReq('/api/simulation/trigger', 'ADMIN', { act: 8 }));
      expect(res.status).toBe(200);
    });

    it('rejects FAN for act 1 (RUN_WHAT_IF required)', async () => {
      const res = await triggerPOST(makeReq('/api/simulation/trigger', 'FAN', { act: 1 }));
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/security/override (deterministic evacuation)', () => {
    it('rejects FAN, VOLUNTEER, OPERATIONS, MEDICAL with 403', async () => {
      for (const role of ['FAN', 'VOLUNTEER', 'OPERATIONS', 'MEDICAL']) {
        const res = await overridePOST(makeReq('/api/security/override', role, { gateId: 'gate-c' }));
        expect(res.status, `role ${role}`).toBe(403);
      }
    });

    it('accepts SECURITY and ADMIN', async () => {
      for (const role of ['SECURITY', 'ADMIN']) {
        const res = await overridePOST(makeReq('/api/security/override', role, { gateId: 'gate-c' }));
        expect(res.status, `role ${role}`).toBe(200);
      }
    });
  });

  describe('POST /api/security/broadcast', () => {
    const body = {
      summaryEn: 'Test advisory message',
      targetSectors: ['110'],
      priority: 'HIGH' as const,
    };

    it('rejects FAN with 403', async () => {
      const res = await broadcastPOST(makeReq('/api/security/broadcast', 'FAN', body));
      expect(res.status).toBe(403);
    });

    it('accepts SECURITY', async () => {
      const res = await broadcastPOST(makeReq('/api/security/broadcast', 'SECURITY', body));
      expect(res.status).toBe(200);
    });
  });
});
