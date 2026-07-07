import { NextRequest, NextResponse } from 'next/server';
import { OperationsCopilotService } from '@/lib/ai/ops-copilot';
import { requirePermission } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Authorization: only OPERATIONS / ADMIN may generate executive summaries.
    const auth = await requirePermission(req, 'READ_ANALYTICS');
    if (auth.response) return auth.response;

    const summary = await OperationsCopilotService.generateExecutiveSummary();
    return NextResponse.json({ success: true, data: summary }, { status: 200 });
  } catch (err) {
    console.error('[/api/ai/operations-summary] Error:', err);
    return NextResponse.json({ error: 'Failed to generate executive operations summary' }, { status: 500 });
  }
}
