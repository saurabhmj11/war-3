import { NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';

/**
 * GET /api/state
 *
 * Returns a snapshot of all stadium collections. Used by client components
 * to fetch initial render data without importing the server-only repository.
 * Live updates flow over /api/events (SSE).
 */
export async function GET() {
  try {
    const snapshot = await repository.snapshot();
    return NextResponse.json({ success: true, data: snapshot, ts: Date.now() }, {
      headers: { 'cache-control': 'no-store' },
    });
  } catch (err) {
    console.error('[/api/state] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch stadium state' }, { status: 500 });
  }
}
