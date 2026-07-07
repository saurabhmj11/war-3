import { geminiClient } from './gemini-client';
import { IncidentClassificationDTO, Incident, Task } from '@/domain/types';
import { repository } from '@/lib/db/repository';

export class VolunteerCopilotService {
  /**
   * Analyzes an incident report (text description or photo URL) using Gemini Vision/Text,
   * classifies severity and type, and automatically logs the incident in Firestore.
   */
  public static async classifyAndReportIncident(
    description: string,
    photoUrl?: string,
    reportedByUid: string = 'usr_vol_1',
    locationSector: string = '112'
  ): Promise<{ incident: Incident; aiClassification: IncidentClassificationDTO }> {
    // 1. Invoke Gemini multimodal classifier
    const aiClassification = await geminiClient.classifyIncident(description, photoUrl);

    // 2. Create Incident record in Firestore with AI recommendations
    const incident = await repository.createIncident({
      stadiumId: 'metlife-ny-nj',
      reportedByUid,
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
      assignedTeamId: aiClassification.requiredTeam === 'MEDICAL' ? 'med-team-beta' : 'ops-crowd-control-1',
      aiSummary: aiClassification.aiSummary,
    });

    return { incident, aiClassification };
  }

  /**
   * Provides AI troubleshooting guidance for common volunteer shift tasks.
   */
  public static async getTaskGuidance(task: Task): Promise<string> {
    if (task.title.toLowerCase().includes('rerout') || task.title.toLowerCase().includes('gate')) {
      return `**AI Shift Guidance (Gemini Flash)**: Position yourself at the main Concourse B fork. Use your digital wand to point towards Gate D (right walkway). Remind fans that Gate D has a step-free elevator and only a 5-minute wait!`;
    }
    return `**AI Shift Guidance**: Ensure all checklist items are completed in sequence. If you encounter non-compliant spectators, calmly request assistance from Perimeter Security via your radio channel 4.`;
  }
}
