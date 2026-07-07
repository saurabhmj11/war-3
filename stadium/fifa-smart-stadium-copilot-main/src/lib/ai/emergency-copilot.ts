import { geminiClient } from './gemini-client';
import { LanguageCode, Announcement } from '@/domain/types';
import { repository } from '@/lib/db/repository';

export class EmergencyCopilotService {
  /**
   * Generates localized emergency broadcast scripts across all 8 World Cup languages
   * in < 10 seconds and immediately broadcasts them to targeted stadium sectors.
   */
  public static async broadcastEmergencyAlert(
    summaryEn: string,
    targetSectors: string[] = ['101', '102', '108', '110', '112', '114', '115'],
    priority: 'HIGH' | 'URGENT' = 'HIGH'
  ): Promise<Announcement> {
    // 1. Invoke Gemini Flash 8-language simultaneous translation & localization
    const translations = await geminiClient.generateEmergencyBroadcast(summaryEn, targetSectors);

    // 2. Create Announcement record in Firestore
    const announcement = await repository.createAnnouncement({
      stadiumId: 'metlife-ny-nj',
      targetAudience: targetSectors.map((s) => `SECTOR_${s}`),
      priority,
      translations,
    });

    // 3. Log audit
    await repository.logAudit(
      'usr_sec_1',
      'MULTILINGUAL_EMERGENCY_BROADCAST_DISPATCHED',
      `Sectors: ${targetSectors.join(', ')}`,
      `Broadcasted across 8 languages: English, Spanish, French, Portuguese, Arabic, Japanese, Hindi, German.`
    );

    return announcement;
  }

  /**
   * CRITICAL SAFETY REQUIREMENT:
   * Triggers deterministic, hardcoded gate override protocols during life-critical evacuations.
   * This method intentionally bypasses LLM generation to guarantee zero latency and zero hallucination.
   */
  public static async triggerDeterministicEvacuationOverride(gateId: string): Promise<boolean> {
    try {
      // Hardcoded deterministic override
      await repository.updateGateStatus(gateId, 'EMERGENCY_EXIT_ONLY', 0);
      
      await repository.logAudit(
        'usr_sec_1',
        'DETERMINISTIC_GATE_EVACUATION_OVERRIDE',
        `Gate ID: ${gateId}`,
        'CRITICAL SAFETY PROTOCOL: Gate locked open in EMERGENCY_EXIT_ONLY mode. LLM generation bypassed.'
      );

      return true;
    } catch (err) {
      console.error('Failed to execute deterministic gate override:', err);
      return false;
    }
  }
}
