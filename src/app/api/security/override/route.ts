import { NextRequest, NextResponse } from 'next/server';
import { EmergencyCopilotService } from '@/lib/ai/emergency-copilot';
import { requirePermission } from '@/lib/auth/session';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const Schema = z.object({
  gateId: z.string().min(1),
});

/**
 * POST /api/security/override  { gateId: 'gate-c' }
 *
 * Triggers the deterministic (non-LLM) gate evacuation override. The
 * challenge brief requires this to bypass generative AI entirely — see
 * EmergencyCopilotService.triggerDeterministicEvacuationOverride.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requirePermission(req, 'TRIGGER_EVACUATION');
    if (auth.response) return auth.response;
    const session = auth.session!;

    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
    }

    const ok = await EmergencyCopilotService.triggerDeterministicEvacuationOverride(parsed.data.gateId, session.uid);
    return NextResponse.json({ success: true, data: { gateId: parsed.data.gateId, overrideActive: ok } });
  } catch (err) {
    console.error('[/api/security/override] Error:', err);
    return NextResponse.json({ error: 'Failed to execute gate override' }, { status: 500 });
  }
}
