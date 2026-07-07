import { NextRequest, NextResponse } from 'next/server';
import { EmergencyCopilotService } from '@/lib/ai/emergency-copilot';
import { requirePermission } from '@/lib/auth/session';
import { EmergencyBroadcastSchema } from '@/domain/schemas';

export const dynamic = 'force-dynamic';

/**
 * POST /api/security/broadcast  { summaryEn, targetSectors[], priority }
 *
 * Generates an 8-language PA broadcast via GLM (or fallback) and dispatches it.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requirePermission(req, 'BROADCAST_ANNOUNCEMENT');
    if (auth.response) return auth.response;
    const session = auth.session!;

    const body = await req.json();
    const parsed = EmergencyBroadcastSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
    }

    const announcement = await EmergencyCopilotService.broadcastEmergencyAlert(
      parsed.data.summaryEn,
      parsed.data.targetSectors,
      parsed.data.priority,
      session.uid
    );
    return NextResponse.json({ success: true, data: announcement });
  } catch (err) {
    console.error('[/api/security/broadcast] Error:', err);
    return NextResponse.json({ error: 'Failed to dispatch emergency broadcast' }, { status: 500 });
  }
}
