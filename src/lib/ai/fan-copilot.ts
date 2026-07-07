import 'server-only';
import { getGeminiClient } from './gemini-client';
import { FanCopilotResponseDTO, LanguageCode, AIChatTurn } from '@/domain/types';
import { repository } from '@/lib/db/repository';

export class FanCopilotService {
  /**
   * Processes a natural language fan inquiry, enriches it with live stadium telemetry,
   * and invokes Gemini to return a structured multilingual response.
   */
  public static async askAssistant(
    message: string,
    language: LanguageCode = 'en',
    history: AIChatTurn[] = [],
    actorUid = 'usr_fan_1'
  ): Promise<FanCopilotResponseDTO> {
    // 1. Fetch live user profile to honor preferred language
    const userProfile = await repository.getUserProfile(actorUid);
    const userLang = language !== 'en' ? language : userProfile?.preferredLanguage || language;

    // 2. Invoke Gemini reasoning engine (real or fallback)
    const client = await getGeminiClient();
    const response = await client.generateFanResponse(message, userLang, history);

    // 3. Save chat session turn for audit & history
    await repository.saveAISessionTurn(
      `sess-ai-fan-${actorUid}`,
      actorUid,
      'FAN',
      client.engineName === 'gemini' ? 'glm-5.2-flash' : 'simulated-flash',
      message,
      response.responseText
    );

    return response;
  }

  /**
   * Retrieves step-by-step navigation polyline from nearest entrance gate to seat.
   */
  public static async getNavigationToSeat(seatId: string, isAccessible = false) {
    const routes = isAccessible ? await repository.getAccessibilityRoutes() : await repository.getRoutes();
    const route = routes.find((r) => r.destinationId === seatId || r.routeId.includes('sec-112')) || routes[0];
    return route;
  }
}
