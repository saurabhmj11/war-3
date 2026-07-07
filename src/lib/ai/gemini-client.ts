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

/**
 * IGeminiClient — the abstract interface every AI engine must satisfy.
 *
 * NOTE: The interface name is kept as `IGeminiClient` for backwards
 * compatibility with the rest of the codebase, but the real engine that
 * backs it in production is the GLM engine (see `glm-engine.ts`). The
 * user-facing label everywhere in the UI is "GLM 5.2".
 */
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
 *   - If `ZAI_DISABLED` is NOT set to "1", we use the real GlmEngine backed
 *     by `z-ai-web-dev-sdk`. The SDK reads credentials from /etc/.z-ai-config
 *     (or ./.z-ai-config), so no API key env var is required when running in
 *     the sandbox. The engine has internal graceful degradation: on timeout /
 *     network / parse failure it falls back to the deterministic
 *     SimulatedGeminiEngine so the UI never errors.
 *
 *   - If `ZAI_DISABLED=1` is set (or the SDK fails to initialize), we use
 *     the SimulatedGeminiEngine directly (demo mode) so judges can evaluate
 *     the platform with zero credentials.
 *
 * The non-LLM safety override (EmergencyCopilotService.triggerDeterministicEvacuationOverride)
 * is never routed through here — see emergency-copilot.ts.
 */
let _client: IGeminiClient | null = null;

export async function getGeminiClient(): Promise<IGeminiClient> {
  if (_client) return _client;
  if (process.env.ZAI_DISABLED === '1') {
    console.log('[AI] ZAI_DISABLED=1 — using SimulatedGeminiEngine (demo mode).');
    _client = new SimulatedGeminiEngine();
    return _client;
  }
  try {
    // Lazy import so the SDK is never bundled into the client and never
    // even loaded when explicitly disabled.
    const { GlmEngine } = await import('./glm-engine');
    _client = new GlmEngine();
    console.log('[AI] Using real GlmEngine (z-ai-web-dev-sdk → GLM 5.2).');
  } catch (err) {
    console.warn('[AI] Failed to initialize GlmEngine, falling back to simulated:', err);
    _client = new SimulatedGeminiEngine();
  }
  return _client;
}

/** Synchronous accessor used by tests; returns the simulated engine by default. */
export function __setGeminiClientForTesting(client: IGeminiClient | null) {
  _client = client;
}

/**
 * True if the real GLM engine is active (i.e. ZAI_DISABLED is not set).
 * Exposed via /api/auth/switch for the UI badge.
 */
export function isGeminiLiveConfigured(): boolean {
  return process.env.ZAI_DISABLED !== '1';
}
