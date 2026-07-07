import { NextRequest, NextResponse } from 'next/server';
import { IncidentCreateSchema } from '@/domain/schemas';
import { repository } from '@/lib/db/repository';
import { eventBus } from '@/lib/events/event-bus';
import { VolunteerCopilotService } from '@/lib/ai/volunteer-copilot';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const stadiumId = searchParams.get('stadiumId') || 'metlife-ny-nj';
    const incidents = await repository.getIncidents(stadiumId);
    return NextResponse.json({ success: true, data: incidents }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch incidents', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Zod Runtime Validation
    const parseResult = IncidentCreateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid incident creation payload', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { description, photoUrl, reportedByUid, stadiumId, location } = parseResult.data;

    // 2. Publish event to asynchronous Pub/Sub & Eventarc bus
    await eventBus.publish('stadium.incident.created', {
      description,
      photoUrl,
      reportedByUid,
      stadiumId,
      sector: location.sector || '112',
    });

    // 3. For immediate UX feedback, also execute classification synchronously
    const { incident, aiClassification } = await VolunteerCopilotService.classifyAndReportIncident(
      description,
      photoUrl,
      reportedByUid,
      location.sector || '112'
    );

    return NextResponse.json({ success: true, data: { incident, aiClassification } }, { status: 201 });
  } catch (error: any) {
    console.error('[API /api/incidents Error]', error);
    return NextResponse.json(
      { error: 'Failed to create and classify incident', details: error.message },
      { status: 500 }
    );
  }
}
