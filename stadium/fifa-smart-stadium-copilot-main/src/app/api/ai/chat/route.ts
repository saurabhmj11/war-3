import { NextRequest, NextResponse } from 'next/server';
import { AIChatRequestSchema } from '@/domain/schemas';
import { FanCopilotService } from '@/lib/ai/fan-copilot';
import { geminiClient } from '@/lib/ai/gemini-client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Zod Runtime Schema Validation
    const parseResult = AIChatRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { copilotType, message, language, history, userLocation } = parseResult.data;

    // 2. Route to specialized AI Copilot service
    let aiResponse;
    if (copilotType === 'FAN') {
      aiResponse = await FanCopilotService.askAssistant(message, language, history, 'usr_fan_1');
    } else {
      // Default to general Gemini chat
      aiResponse = await geminiClient.generateFanResponse(message, language, history, userLocation);
    }

    return NextResponse.json({ success: true, data: aiResponse }, { status: 200 });
  } catch (error: any) {
    console.error('[API /api/ai/chat Error]', error);
    return NextResponse.json(
      { error: 'Internal Server Error during Vertex AI Gemini inference', details: error.message },
      { status: 500 }
    );
  }
}
