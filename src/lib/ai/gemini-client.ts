import 'server-only';
import type {
  FanCopilotResponseDTO,
  WhatIfScenarioDTO,
  WhatIfResultDTO,
  IncidentClassificationDTO,
  EmergencyBroadcastDTO,
  OperationsSummaryDTO,
  LanguageCode,
  AIChatTurn,
} from '@/domain/types';
import { SimulatedGeminiEngine } from './simulated-engine';

export interface IGeminiClient {
  readonly engineName: 'gemini' | 'simulated';
  generateFanResponse(
    message: string,
    language: LanguageCode,
    history?: AIChatTurn[],
    userLocation?: string
  ): Promise<FanCopilotResponseDTO>;
  runWhatIfSimulation(scenario: WhatIfScenarioDTO): Promise<WhatIfResultDTO>;
  classifyIncident(description: string, photoUrl?: string): Promise<IncidentClassificationDTO>;
  generateEmergencyBroadcast(
    incidentSummary: string,
    targetSectors: string[]
  ): Promise<EmergencyBroadcastDTO>;
  generateOperationsSummary(): Promise<OperationsSummaryDTO>;
}

/**
 * Env-driven engine selection:
 *
 *   - If `GOOGLE_GENAI_API_KEY` (or `GEMINI_API_KEY`) is set, we use the real
 *     VertexAIGeminiEngine backed by @google/genai. The engine has internal
 *     graceful degradation: on timeout / network / parse failure it falls
 *     back to the deterministic SimulatedGeminiEngine so the UI never errors.
 *
 *   - Otherwise, we use the SimulatedGeminiEngine directly (default demo
 *     mode) so judges can evaluate the platform with zero credentials.
 *
 * The non-LLM safety override (EmergencyCopilotService.triggerDeterministicEvacuationOverride)
 * is never routed through here — see emergency-copilot.ts.
 */
let _client: IGeminiClient | null = null;

export async function getGeminiClient(): Promise<IGeminiClient> {
  if (_client) return _client;
  const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      // Lazy import so the @google/genai SDK is never bundled into the
      // client and never even loaded in pure-demo environments.
      const { VertexAIGeminiEngine } = await import('./vertex-engine');
      _client = new VertexAIGeminiEngine();
      console.log('[Gemini] Using real VertexAIGeminiEngine (apiKey present).');
    } catch (err) {
      console.warn('[Gemini] Failed to initialize VertexAIGeminiEngine, falling back to simulated:', err);
      _client = new SimulatedGeminiEngine();
    }
  } else {
    console.log('[Gemini] No GOOGLE_GENAI_API_KEY set — using SimulatedGeminiEngine (demo mode).');
    _client = new SimulatedGeminiEngine();
  }
  return _client;
}

/** Synchronous accessor used by tests; returns the simulated engine by default. */
export function __setGeminiClientForTesting(client: IGeminiClient | null) {
  _client = client;
}

/** True if a real Gemini API key is configured. Exposed via /api/auth/switch for the UI badge. */
export function isGeminiLiveConfigured(): boolean {
  return !!(process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY);
}

// Backwards-compatible direct export — uses the simulated engine eagerly so
// importing this module never throws when no API key is configured. Real
// callers should use `await getGeminiClient()` to get the env-driven instance.
export const geminiClient: IGeminiClient = new SimulatedGeminiEngine();
