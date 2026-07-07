import { NextRequest, NextResponse } from 'next/server';
import { WhatIfScenarioSchema } from '@/domain/schemas';
import { OperationsCopilotService } from '@/lib/ai/ops-copilot';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Zod Runtime Schema Validation
    const parseResult = WhatIfScenarioSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid What-If scenario payload', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const scenario = parseResult.data;

    // 2. Invoke Gemini 2.5 Pro What-If Simulation Engine
    const simulationResult = await OperationsCopilotService.runWhatIfSimulation(scenario);

    return NextResponse.json({ success: true, data: simulationResult }, { status: 200 });
  } catch (error: any) {
    console.error('[API /api/ai/what-if Error]', error);
    return NextResponse.json(
      { error: 'Internal Server Error during What-If simulation execution', details: error.message },
      { status: 500 }
    );
  }
}
