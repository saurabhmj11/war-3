import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';
import { eventBus } from '@/lib/events/event-bus';
import { OperationsCopilotService } from '@/lib/ai/ops-copilot';
import { VolunteerCopilotService } from '@/lib/ai/volunteer-copilot';
import { EmergencyCopilotService } from '@/lib/ai/emergency-copilot';
import { requirePermission, getSessionFromRequest } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * POST /api/simulation/trigger  { act: 1..9 }
 *
 * Drives the 9-act narrative demo storyline. Each act mutates shared server
 * state which is then fanned out to every connected browser tab via /api/events
 * (SSE). Authorization is enforced: only OPERATIONS / SECURITY / ADMIN may
 * trigger narrative acts (security-sensitive ones require SECURITY or ADMIN).
 */
export async function POST(req: NextRequest) {
  try {
    // Act 8 (emergency broadcast) requires SECURITY or ADMIN.
    // All other acts require OPERATIONS (or ADMIN).
    let body: { act?: number };
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const act = Number(body.act) || 1;

    const requiredPermission = act === 8 ? 'TRIGGER_EVACUATION' : 'RUN_WHAT_IF';
    const auth = await requirePermission(req, requiredPermission);
    if (auth.response) return auth.response;
    const session = auth.session!;

    console.log(`[Demo Command Center] Act ${act} triggered by ${session.uid} (${session.role})`);

    switch (act) {
      case 1: // Reset to seed state, normal ingress
        repository.resetToSeedState();
        await repository.updateGateStatus('gate-c', 'OPEN', 18);
        await repository.updateCrowdMetric('Gate C Plaza', 55, 'GREEN', 'Normal steady ingress.');
        break;

      case 2: // Gate C congestion spike
        await repository.updateGateStatus('gate-c', 'CONGESTED', 42);
        await repository.updateCrowdMetric(
          'Gate C Plaza',
          88,
          'RED',
          'Turnstile velocity surge (340/min) from 3 NJ Transit commuter trains.'
        );
        await eventBus.publish('stadium.gate.congested', { gateId: 'gate-c', waitMinutes: 42 });
        break;

      case 3: // AI risk prediction alert
        await repository.updateCrowdMetric(
          'Gate C Plaza',
          91,
          'CRITICAL',
          'CRITICAL RISK: Gridlock expected within 15 mins. Open Gate D auxiliary turnstiles immediately.'
        );
        break;

      case 4: {
        // AI What-If rerouting recommendation, then apply
        const simResult = await OperationsCopilotService.runWhatIfSimulation(
          {
            stadiumId: 'metlife-ny-nj',
            interventionType: 'OPEN_AUXILIARY_GATE',
            targetGateId: 'gate-d',
            description: 'Redirect commuter rail ingress from Gate C to Gate D auxiliary plaza.',
          },
          session.uid
        );
        await OperationsCopilotService.applySimulationResult(simResult, session.uid);
        break;
      }

      case 5: // Automated volunteer dispatch
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

      case 6: // Multilingual fan rerouting push (uses real GLM for translation when key is set)
        await EmergencyCopilotService.broadcastEmergencyAlert(
          'To avoid Gate C commuter delays, please proceed to Gate D (3-minute walk right). Wait time is only 5 minutes!',
          ['101', '102', '108', '110', '112', '114', '115'],
          'HIGH',
          session.uid
        );
        break;

      case 7: // Medical emergency at Sector 112 (GLM Vision photo classification)
        await VolunteerCopilotService.classifyAndReportIncident(
          'Spectator collapsed experiencing severe heat exhaustion, dizziness, and dehydration in Sector 112 row 14.',
          'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=600',
          session.uid,
          '112'
        );
        break;

      case 8: // Multilingual emergency coordination (URGENT priority)
        await EmergencyCopilotService.broadcastEmergencyAlert(
          'Medical evacuation in progress at Sector 112 concourse walkway. Please clear row 14 for stretcher access.',
          ['110', '112', '114'],
          'URGENT',
          session.uid
        );
        break;

      case 9: {
        // Executive resolution summary (GLM 5.2 Pro)
        const summary = await OperationsCopilotService.generateExecutiveSummary();
        return NextResponse.json(
          {
            success: true,
            data: {
              act,
              message: 'Act 9 completed: Executive Resolution Summary generated successfully.',
              markdownSummary: summary.markdown,
              engine: summary.engine,
            },
          },
          { status: 200 }
        );
      }

      default:
        return NextResponse.json({ error: 'Invalid act number (must be 1-9)' }, { status: 400 });
    }

    await repository.logAudit(session.uid, 'DEMO_ACT_TRIGGERED', `Act ${act}`, `Triggered by ${session.role}`);
    return NextResponse.json(
      {
        success: true,
        data: {
          act,
          message: `Narrative Act ${act} triggered successfully! Live stadium state, heatmaps, and AI feeds updated.`,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[/api/simulation/trigger] Error:', err);
    return NextResponse.json({ error: 'Failed to execute demo storyline simulation act' }, { status: 500 });
  }
}

/** GET endpoint for the demo to know who the current user is. */
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  return NextResponse.json({ success: true, data: session });
}
