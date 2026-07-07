import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { VertexAIGeminiEngine } from '@/lib/ai/vertex-engine';

vi.mock('server-only', () => ({}));

// Mock @google/genai with a controllable client.
const generateContentMock = vi.fn();
vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent: generateContentMock };
  },
  Type: {
    STRING: 'STRING',
    NUMBER: 'NUMBER',
    BOOLEAN: 'BOOLEAN',
    ARRAY: 'ARRAY',
    OBJECT: 'OBJECT',
    enum: () => ({ type: 'STRING' }),
  },
}));

describe('VertexAIGeminiEngine graceful fallback', () => {
  beforeEach(() => {
    generateContentMock.mockReset();
    // Ensure the engine reads an API key.
    process.env.GOOGLE_GENAI_API_KEY = 'test-key';
  });

  afterAll(() => {
    delete process.env.GOOGLE_GENAI_API_KEY;
  });

  it('returns a gemini-engine response when the SDK call succeeds', async () => {
    generateContentMock.mockResolvedValueOnce({
      text: JSON.stringify({
        responseText: 'Use Gate D — only 5 min wait, step-free.',
        suggestedActionType: 'NAVIGATE',
        suggestedActionTargetId: 'gate-d',
        suggestedActionLabel: 'Navigate to Gate D',
        estimatedWaitMinutes: 5,
      }),
    });
    const engine = new VertexAIGeminiEngine();
    const r = await engine.generateFanResponse('Which gate is fastest?', 'en');
    expect(r.engine).toBe('gemini');
    expect(r.responseText).toMatch(/Gate D/);
    expect(r.suggestedAction?.targetId).toBe('gate-d');
  });

  it('falls back to the simulated engine when the SDK throws', async () => {
    generateContentMock.mockRejectedValueOnce(new Error('Network down'));
    const engine = new VertexAIGeminiEngine();
    const r = await engine.generateFanResponse('Which gate is fastest?', 'en');
    // Fallback should still produce a sensible answer, but mark engine='simulated'
    expect(r.engine).toBe('simulated');
    expect(r.responseText.length).toBeGreaterThan(0);
  });

  it('falls back when the SDK returns malformed JSON', async () => {
    generateContentMock.mockResolvedValueOnce({ text: 'not-json{{{' });
    const engine = new VertexAIGeminiEngine();
    const r = await engine.classifyIncident('Heat exhaustion', undefined);
    expect(r.engine).toBe('simulated');
    expect(r.incidentType).toBe('MEDICAL');
  });

  it('falls back when the SDK call times out (mocked via rejection)', async () => {
    // Simulate a timeout by rejecting the call.
    generateContentMock.mockRejectedValueOnce(new Error('[Gemini] Timeout (fanResponse) after 3000ms'));
    const engine = new VertexAIGeminiEngine();
    const r = await engine.generateFanResponse('vegetarian tacos?', 'en');
    expect(r.engine).toBe('simulated');
    expect(r.responseText).toMatch(/Taco Fiesta/);
  });

  it('classifyIncident returns a structured DTO with all required fields', async () => {
    generateContentMock.mockResolvedValueOnce({
      text: JSON.stringify({
        incidentType: 'SECURITY',
        estimatedSeverity: 9,
        recommendedAction: 'Dispatch Perimeter Security Unit 4',
        requiredTeam: 'SECURITY',
        aiSummary: 'Priority 1 Security Anomaly',
      }),
    });
    const engine = new VertexAIGeminiEngine();
    const r = await engine.classifyIncident('Unattended bag near Gate B');
    expect(r.incidentType).toBe('SECURITY');
    expect(r.estimatedSeverity).toBe(9);
    expect(r.requiredTeam).toBe('SECURITY');
    expect(r.aiSummary).toMatch(/Security/);
    expect(r.engine).toBe('gemini');
  });

  it('runWhatIfSimulation clamps projected reduction to [0, 100]', async () => {
    generateContentMock.mockResolvedValueOnce({
      text: JSON.stringify({
        projectedCongestionReductionPct: 250, // out of range
        newEstimatedWaitMinutes: 14,
        affectedSectors: ['101'],
        recommendedActions: ['Open Gate D'],
        executiveSummary: 'Summary',
        riskSeverityAfter: 3,
      }),
    });
    const engine = new VertexAIGeminiEngine();
    const r = await engine.runWhatIfSimulation({
      stadiumId: 'metlife-ny-nj',
      interventionType: 'OPEN_AUXILIARY_GATE',
      description: 'Open Gate D',
    });
    expect(r.projectedCongestionReductionPct).toBe(100); // clamped
    expect(r.engine).toBe('gemini');
  });
});
