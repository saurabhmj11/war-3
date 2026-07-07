import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { GlmEngine } from '@/lib/ai/glm-engine';

vi.mock('server-only', () => ({}));

// Mock z-ai-web-dev-sdk with a controllable ZAI client.
const createMock = vi.fn();
const chatCreateMock = vi.fn();
const visionCreateMock = vi.fn();
vi.mock('z-ai-web-dev-sdk', () => ({
  default: class ZAIMock {
    static async create() {
      createMock();
      return new ZAIMock();
    }
    chat = {
      completions: {
        create: chatCreateMock,
        createVision: visionCreateMock,
      },
    };
  },
}));

describe('GlmEngine graceful fallback', () => {
  beforeEach(() => {
    chatCreateMock.mockReset();
    visionCreateMock.mockReset();
    createMock.mockReset();
    // Ensure the engine is enabled (not disabled via env).
    delete process.env.ZAI_DISABLED;
  });

  afterAll(() => {
    delete process.env.ZAI_DISABLED;
  });

  it('returns a gemini-engine response when the SDK call succeeds', async () => {
    chatCreateMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              responseText: 'Use Gate D — only 5 min wait, step-free.',
              suggestedActionType: 'NAVIGATE',
              suggestedActionTargetId: 'gate-d',
              suggestedActionLabel: 'Navigate to Gate D',
              estimatedWaitMinutes: 5,
            }),
          },
        },
      ],
    });
    const engine = new GlmEngine();
    const r = await engine.generateFanResponse('Which gate is fastest?', 'en');
    expect(r.engine).toBe('gemini');
    expect(r.responseText).toMatch(/Gate D/);
    expect(r.suggestedAction?.targetId).toBe('gate-d');
  });

  it('falls back to the simulated engine when the SDK throws', async () => {
    chatCreateMock.mockRejectedValueOnce(new Error('Network down'));
    const engine = new GlmEngine();
    const r = await engine.generateFanResponse('Which gate is fastest?', 'en');
    // Fallback should still produce a sensible answer, but mark engine='simulated'
    expect(r.engine).toBe('simulated');
    expect(r.responseText.length).toBeGreaterThan(0);
  });

  it('falls back when the SDK returns malformed JSON', async () => {
    chatCreateMock.mockResolvedValueOnce({
      choices: [{ message: { content: 'not-json{{{' } }],
    });
    const engine = new GlmEngine();
    const r = await engine.classifyIncident('Heat exhaustion', undefined);
    expect(r.engine).toBe('simulated');
    expect(r.incidentType).toBe('MEDICAL');
  });

  it('falls back when the SDK call times out (mocked via rejection)', async () => {
    // Simulate a timeout by rejecting the call.
    chatCreateMock.mockRejectedValueOnce(new Error('[GLM] Timeout (fanResponse) after 5000ms'));
    const engine = new GlmEngine();
    const r = await engine.generateFanResponse('vegetarian tacos?', 'en');
    expect(r.engine).toBe('simulated');
    expect(r.responseText).toMatch(/Taco Fiesta/);
  });

  it('parses JSON from a fenced ```json code block', async () => {
    chatCreateMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content:
              'Here is the classification:\n```json\n{"incidentType":"SECURITY","estimatedSeverity":9,"recommendedAction":"Dispatch Perimeter Unit 4","requiredTeam":"SECURITY","aiSummary":"Priority 1 Security Anomaly"}\n```',
          },
        },
      ],
    });
    const engine = new GlmEngine();
    const r = await engine.classifyIncident('Unattended bag near South Plaza');
    expect(r.incidentType).toBe('SECURITY');
    expect(r.estimatedSeverity).toBe(9);
    expect(r.requiredTeam).toBe('SECURITY');
    expect(r.engine).toBe('gemini');
  });

  it('runs multimodal classification through createVision when a photo is provided', async () => {
    visionCreateMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              incidentType: 'MEDICAL',
              estimatedSeverity: 8,
              recommendedAction: 'Dispatch Medical Team Beta',
              requiredTeam: 'MEDICAL',
              aiSummary: 'Heat exhaustion detected',
            }),
          },
        },
      ],
    });
    const engine = new GlmEngine();
    const r = await engine.classifyIncident('Spectator collapsed', 'https://example.com/photo.jpg');
    expect(visionCreateMock).toHaveBeenCalledTimes(1);
    expect(chatCreateMock).not.toHaveBeenCalled();
    expect(r.incidentType).toBe('MEDICAL');
    expect(r.engine).toBe('gemini');
  });

  it('runWhatIfSimulation clamps projected reduction to [0, 100]', async () => {
    chatCreateMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              projectedCongestionReductionPct: 250, // out of range
              newEstimatedWaitMinutes: 14,
              affectedSectors: ['101'],
              recommendedActions: ['Open Gate D'],
              executiveSummary: 'Summary',
              riskSeverityAfter: 3,
            }),
          },
        },
      ],
    });
    const engine = new GlmEngine();
    const r = await engine.runWhatIfSimulation({
      stadiumId: 'metlife-ny-nj',
      interventionType: 'OPEN_AUXILIARY_GATE',
      description: 'Open Gate D',
    });
    expect(r.projectedCongestionReductionPct).toBe(100); // clamped
    expect(r.engine).toBe('gemini');
  });

  it('generateEmergencyBroadcast produces all 8 language keys', async () => {
    chatCreateMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              en: 'Attention spectators. Clear the concourse.',
              es: 'Atención espectadores. Despejen el pasillo.',
              fr: 'Attention spectateurs. Dégagez le couloir.',
              pt: 'Atenção espectadores. Limpe o corredor.',
              ar: 'تنبيه للجماهير. أخلوا الممر.',
              ja: '観客の皆様、通路を空けてください。',
              hi: 'दर्शकगण ध्यान दें। रास्ता खाली करें।',
              de: 'Achtung Zuschauer. Räumen Sie den Gang.',
            }),
          },
        },
      ],
    });
    const engine = new GlmEngine();
    const r = await engine.generateEmergencyBroadcast('Clear the concourse', ['110', '112']);
    const codes = Object.keys(r.translations).sort();
    expect(codes).toEqual(['ar', 'de', 'en', 'es', 'fr', 'hi', 'ja', 'pt']);
    expect(r.engine).toBe('gemini');
  });
});
