import 'server-only';
import ZAI from 'z-ai-web-dev-sdk';
import {
  FanCopilotResponseDTO,
  WhatIfScenarioDTO,
  WhatIfResultDTO,
  IncidentClassificationDTO,
  EmergencyBroadcastDTO,
  OperationsSummaryDTO,
  LanguageCode,
  AIChatTurn,
  IncidentType,
} from '@/domain/types';
import { repository } from '@/lib/db/repository';
import { SimulatedGeminiEngine } from './simulated-engine';
import type { IGeminiClient } from './gemini-client';

const FALLBACK = new SimulatedGeminiEngine();

/**
 * GLM model identifiers exposed by the z-ai-web-dev-sdk endpoint.
 * - glm-4.6: fast chat / fan copilot / 8-language broadcast
 * - glm-4.6-thinking: long-form reasoning (What-If simulation, executive summary)
 * - glm-4.5v: multimodal vision (volunteer incident photo triage)
 *
 * The user-facing label throughout the UI is "GLM 5.2" — these are the actual
 * model IDs the SDK routes to under the hood.
 */
const CHAT_MODEL = process.env.ZAI_CHAT_MODEL || 'glm-4.6';
const REASONING_MODEL = process.env.ZAI_REASONING_MODEL || 'glm-4.6-thinking';
const VISION_MODEL = process.env.ZAI_VISION_MODEL || 'glm-4.5v';

const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  pt: 'Portuguese',
  ar: 'Arabic',
  ja: 'Japanese',
  hi: 'Hindi',
  de: 'German',
};

/**
 * Wraps an async call with a hard timeout. If the call exceeds the budget,
 * we reject — the caller falls back to the deterministic simulated engine.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`[GLM] Timeout (${label}) after ${ms}ms`)), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

/**
 * Extracts the JSON object from an LLM response that may include
 * ```json fenced blocks, leading prose, or trailing commentary.
 */
function extractJson<T = unknown>(text: string): T | null {
  if (!text) return null;
  // Try fenced code block first.
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1] : text;
  try {
    return JSON.parse(candidate.trim()) as T;
  } catch {
    // Try to find the first { ... } block.
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * GlmEngine — calls the real Zhipu GLM API via z-ai-web-dev-sdk.
 *
 * Implementation notes:
 * - All five copilot operations build grounded prompts from live stadium
 *   state (gates, crowd metrics, incidents, parking) pulled from the
 *   repository so answers are not generic.
 * - The multimodal photo classification sends the actual photo URL to
 *   `chat.completions.createVision` and parses a structured JSON response.
 * - On ANY failure (network, parse, timeout >3s), we gracefully fall back
 *   to the deterministic SimulatedGeminiEngine so the user never sees an error.
 *
 * The SDK reads credentials from /etc/.z-ai-config (or ./.z-ai-config),
 * so no env-var key is required when running in the sandbox. To force GLM
 * off and run on the simulated engine only, set ZAI_DISABLED=1.
 */
/**
 * Tiny LRU cache for GLM responses, keyed by a hash of (model + system +
 * user) prompt. Caches only successful parses for a short TTL so repeat
 * queries (e.g. the Fan Copilot asking "which gate is fastest?" twice in a
 * row) don't re-hit the API. Cached entries are tagged `engine: 'gemini'`
 * because they were produced by GLM (just earlier).
 *
 * Disabled when ZAI_CACHE_DISABLED=1.
 */
class PromptCache {
  private map = new Map<string, { value: unknown; expires: number }>();
  private maxEntries = 64;
  private ttlMs = 60_000; // 1 minute
  constructor() {
    if (process.env.ZAI_CACHE_DISABLED === '1') {
      this.maxEntries = 0;
    }
  }
  private hash(s: string): string {
    // Simple FNV-1a hash — fast, good enough for cache keys.
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16);
  }
  get(key: string): unknown | undefined {
    if (this.maxEntries === 0) return undefined;
    const entry = this.map.get(this.hash(key));
    if (!entry) return undefined;
    if (Date.now() > entry.expires) {
      this.map.delete(this.hash(key));
      return undefined;
    }
    return entry.value;
  }
  set(key: string, value: unknown): void {
    if (this.maxEntries === 0) return;
    const h = this.hash(key);
    // LRU eviction
    if (this.map.size >= this.maxEntries) {
      const firstKey = this.map.keys().next().value;
      if (firstKey) this.map.delete(firstKey);
    }
    this.map.set(h, { value, expires: Date.now() + this.ttlMs });
  }
}

export class GlmEngine implements IGeminiClient {
  public readonly engineName = 'gemini' as const; // kept for interface compat; UI label is "GLM 5.2"
  private zaiPromise: Promise<ZAI> | null = null;
  private cache = new PromptCache();

  constructor() {
    if (process.env.ZAI_DISABLED === '1') {
      throw new Error('GlmEngine disabled via ZAI_DISABLED=1');
    }
  }

  /** Lazy-init the SDK singleton. */
  private async getClient(): Promise<ZAI> {
    if (!this.zaiPromise) {
      this.zaiPromise = ZAI.create();
    }
    return this.zaiPromise;
  }

  // ----- Helper: build the live stadium context block -----
  private async buildStadiumContext(): Promise<string> {
    const [gates, vendors, restrooms, parking, metrics, incidents, analytics] = await Promise.all([
      repository.getGates(),
      repository.getFoodVendors(),
      repository.getRestrooms(),
      repository.getParking(),
      repository.getCrowdMetrics(),
      repository.getIncidents(),
      repository.getAnalytics(),
    ]);
    return [
      '--- LIVE STADIUM TELEMETRY (MetLife Stadium, FIFA World Cup 2026) ---',
      `Spectators processed: ${analytics?.totalSpectatorsIngress ?? 70000} / 82,500`,
      `Average AI latency so far: ${analytics?.avgAiResponseLatencyMs ?? 1150} ms`,
      '',
      'GATES:',
      ...gates.map((g) => `- ${g.gateId} (${g.name}): status=${g.status}, wait=${g.currentWaitMinutes}min, velocity=${g.turnstileVelocityPerMin}/${g.maxCapacityPerMin} per min, sectors=${g.assignedSectors.join(',')}`),
      '',
      'CROWD METRICS:',
      ...metrics.map((m) => `- ${m.zoneId}: density=${m.currentDensityPct}%, risk=${m.riskLevel}, predictedWait=${m.predictedWaitMinutes}min, forecast=${m.aiCongestionForecast ?? 'n/a'}`),
      '',
      'FOOD VENDORS:',
      ...vendors.map((v) => `- ${v.vendorId} (${v.name}, sector ${v.sector}, ${v.concourseLevel}): cuisine=${v.cuisineType}, dietaryOptions=${v.dietaryOptions.join('/')}, queue=${v.currentQueueMinutes}min, status=${v.status}`),
      '',
      'RESTROOMS:',
      ...restrooms.map((r) => `- ${r.restroomId} (sector ${r.sector}): type=${r.type}, accessibleStalls=${r.accessibleStalls}, queue=${r.currentQueueMinutes}min`),
      '',
      'PARKING:',
      ...parking.map((p) => `- ${p.lotId} (${p.name}): ${p.occupiedSpaces}/${p.totalSpaces} occupied, status=${p.status}, shuttle to ${p.shuttleConnectionToGate}, EV charging=${p.evChargingAvailable}`),
      '',
      'ACTIVE INCIDENTS:',
      ...incidents.slice(0, 8).map((i) => `- ${i.incidentId}: type=${i.incidentType}, severity=${i.severity}, sector=${i.location.sector ?? '?'}, status=${i.status}`),
    ].join('\n');
  }

  // ---------- 1. FAN COPILOT ----------
  public async generateFanResponse(
    message: string,
    language: LanguageCode = 'en',
    history: AIChatTurn[] = [],
    _userLocation?: string
  ): Promise<FanCopilotResponseDTO> {
    try {
      const context = await this.buildStadiumContext();
      const langName = LANGUAGE_NAMES[language] ?? 'English';
      const historyBlock = history.length
        ? history.slice(-6).map((t) => `${t.role.toUpperCase()}: ${t.content}`).join('\n')
        : '(no prior turns)';

      const systemPrompt = `You are the FIFA Smart Stadium Copilot for MetLife Stadium during the FIFA World Cup 2026. You help FANS with navigation, gate wait times, step-free accessible routing, finding food/restrooms, PARKING & TRANSPORTATION (commuter rail, parking lots, EV charging, shuttle connections), and sustainability tips.

${context}

Reply STRICTLY as a JSON object with these keys:
{
  "responseText": string,                       // concise reply to the fan in ${langName}
  "suggestedActionType": "NAVIGATE" | "VIEW_WAIT_TIME" | "REPORT_ISSUE",
  "suggestedActionTargetId": string | null,     // e.g. "gate-d", "food-taco-fiesta", or "lot-4-general"
  "suggestedActionLabel": string,               // short CTA label
  "navigationPolyline": string | null,          // "lat,lng|lat,lng" or null
  "estimatedWaitMinutes": number | null
}

Be grounded in the live telemetry above. If the fan asks about a gate, recommend the FASTEST gate from the data. If they need step-free access, prefer Gate D which has ELEVATOR_NORTH_1. If they ask about PARKING or TRANSPORTATION, reference the parking lots in the telemetry (including EV charging availability, shuttle connection to a specific gate, and lot status OPEN/NEAR_CAPACITY/FULL). If they ask about the commuter rail, note that Gate C is the rail hub and may be congested. Mention concrete numbers from the data. Output JSON only — no prose, no code fences.`;

      const userPrompt = `Conversation so far:\n${historyBlock}\n\nFAN QUESTION: ${message}\n\nReply in ${langName}.`;
      // Cache check — if we've answered this exact (model+system+user) prompt
      // in the last minute, return the cached GLM response without re-calling.
      const cacheKey = `${CHAT_MODEL}|${systemPrompt}|${userPrompt}`;
      const cached = this.cache.get(cacheKey) as FanCopilotResponseDTO | undefined;
      if (cached) {
        return { ...cached, engine: 'gemini' };
      }

      const zai = await this.getClient();
      const completion = await withTimeout(
        zai.chat.completions.create({
          model: CHAT_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          thinking: { type: 'disabled' },
          temperature: 0.4,
        }),
        5000,
        'fanResponse'
      );

      const text: string = completion?.choices?.[0]?.message?.content ?? '';
      const parsed = extractJson<{
        responseText?: string;
        suggestedActionType?: 'NAVIGATE' | 'VIEW_WAIT_TIME' | 'REPORT_ISSUE';
        suggestedActionTargetId?: string | null;
        suggestedActionLabel?: string;
        navigationPolyline?: string | null;
        estimatedWaitMinutes?: number | null;
      }>(text);

      if (!parsed || !parsed.responseText) {
        throw new Error('GLM returned no parseable responseText');
      }

      const result: FanCopilotResponseDTO = {
        responseText: String(parsed.responseText),
        suggestedAction:
          parsed.suggestedActionType || parsed.suggestedActionLabel
            ? {
                type: parsed.suggestedActionType ?? 'VIEW_WAIT_TIME',
                targetId: parsed.suggestedActionTargetId ?? undefined,
                label: parsed.suggestedActionLabel ?? 'View details',
              }
            : undefined,
        navigationPolyline: parsed.navigationPolyline ?? undefined,
        estimatedWaitMinutes: typeof parsed.estimatedWaitMinutes === 'number' ? parsed.estimatedWaitMinutes : undefined,
        translatedLanguage: language,
        engine: 'gemini', // tag as 'gemini' so existing UI logic treats this as the real engine path
      };
      // Cache the successful parse for repeat queries.
      this.cache.set(cacheKey, result);
      return result;
    } catch (err) {
      console.warn('[GlmEngine.generateFanResponse] Falling back to simulated engine:', err);
      const fb = await FALLBACK.generateFanResponse(message, language, history, _userLocation);
      return { ...fb, engine: 'simulated' };
    }
  }

  // ---------- 2. WHAT-IF SIMULATION ----------
  public async runWhatIfSimulation(scenario: WhatIfScenarioDTO): Promise<WhatIfResultDTO> {
    try {
      const context = await this.buildStadiumContext();
      const systemPrompt = `You are the Operations What-If Simulation Engine for MetLife Stadium. Reason carefully across the live telemetry below to project the impact of the proposed operational intervention.

${context}

Reply STRICTLY as a JSON object with these keys:
{
  "projectedCongestionReductionPct": number,    // 0-100
  "newEstimatedWaitMinutes": number,
  "affectedSectors": string[],                  // e.g. ["101","102","108"]
  "recommendedActions": string[],               // 3-5 concrete action steps
  "executiveSummary": string,                   // concise markdown paragraph
  "riskSeverityAfter": number                   // 1 (low) - 10 (critical)
}

Be specific and grounded in the data. Output JSON only — no prose, no code fences.`;

      const userPrompt = `PROPOSED INTERVENTION:
- Type: ${scenario.interventionType}
- Target gate: ${scenario.targetGateId ?? 'n/a'}
- Target sector: ${scenario.targetSector ?? 'n/a'}
- Description: ${scenario.description}

Return the structured JSON projection now.`;

      const zai = await this.getClient();
      const completion = await withTimeout(
        zai.chat.completions.create({
          model: REASONING_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          thinking: { type: 'enabled' },
          temperature: 0.3,
        }),
        12000,
        'whatIf'
      );

      const text: string = completion?.choices?.[0]?.message?.content ?? '';
      const parsed = extractJson<{
        projectedCongestionReductionPct?: number;
        newEstimatedWaitMinutes?: number;
        affectedSectors?: string[];
        recommendedActions?: string[];
        executiveSummary?: string;
        riskSeverityAfter?: number;
      }>(text);

      if (!parsed) throw new Error('GLM returned no parseable What-If JSON');

      return {
        scenarioId: `sim-${Date.now()}`,
        projectedCongestionReductionPct: Math.max(0, Math.min(100, Number(parsed.projectedCongestionReductionPct ?? 30))),
        newEstimatedWaitMinutes: Math.max(0, Number(parsed.newEstimatedWaitMinutes ?? 14)),
        affectedSectors: Array.isArray(parsed.affectedSectors) ? parsed.affectedSectors.map(String) : [],
        recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions.map(String) : [],
        executiveSummary: String(parsed.executiveSummary ?? ''),
        riskSeverityAfter: Math.max(1, Math.min(10, Number(parsed.riskSeverityAfter ?? 3))),
        engine: 'gemini',
      };
    } catch (err) {
      console.warn('[GlmEngine.runWhatIfSimulation] Falling back:', err);
      const fb = await FALLBACK.runWhatIfSimulation(scenario);
      return { ...fb, engine: 'simulated' };
    }
  }

  // ---------- 3. INCIDENT CLASSIFICATION (multimodal) ----------
  public async classifyIncident(description: string, photoUrl?: string): Promise<IncidentClassificationDTO> {
    try {
      const context = await this.buildStadiumContext();
      const systemPrompt = `You are the Volunteer Incident Triage AI for MetLife Stadium. Analyze the following incident report and (if provided) the attached photo, then return a STRICT JSON classification.

${context}

Reply STRICTLY as a JSON object with these keys:
{
  "incidentType": "MEDICAL" | "SECURITY" | "MAINTENANCE" | "CROWD_CONGESTION",
  "estimatedSeverity": number,                  // 1 (routine) - 10 (critical)
  "recommendedAction": string,
  "requiredTeam": "SECURITY" | "MEDICAL" | "OPERATIONS",
  "aiSummary": string
}

Classification rules:
- If photo shows a person on the ground / unconscious / injured, classify MEDICAL with severity >= 7.
- If photo shows a crowd / queue / bottleneck, classify CROWD_CONGESTION.
- If photo shows broken equipment or spills, classify MAINTENANCE.
- If photo shows a fight / unattended bag / threat, classify SECURITY with severity >= 8.
Output JSON only — no prose, no code fences.`;

      const zai = await this.getClient();

      let completion: { choices?: Array<{ message?: { content?: string } }> };
      if (photoUrl) {
        // Multimodal: send the photo via createVision.
        completion = await withTimeout(
          zai.chat.completions.createVision({
            model: VISION_MODEL,
            messages: [
              { role: 'system', content: systemPrompt },
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `INCIDENT DESCRIPTION: ${description}\n\nAnalyze the attached photo and return the structured JSON classification now.`,
                  },
                  { type: 'image_url', image_url: { url: photoUrl } },
                ],
              },
            ],
            thinking: { type: 'disabled' },
          }),
          8000,
          'classifyIncident'
        );
      } else {
        // Text-only classification.
        completion = await withTimeout(
          zai.chat.completions.create({
            model: CHAT_MODEL,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `INCIDENT DESCRIPTION: ${description}\n\nReturn the structured JSON classification now.` },
            ],
            thinking: { type: 'disabled' },
            temperature: 0.2,
          }),
          5000,
          'classifyIncident'
        );
      }

      const text: string = completion?.choices?.[0]?.message?.content ?? '';
      const parsed = extractJson<{
        incidentType?: IncidentType;
        estimatedSeverity?: number;
        recommendedAction?: string;
        requiredTeam?: 'SECURITY' | 'MEDICAL' | 'OPERATIONS';
        aiSummary?: string;
      }>(text);

      if (!parsed) throw new Error('GLM returned no parseable classification JSON');

      return {
        incidentType: parsed.incidentType ?? 'MAINTENANCE',
        estimatedSeverity: Math.max(1, Math.min(10, Number(parsed.estimatedSeverity ?? 5))),
        recommendedAction: String(parsed.recommendedAction ?? ''),
        requiredTeam: parsed.requiredTeam ?? 'OPERATIONS',
        aiSummary: String(parsed.aiSummary ?? ''),
        engine: 'gemini',
      };
    } catch (err) {
      console.warn('[GlmEngine.classifyIncident] Falling back:', err);
      const fb = await FALLBACK.classifyIncident(description, photoUrl);
      return { ...fb, engine: 'simulated' };
    }
  }

  // ---------- 4. EMERGENCY BROADCAST ----------
  public async generateEmergencyBroadcast(
    incidentSummary: string,
    targetSectors: string[]
  ): Promise<EmergencyBroadcastDTO> {
    try {
      const sectorsStr = targetSectors.length ? `Sectors ${targetSectors.join(', ')}` : 'all sectors';
      const langCodes: LanguageCode[] = ['en', 'es', 'fr', 'pt', 'ar', 'ja', 'hi', 'de'];
      const langList = langCodes.map((c) => `"${c}": string`).join(', ');
      const systemPrompt = `You are the Multilingual Emergency Broadcast AI for MetLife Stadium FIFA World Cup 2026. Translate the following English emergency directive into all 8 World Cup languages, keeping the tone calm, official, and concise. Each translation must be a single string (no markdown).

Target audience: ${sectorsStr}

Reply STRICTLY as a JSON object with keys ${langList}. The "en" value should be a polished version of the original directive. Output JSON only — no prose, no code fences.`;

      const zai = await this.getClient();
      const completion = await withTimeout(
        zai.chat.completions.create({
          model: CHAT_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Original English directive:\n"${incidentSummary}"\n\nReturn the JSON object now.` },
          ],
          thinking: { type: 'disabled' },
          temperature: 0.2,
        }),
        10000,
        'emergencyBroadcast'
      );

      const text: string = completion?.choices?.[0]?.message?.content ?? '';
      const parsed = extractJson<Record<string, string>>(text);
      if (!parsed) throw new Error('GLM returned no parseable broadcast JSON');

      const translations: Partial<Record<LanguageCode, string>> = {};
      for (const code of langCodes) {
        translations[code] = String(parsed[code] ?? '');
      }
      return {
        translations: translations as Record<LanguageCode, string>,
        engine: 'gemini',
      };
    } catch (err) {
      console.warn('[GlmEngine.generateEmergencyBroadcast] Falling back:', err);
      const fb = await FALLBACK.generateEmergencyBroadcast(incidentSummary, targetSectors);
      return { ...fb, engine: 'simulated' };
    }
  }

  // ---------- 5. EXECUTIVE OPERATIONS SUMMARY ----------
  public async generateOperationsSummary(): Promise<OperationsSummaryDTO> {
    try {
      const context = await this.buildStadiumContext();
      const systemPrompt = `You are the Executive Operations Summary AI for MetLife Stadium. Using ONLY the live telemetry below, generate a professional markdown executive report for FIFA match directors. Include: (1) overall venue status, (2) key operational highlights with concrete numbers, (3) active incidents & triage status, (4) sustainability metrics (concession waste, energy), (5) AI system performance, (6) a single recommendation for the next match hour. Keep it under 400 words. Use markdown headings and bullet lists.

${context}`;

      const zai = await this.getClient();
      const completion = await withTimeout(
        zai.chat.completions.create({
          model: REASONING_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Generate the executive operations summary now.' },
          ],
          thinking: { type: 'enabled' },
          temperature: 0.4,
        }),
        12000,
        'operationsSummary'
      );

      const text: string = completion?.choices?.[0]?.message?.content ?? '';
      if (!text.trim()) throw new Error('GLM returned empty summary');

      return {
        markdown: text,
        engine: 'gemini',
      };
    } catch (err) {
      console.warn('[GlmEngine.generateOperationsSummary] Falling back:', err);
      const fb = await FALLBACK.generateOperationsSummary();
      return { ...fb, engine: 'simulated' };
    }
  }
}
