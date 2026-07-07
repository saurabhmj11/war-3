import { describe, it, expect, vi, beforeEach } from 'vitest';

// Stub server-only so we can import the engine in tests.
vi.mock('server-only', () => ({}));

import { SimulatedGeminiEngine } from '@/lib/ai/simulated-engine';

describe('SimulatedGeminiEngine', () => {
  let engine: SimulatedGeminiEngine;

  beforeEach(() => {
    engine = new SimulatedGeminiEngine();
  });

  describe('generateFanResponse', () => {
    it('recommends Gate D when the fan asks about gate wait times', async () => {
      const r = await engine.generateFanResponse('Which gate is fastest right now?', 'en');
      expect(r.engine).toBe('simulated');
      expect(r.responseText).toMatch(/Gate D/i);
      expect(r.suggestedAction?.targetId).toBe('gate-d');
      expect(r.estimatedWaitMinutes).toBeGreaterThanOrEqual(0);
    });

    it('responds in Spanish when the fan writes in Spanish', async () => {
      const r = await engine.generateFanResponse('¿Cuánto tiempo de espera en la Puerta C?', 'es');
      expect(r.translatedLanguage).toBe('es');
      expect(r.responseText).toMatch(/Puerta/);
    });

    it('recommends Taco Fiesta for vegetarian food queries', async () => {
      const r = await engine.generateFanResponse('Where can I find vegetarian tacos?', 'en');
      expect(r.responseText).toMatch(/Taco Fiesta/);
      expect(r.suggestedAction?.targetId).toBe('food-taco-fiesta');
    });

    it('returns step-free routing info for accessibility queries', async () => {
      const r = await engine.generateFanResponse('I need a step-free elevator route', 'en');
      expect(r.responseText).toMatch(/step-free/i);
      expect(r.suggestedAction?.targetId).toBe('gate-d');
    });
  });

  describe('runWhatIfSimulation', () => {
    it('projects congestion reduction for gate-rerouting scenarios', async () => {
      const r = await engine.runWhatIfSimulation({
        stadiumId: 'metlife-ny-nj',
        interventionType: 'OPEN_AUXILIARY_GATE',
        targetGateId: 'gate-d',
        description: 'Redirect commuter rail surge from Gate C to Gate D',
      });
      expect(r.engine).toBe('simulated');
      expect(r.projectedCongestionReductionPct).toBeGreaterThan(0);
      expect(r.projectedCongestionReductionPct).toBeLessThanOrEqual(100);
      expect(r.newEstimatedWaitMinutes).toBeGreaterThan(0);
      expect(r.affectedSectors.length).toBeGreaterThan(0);
      expect(r.recommendedActions.length).toBeGreaterThan(0);
      expect(r.executiveSummary.length).toBeGreaterThan(0);
      expect(r.riskSeverityAfter).toBeGreaterThanOrEqual(1);
      expect(r.riskSeverityAfter).toBeLessThanOrEqual(10);
    });

    it('returns a generic projection for non-gate scenarios', async () => {
      const r = await engine.runWhatIfSimulation({
        stadiumId: 'metlife-ny-nj',
        interventionType: 'REASSIGN_STAFF',
        targetSector: '205',
        description: 'Reassign mobile scanners',
      });
      expect(r.affectedSectors).toContain('205');
    });
  });

  describe('classifyIncident', () => {
    it('classifies heat exhaustion as MEDICAL with high severity', async () => {
      const r = await engine.classifyIncident('Spectator collapsed with severe heat exhaustion and dizziness.');
      expect(r.incidentType).toBe('MEDICAL');
      expect(r.estimatedSeverity).toBeGreaterThanOrEqual(7);
      expect(r.requiredTeam).toBe('MEDICAL');
    });

    it('classifies crowd/turnstile congestion as CROWD_CONGESTION', async () => {
      const r = await engine.classifyIncident('Severe crowd bottleneck at Gate C turnstiles');
      expect(r.incidentType).toBe('CROWD_CONGESTION');
      expect(r.requiredTeam).toBe('OPERATIONS');
    });

    it('classifies fight/bag reports as SECURITY', async () => {
      const r = await engine.classifyIncident('Unattended bag reported near South Plaza');
      expect(r.incidentType).toBe('SECURITY');
      expect(r.requiredTeam).toBe('SECURITY');
      expect(r.estimatedSeverity).toBeGreaterThanOrEqual(8);
    });

    it('classifies ambiguous text as MAINTENANCE', async () => {
      const r = await engine.classifyIncident('Spilled drink on concourse floor');
      expect(r.incidentType).toBe('MAINTENANCE');
    });

    it('falls back to MEDICAL when a photo URL is provided even with vague text', async () => {
      const r = await engine.classifyIncident('Something happening here', 'https://example.com/photo.jpg');
      expect(r.incidentType).toBe('MEDICAL');
    });
  });

  describe('generateEmergencyBroadcast', () => {
    it('produces translations in all 8 World Cup languages', async () => {
      const r = await engine.generateEmergencyBroadcast('Clear the concourse immediately', ['110', '112']);
      expect(r.engine).toBe('simulated');
      const codes = Object.keys(r.translations);
      expect(codes.sort()).toEqual(['ar', 'de', 'en', 'es', 'fr', 'hi', 'ja', 'pt']);
      // Each translation should mention the sectors
      expect(r.translations.en).toMatch(/Sectors 110, 112/);
    });
  });

  describe('generateOperationsSummary', () => {
    it('produces a markdown report with concrete numbers', async () => {
      const r = await engine.generateOperationsSummary();
      expect(r.engine).toBe('simulated');
      expect(r.markdown).toMatch(/Executive Operations Summary/);
      expect(r.markdown).toMatch(/MetLife Stadium/);
    });
  });
});
