import { NextRequest, NextResponse } from 'next/server';
import { IncidentCreateSchema } from '@/domain/schemas';
import { repository } from '@/lib/db/repository';
import { eventBus } from '@/lib/events/event-bus';
import { VolunteerCopilotService } from '@/lib/ai/volunteer-copilot';
import { requirePermission } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const stadiumId = searchParams.get('stadiumId') || 'metlife-ny-nj';
    const incidents = await repository.getIncidents(stadiumId);
    return NextResponse.json({ success: true, data: incidents }, { status: 200 });
  } catch (err) {
    console.error('[/api/incidents GET] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch incidents' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authorization: only VOLUNTEER / OPERATIONS / SECURITY / MEDICAL / ADMIN
    //    may create incidents. Fans cannot.
    const auth = await requirePermission(req, 'CREATE_INCIDENT');
    if (auth.response) return auth.response;
    const session = auth.session!;

    // 2. Zod runtime validation
    const body = await req.json();
    const parseResult = IncidentCreateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid incident creation payload', details: parseResult.error.format() },
        { status: 400 }
      );
    }
    const { description, photoUrl, stadiumId, location } = parseResult.data;
    const sector = location.sector || '112';

    // 3. Publish to internal Pub/Sub bus (asynchronous worker pattern).
    await eventBus.publish('stadium.incident.created', {
      description,
      photoUrl,
      reportedByUid: session.uid,
      stadiumId,
      sector,
    });

    // 4. Synchronous classification for instant UX feedback. Uses the
    //    authenticated uid so audit logs are trustworthy.
    const { incident, aiClassification } = await VolunteerCopilotService.classifyAndReportIncident(
      description,
      photoUrl,
      session.uid,
      sector
    );

    return NextResponse.json({ success: true, data: { incident, aiClassification } }, { status: 201 });
  } catch (err) {
    // Log full error server-side; return sanitized message to client.
    console.error('[/api/incidents POST] Error:', err);
    return NextResponse.json({ error: 'Failed to create and classify incident' }, { status: 500 });
  }
}
