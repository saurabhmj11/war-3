import 'server-only';
import { getGeminiClient } from './gemini-client';
import { IncidentClassificationDTO, Incident, Task } from '@/domain/types';
import { repository } from '@/lib/db/repository';

export class VolunteerCopilotService {
  /**
   * Analyzes an incident report (text description or photo URL) using Gemini
   * Vision/Text, classifies severity and type, and logs the incident in the
   * shared repository so all roles see it in real time.
   */
  public static async classifyAndReportIncident(
    description: string,
    photoUrl: string | undefined,
    actorUid: string,
    locationSector = '112'
  ): Promise<{ incident: Incident; aiClassification: IncidentClassificationDTO }> {
    // 1. Invoke Gemini multimodal classifier (real or fallback)
    const client = await getGeminiClient();
    const aiClassification = await client.classifyIncident(description, photoUrl);

    // 2. Create Incident record in shared repository
    const incident = await repository.createIncident({
      stadiumId: 'metlife-ny-nj',
      reportedByUid: actorUid,
      incidentType: aiClassification.incidentType,
      location: {
        sector: locationSector,
        concourseLevel: 'Lower Bowl',
        lat: 40.8135,
        lng: -74.0745,
      },
      description,
      photoUrl,
      severity: aiClassification.estimatedSeverity,
      assignedTeamId:
        aiClassification.requiredTeam === 'MEDICAL'
          ? 'med-team-beta'
          : aiClassification.requiredTeam === 'SECURITY'
          ? 'sec-perimeter-4'
          : 'ops-crowd-control-1',
      aiSummary: aiClassification.aiSummary,
    });

    // 3. Audit log
    await repository.logAudit(
      actorUid,
      'INCIDENT_CLASSIFIED',
      `Incident ${incident.incidentId}`,
      `Type=${aiClassification.incidentType}, Severity=${aiClassification.estimatedSeverity}, Team=${aiClassification.requiredTeam}, Engine=${aiClassification.engine}`
    );

    return { incident, aiClassification };
  }

  /**
   * Provides AI troubleshooting guidance for common volunteer shift tasks.
   */
  public static async getTaskGuidance(task: Task): Promise<string> {
    if (task.title.toLowerCase().includes('rerout') || task.title.toLowerCase().includes('gate')) {
      return `**AI Shift Guidance**: Position yourself at the main Concourse B fork. Use your digital wand to point towards Gate D (right walkway). Remind fans that Gate D has a step-free elevator and only a 5-minute wait!`;
    }
    return `**AI Shift Guidance**: Ensure all checklist items are completed in sequence. If you encounter non-compliant spectators, calmly request assistance from Perimeter Security via your radio channel 4.`;
  }
}
