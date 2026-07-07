import 'server-only';
import { GoogleGenAI, Type } from '@google/genai';
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
const FLASH_MODEL = 'gemini-2.5-flash';
const PRO_MODEL = 'gemini-2.5-pro';

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
    const timer = setTimeout(() => reject(new Error(`[Gemini] Timeout (${label}) after ${ms}ms`)), ms);
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
 * VertexAIGeminiEngine — calls the real Google Gemini API via @google/genai.
 *
 * Implementation notes:
 * - Uses environment variable `GOOGLE_GENAI_API_KEY` (or `GEMINI_API_KEY`) for
 *   the developer-key auth flow, which works without GCP IAM setup.
 * - All five copilot operations build grounded prompts from live stadium
 *   state (gates, crowd metrics, incidents, parking) pulled from the
 *   repository so answers are not generic.
 * - Multimodal photo classification sends the actual photo URL to a Gemini
 *   Flash Vision call and parses a structured JSON response.
 * - On ANY failure (network, parse, timeout >3s), we gracefully fall back to
 *   the deterministic SimulatedGeminiEngine so the user never sees an error.
 */
export class VertexAIGeminiEngine implements IGeminiClient {
  public readonly engineName = 'gemini' as const;
  private client: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('VertexAIGeminiEngine requires GOOGLE_GENAI_API_KEY or GEMINI_API_KEY');
    }
    this.client = new GoogleGenAI({ apiKey });
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
      const prompt = `You are the FIFA Smart Stadium Copilot for MetLife Stadium during the FIFA World Cup 2026. You help FANS with navigation, gate wait times, step-free accessible routing, and finding food/restrooms.

${context}

Conversation so far:
${historyBlock}

Respond in ${langName}. Be concise, friendly, and grounded in the live telemetry above. If the fan asks about a gate, recommend the FASTEST gate from the data. If they need step-free access, prefer Gate D which has ELEVATOR_NORTH_1. Mention concrete wait-time numbers from the data.`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          responseText: { type: Type.STRING, description: 'Concise reply to the fan in the requested language.' },
          suggestedActionType: { type: Type.STRING, enum: ['NAVIGATE', 'VIEW_WAIT_TIME', 'REPORT_ISSUE'] },
          suggestedActionTargetId: { type: Type.STRING },
          suggestedActionLabel: { type: Type.STRING },
          navigationPolyline: { type: Type.STRING, description: 'Optional "lat,lng|lat,lng" polyline string.' },
          estimatedWaitMinutes: { type: Type.NUMBER },
        },
        required: ['responseText'],
      };

      const result = await withTimeout(
        this.client.models.generateContent({
          model: FLASH_MODEL,
          contents: prompt,
          config: {
            temperature: 0.4,
            responseMimeType: 'application/json',
            responseSchema,
          },
        }),
        3000,
        'fanResponse'
      );

      const text = result.text ?? '';
      const parsed = JSON.parse(text);
      return {
        responseText: String(parsed.responseText ?? ''),
        suggestedAction:
          parsed.suggestedActionType || parsed.suggestedActionLabel
            ? {
                type: (parsed.suggestedActionType as 'NAVIGATE' | 'VIEW_WAIT_TIME' | 'REPORT_ISSUE') ?? 'VIEW_WAIT_TIME',
                targetId: parsed.suggestedActionTargetId,
                label: parsed.suggestedActionLabel ?? 'View details',
              }
            : undefined,
        navigationPolyline: parsed.navigationPolyline,
        estimatedWaitMinutes: typeof parsed.estimatedWaitMinutes === 'number' ? parsed.estimatedWaitMinutes : undefined,
        translatedLanguage: language,
        engine: 'gemini',
      };
    } catch (err) {
      console.warn('[VertexAIGeminiEngine.generateFanResponse] Falling back to simulated engine:', err);
      const fb = await FALLBACK.generateFanResponse(message, language, history, _userLocation);
      return { ...fb, engine: 'simulated' };
    }
  }

  // ---------- 2. WHAT-IF SIMULATION ----------
  public async runWhatIfSimulation(scenario: WhatIfScenarioDTO): Promise<WhatIfResultDTO> {
    try {
      const context = await this.buildStadiumContext();
      const prompt = `You are the Operations What-If Simulation Engine for MetLife Stadium. Reason carefully across the live telemetry below to project the impact of the proposed operational intervention.

${context}

PROPOSED INTERVENTION:
- Type: ${scenario.interventionType}
- Target gate: ${scenario.targetGateId ?? 'n/a'}
- Target sector: ${scenario.targetSector ?? 'n/a'}
- Description: ${scenario.description}

Return a structured JSON projection. Be specific and grounded in the data (e.g., if Gate C is at 42 min, project how that drops when load shifts to Gate D).`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          projectedCongestionReductionPct: { type: Type.NUMBER, description: '0-100, projected % reduction' },
          newEstimatedWaitMinutes: { type: Type.NUMBER },
          affectedSectors: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendedActions: { type: Type.ARRAY, items: { type: Type.STRING } },
          executiveSummary: { type: Type.STRING, description: 'Concise markdown paragraph for command center.' },
          riskSeverityAfter: { type: Type.NUMBER, description: '1 (low) - 10 (critical)' },
        },
        required: ['projectedCongestionReductionPct', 'newEstimatedWaitMinutes', 'affectedSectors', 'recommendedActions', 'executiveSummary', 'riskSeverityAfter'],
      };

      const result = await withTimeout(
        this.client.models.generateContent({
          model: PRO_MODEL,
          contents: prompt,
          config: {
            temperature: 0.3,
            responseMimeType: 'application/json',
            responseSchema,
          },
        }),
        6000,
        'whatIf'
      );

      const parsed = JSON.parse(result.text ?? '{}');
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
      console.warn('[VertexAIGeminiEngine.runWhatIfSimulation] Falling back:', err);
      const fb = await FALLBACK.runWhatIfSimulation(scenario);
      return { ...fb, engine: 'simulated' };
    }
  }

  // ---------- 3. INCIDENT CLASSIFICATION (multimodal) ----------
  public async classifyIncident(description: string, photoUrl?: string): Promise<IncidentClassificationDTO> {
    try {
      const context = await this.buildStadiumContext();
      const prompt = `You are the Volunteer Incident Triage AI for MetLife Stadium. Analyze the following incident report and (if provided) the attached photo, then return a structured JSON classification.

${context}

INCIDENT DESCRIPTION: ${description}
${photoUrl ? `PHOTO URL: ${photoUrl}` : '(no photo attached)'}

Classification rules:
- incidentType: one of MEDICAL | SECURITY | MAINTENANCE | CROWD_CONGESTION
- estimatedSeverity: 1 (routine) - 10 (critical)
- requiredTeam: SECURITY | MEDICAL | OPERATIONS
- If photo shows a person on the ground / unconscious / injured, classify MEDICAL with severity >= 7.
- If photo shows a crowd / queue / bottleneck, classify CROWD_CONGESTION.
- If photo shows broken equipment or spills, classify MAINTENANCE.
- If photo shows a fight / unattended bag / threat, classify SECURITY with severity >= 8.`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          incidentType: { type: Type.STRING, enum: ['MEDICAL', 'SECURITY', 'MAINTENANCE', 'CROWD_CONGESTION'] },
          estimatedSeverity: { type: Type.NUMBER },
          recommendedAction: { type: Type.STRING },
          requiredTeam: { type: Type.STRING, enum: ['SECURITY', 'MEDICAL', 'OPERATIONS'] },
          aiSummary: { type: Type.STRING },
        },
        required: ['incidentType', 'estimatedSeverity', 'recommendedAction', 'requiredTeam', 'aiSummary'],
      };

      // Multimodal: include photo as inlineData if a URL is provided.
      const contents: any = photoUrl
        ? [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                fileData: { fileUri: photoUrl },
              },
            },
          ]
        : prompt;

      const result = await withTimeout(
        this.client.models.generateContent({
          model: FLASH_MODEL,
          contents,
          config: {
            temperature: 0.2,
            responseMimeType: 'application/json',
            responseSchema,
          },
        }),
        4000,
        'classifyIncident'
      );

      const parsed = JSON.parse(result.text ?? '{}');
      return {
        incidentType: (parsed.incidentType as IncidentType) ?? 'MAINTENANCE',
        estimatedSeverity: Math.max(1, Math.min(10, Number(parsed.estimatedSeverity ?? 5))),
        recommendedAction: String(parsed.recommendedAction ?? ''),
        requiredTeam: (parsed.requiredTeam as 'SECURITY' | 'MEDICAL' | 'OPERATIONS') ?? 'OPERATIONS',
        aiSummary: String(parsed.aiSummary ?? ''),
        engine: 'gemini',
      };
    } catch (err) {
      console.warn('[VertexAIGeminiEngine.classifyIncident] Falling back:', err);
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
      const prompt = `You are the Multilingual Emergency Broadcast AI for MetLife Stadium FIFA World Cup 2026. Translate the following English emergency directive into all 8 World Cup languages, keeping the tone calm, official, and concise. Each translation must be a single string (no markdown).

Original English directive:
"${incidentSummary}"

Target audience: ${sectorsStr}

Return a JSON object with keys "en", "es", "fr", "pt", "ar", "ja", "hi", "de". The "en" value should be a polished version of the original directive.`;

      const properties: Record<string, { type: typeof Type.STRING }> = {};
      for (const code of langCodes) properties[code] = { type: Type.STRING };
      const responseSchema = {
        type: Type.OBJECT,
        properties,
        required: langCodes,
      };

      const result = await withTimeout(
        this.client.models.generateContent({
          model: FLASH_MODEL,
          contents: prompt,
          config: {
            temperature: 0.2,
            responseMimeType: 'application/json',
            responseSchema,
          },
        }),
        5000,
        'emergencyBroadcast'
      );

      const parsed = JSON.parse(result.text ?? '{}');
      const translations: Partial<Record<LanguageCode, string>> = {};
      for (const code of langCodes) {
        translations[code] = String(parsed[code] ?? '');
      }
      return {
        translations: translations as Record<LanguageCode, string>,
        engine: 'gemini',
      };
    } catch (err) {
      console.warn('[VertexAIGeminiEngine.generateEmergencyBroadcast] Falling back:', err);
      const fb = await FALLBACK.generateEmergencyBroadcast(incidentSummary, targetSectors);
      return { ...fb, engine: 'simulated' };
    }
  }

  // ---------- 5. EXECUTIVE OPERATIONS SUMMARY ----------
  public async generateOperationsSummary(): Promise<OperationsSummaryDTO> {
    try {
      const context = await this.buildStadiumContext();
      const prompt = `You are the Executive Operations Summary AI for MetLife Stadium. Using ONLY the live telemetry below, generate a professional markdown executive report for FIFA match directors. Include: (1) overall venue status, (2) key operational highlights with concrete numbers, (3) active incidents & triage status, (4) sustainability metrics (concession waste, energy), (5) AI system performance, (6) a single recommendation for the next match hour. Keep it under 400 words.

${context}`;

      const result = await withTimeout(
        this.client.models.generateContent({
          model: PRO_MODEL,
          contents: prompt,
          config: { temperature: 0.4 },
        }),
        5000,
        'operationsSummary'
      );

      return {
        markdown: result.text ?? '',
        engine: 'gemini',
      };
    } catch (err) {
      console.warn('[VertexAIGeminiEngine.generateOperationsSummary] Falling back:', err);
      const fb = await FALLBACK.generateOperationsSummary();
      return { ...fb, engine: 'simulated' };
    }
  }
}
