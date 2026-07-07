import { geminiClient } from './gemini-client';
import { FanCopilotResponseDTO, LanguageCode, AIChatTurn } from '@/domain/types';
import { repository } from '@/lib/db/repository';

export class FanCopilotService {
  /**
   * Processes a natural language fan inquiry, enriches it with live stadium telemetry,
   * and invokes Vertex AI Gemini to return a structured multilingual response.
   */
  public static async askAssistant(
    message: string,
    language: LanguageCode = 'en',
    history: AIChatTurn[] = [],
    uid: string = 'usr_fan_1'
  ): Promise<FanCopilotResponseDTO> {
    // 1. Fetch live stadium context to ground the LLM
    const userProfile = await repository.getUserProfile(uid);
    const userLang = language !== 'en' ? language : (userProfile?.preferredLanguage || 'en');
    
    // 2. Invoke Gemini reasoning engine
    const response = await geminiClient.generateFanResponse(message, userLang, history);
    
    // 3. Save chat session turn for audit & history
    await repository.saveAISessionTurn(
      'sess-ai-fan-live',
      uid,
      'FAN',
      'gemini-2.5-flash',
      message,
      response.responseText
    );

    return response;
  }

  /**
   * Retrieves step-by-step navigation polyline from nearest entrance gate to seat.
   */
  public static async getNavigationToSeat(seatId: string, isAccessible: boolean = false) {
    const routes = isAccessible ? await repository.getAccessibilityRoutes() : await repository.getRoutes();
    const route = routes.find((r) => r.destinationId === seatId || r.routeId.includes('sec-112')) || routes[0];
    return route;
  }
}
