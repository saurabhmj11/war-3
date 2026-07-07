import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';
import { requirePermission } from '@/lib/auth/session';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const UpdateSchema = z.object({
  status: z.enum(['ASSIGNED', 'IN_PROGRESS', 'COMPLETED']).optional(),
  checklist: z
    .array(z.object({ item: z.string(), completed: z.boolean() }))
    .optional(),
});

/**
 * PATCH /api/tasks/{taskId}  { status?, checklist? }
 *
 * Volunteer updates a task checklist / status. Updates flow through the
 * shared repository and are broadcast to all subscribers via /api/events.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const auth = await requirePermission(req, 'UPDATE_TASK');
    if (auth.response) return auth.response;

    const { taskId } = await params;
    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
    }

    const updated = await repository.updateTaskStatus(
      taskId,
      parsed.data.status ?? 'IN_PROGRESS',
      parsed.data.checklist
    );
    if (!updated) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error('[/api/tasks/[taskId]] Error:', err);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
