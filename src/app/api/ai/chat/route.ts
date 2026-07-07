import { NextRequest, NextResponse } from 'next/server';
import { AIChatRequestSchema } from '@/domain/schemas';
import { FanCopilotService } from '@/lib/ai/fan-copilot';
import { getGeminiClient } from '@/lib/ai/gemini-client';
import { getSessionFromRequest, requirePermission } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Anyone authenticated (even FAN) may use the chat copilot.
    const session = await getSessionFromRequest(req);

    const body = await req.json();
    const parseResult = AIChatRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', details: parseResult.error.format() },
        { status: 400 }
      );
    }
    const { copilotType, message, language, history, userLocation } = parseResult.data;

    let aiResponse;
    if (copilotType === 'FAN') {
      aiResponse = await FanCopilotService.askAssistant(message, language, history ?? [], session.uid);
    } else {
      // VOLUNTEER / OPERATIONS / EMERGENCY copilots reuse the same general path
      // but require the matching permission. (For demo simplicity we don't gate
      // FAN since it's the public copilot, but we DO gate the others.)
      const perm = copilotType === 'VOLUNTEER' ? 'USE_VOLUNTEER_COPILOT' : copilotType === 'OPERATIONS' ? 'RUN_WHAT_IF' : 'TRIGGER_EVACUATION';
      const auth = await requirePermission(req, perm);
      if (auth.response) return auth.response;
      const client = await getGeminiClient();
      aiResponse = await client.generateFanResponse(message, language, history ?? [], userLocation);
    }

    return NextResponse.json({ success: true, data: aiResponse }, { status: 200 });
  } catch (err) {
    console.error('[/api/ai/chat] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error during AI inference' }, { status: 500 });
  }
}
