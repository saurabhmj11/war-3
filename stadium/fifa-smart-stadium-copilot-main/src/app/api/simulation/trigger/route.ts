import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';
import { eventBus } from '@/lib/events/event-bus';
import { OperationsCopilotService } from '@/lib/ai/ops-copilot';
import { VolunteerCopilotService } from '@/lib/ai/volunteer-copilot';
import { EmergencyCopilotService } from '@/lib/ai/emergency-copilot';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const act = Number(body.act) || 1;

    console.log(`[Demo Command Center] Executing Narrative Act ${act}...`);

    switch (act) {
      case 1: // Act 1: 70,000 Spectators Arrive
        repository.resetToSeedState();
        await repository.updateGateStatus('gate-c', 'OPEN', 18);
        await repository.updateCrowdMetric('Gate C Plaza', 55, 'GREEN', 'Normal steady ingress.');
        break;

      case 2: // Act 2: Gate C Congestion Spike
        await repository.updateGateStatus('gate-c', 'CONGESTED', 42);
        await repository.updateCrowdMetric(
          'Gate C Plaza',
          88,
          'RED',
          'Turnstile velocity surge (340/min) from 3 NJ Transit commuter trains.'
        );
        // Trigger Pub/Sub Eventarc event
        await eventBus.publish('stadium.gate.congested', { gateId: 'gate-c', waitMinutes: 42 });
        break;

      case 3: // Act 3: AI Risk Prediction Alert
        await repository.updateCrowdMetric(
          'Gate C Plaza',
          91,
          'CRITICAL',
          'CRITICAL RISK: Gridlock expected within 15 mins. Open Gate D auxiliary turnstiles immediately.'
        );
        break;

      case 4: // Act 4: AI What-If Rerouting Recommendation
        const simResult = await OperationsCopilotService.runWhatIfSimulation({
          stadiumId: 'metlife-ny-nj',
          interventionType: 'OPEN_AUXILIARY_GATE',
          targetGateId: 'gate-d',
          description: 'Redirect commuter rail ingress from Gate C to Gate D auxiliary plaza.',
        });
        await OperationsCopilotService.applySimulationResult(simResult);
        break;

      case 5: // Act 5: Automated Volunteer Dispatch
        await repository.createTask({
          stadiumId: 'metlife-ny-nj',
          assignedToVolunteerId: 'vol-881',
          title: 'URGENT: Direct Crowd Rerouting at Gate C Walkway Fork',
          description: 'Deploy digital signage wand immediately to redirect lower bowl spectators to Gate D.',
          priority: 'URGENT',
          checklist: [
            { item: 'Position at Concourse B main walkway fork', completed: true },
            { item: 'Direct Sectors 101-115 ticket holders to Gate D (3 min right)', completed: false },
          ],
        });
        break;

      case 6: // Act 6: Multilingual Fan Rerouting Push
        await repository.createAnnouncement({
          stadiumId: 'metlife-ny-nj',
          targetAudience: ['SECTORS_101_115', 'GATE_C_QUEUE'],
          priority: 'HIGH',
          translations: {
            en: 'To avoid Gate C commuter delays, please proceed to Gate D (3-minute walk right). Wait time is only 5 minutes!',
            es: 'Para evitar retrasos en la Puerta C, diríjase a la Puerta D (3 minutos a la derecha). ¡El tiempo de espera es de solo 5 minutos!',
            fr: 'Pour éviter les retards à la porte C, veuillez vous rendre à la porte D. Le temps d’attente n’est que de 5 minutes !',
            pt: 'Para evitar atrasos no Portão C, dirija-se ao Portão D. Tempo de espera de apenas 5 minutos!',
            ar: 'لتجنب التأخير في البوابة C، يرجى التوجه إلى البوابة D (مشيا 3 دقائق لليمين). وقت الانتظار 5 دقائق فقط!',
            ja: 'ゲートCの混雑を避け、右隣のゲートDへお進みください。待ち時間はわずか5分です！',
            hi: 'गेट C पर देरी से बचने के लिए, कृपया गेट D पर जाएं। प्रतीक्षा समय केवल 5 मिनट है!',
            de: 'Um Verzögerungen an Tor C zu vermeiden, gehen Sie bitte zu Tor D. Wartezeit nur 5 Minuten!',
          },
        });
        break;

      case 7: // Act 7: Medical Emergency at Sector 112
        await VolunteerCopilotService.classifyAndReportIncident(
          'Spectator collapsed experiencing severe heat exhaustion, dizziness, and dehydration in Sector 112 row 14.',
          'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=600',
          'usr_vol_1',
          '112'
        );
        break;

      case 8: // Act 8: Multilingual Emergency Coordination
        await EmergencyCopilotService.broadcastEmergencyAlert(
          'Medical evacuation in progress at Sector 112 concourse walkway. Please clear row 14 for stretcher access.',
          ['110', '112', '114'],
          'URGENT'
        );
        break;

      case 9: // Act 9: Executive Resolution Summary
        const markdownSummary = await OperationsCopilotService.generateExecutiveSummary();
        return NextResponse.json({
          success: true,
          data: {
            act,
            message: 'Act 9 completed: Executive Resolution Summary generated successfully.',
            markdownSummary,
          },
        }, { status: 200 });

      default:
        return NextResponse.json({ error: 'Invalid act number (must be 1-9)' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        act,
        message: `Narrative Act ${act} triggered successfully! Live stadium state, heatmaps, and AI feeds updated.`,
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error(`[API /api/simulation/trigger Error Act ${req.body}]`, error);
    return NextResponse.json(
      { error: 'Failed to execute demo storyline simulation act', details: error.message },
      { status: 500 }
    );
  }
}
