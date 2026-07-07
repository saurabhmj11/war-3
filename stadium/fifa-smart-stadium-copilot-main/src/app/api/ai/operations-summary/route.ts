import { NextResponse } from 'next/server';
import { OperationsCopilotService } from '@/lib/ai/ops-copilot';

export async function GET() {
  try {
    const summaryMarkdown = await OperationsCopilotService.generateExecutiveSummary();
    return NextResponse.json({ success: true, data: { markdown: summaryMarkdown } }, { status: 200 });
  } catch (error: any) {
    console.error('[API /api/ai/operations-summary Error]', error);
    return NextResponse.json(
      { error: 'Failed to generate executive operations summary', details: error.message },
      { status: 500 }
    );
  }
}
