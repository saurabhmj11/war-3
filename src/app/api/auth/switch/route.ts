import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';
import { issueRoleToken, verifyRoleToken } from '@/lib/auth/session';
import { isGeminiLiveConfigured } from '@/lib/ai/gemini-client';
import { UserRole } from '@/domain/types';

export const dynamic = 'force-dynamic';

const VALID_ROLES: UserRole[] = ['FAN', 'VOLUNTEER', 'OPERATIONS', 'SECURITY', 'MEDICAL', 'ADMIN'];

/**
 * POST /api/auth/switch?role=OPERATIONS
 *
 * Issues a HMAC-signed role token for the active user. The client stores
 * this token in localStorage and sends it as the `x-fifa-role` header on
 * every mutating API call so the server can verify the role claim.
 *
 * Response shape:
 *   { success: true, isGeminiLive: boolean, data: { user, token } }
 */
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedRole = (searchParams.get('role') || 'FAN') as UserRole;
    if (!VALID_ROLES.includes(requestedRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Find matching seed user profile for this role.
    const users = await repository.getAllUsers();
    const user = users.find((u) => u.role === requestedRole) ?? users[0];

    // If a valid existing token was sent for the same user, reuse its uid;
    // otherwise we just issue a fresh token for the seed user.
    const existingToken = req.headers.get('x-fifa-role');
    const verified = verifyRoleToken(existingToken);
    const uid = verified && verified.uid.startsWith('usr_') ? verified.uid : user.uid;

    const token = issueRoleToken(uid, user.role);
    return NextResponse.json({
      success: true,
      isGeminiLive: isGeminiLiveConfigured(),
      data: { user, token },
    });
  } catch (err) {
    console.error('[/api/auth/switch] Error:', err);
    return NextResponse.json({ error: 'Failed to issue role token' }, { status: 500 });
  }
}
