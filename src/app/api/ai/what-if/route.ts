import { NextRequest, NextResponse } from 'next/server';
import { WhatIfScenarioSchema } from '@/domain/schemas';
import { OperationsCopilotService } from '@/lib/ai/ops-copilot';
import { requirePermission } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Authorization: only OPERATIONS / ADMIN may run What-If simulations.
    const auth = await requirePermission(req, 'RUN_WHAT_IF');
    if (auth.response) return auth.response;
    const session = auth.session!;

    const body = await req.json();
    const parseResult = WhatIfScenarioSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid What-If scenario payload', details: parseResult.error.format() },
        { status: 400 }
      );
    }
    const scenario = parseResult.data;

    const simulationResult = await OperationsCopilotService.runWhatIfSimulation(scenario, session.uid);
    return NextResponse.json({ success: true, data: simulationResult }, { status: 200 });
  } catch (err) {
    console.error('[/api/ai/what-if] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error during What-If simulation' }, { status: 500 });
  }
}
