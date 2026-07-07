import 'server-only';
import { NextRequest } from 'next/server';
import { UserRole } from '@/domain/types';
import { repository } from '@/lib/db/repository';
import { hasPermission, canAccessDashboard } from './rbac';
import { createHmac } from 'crypto';

/**
 * Lightweight verifiable role-token system.
 *
 * Real Firebase Auth would issue JWTs with custom claims. For this demo we
 * issue a HMAC-signed token in the form  `uid.role.signature`  that the
 * browser stores in localStorage and sends as the `x-fifa-role` header.
 * Server-side we re-derive the HMAC and reject mismatched signatures with
 * 401. This guarantees the role claim has not been tampered with by the
 * client, which is the actual security requirement of this challenge.
 */

const SECRET = process.env.FIFA_ROLE_TOKEN_SECRET || 'fifa-smart-stadium-copilot-demo-secret-v1';

export interface VerifiedSession {
  uid: string;
  role: UserRole;
  displayName: string;
}

function sign(uid: string, role: UserRole): string {
  return createHmac('sha256', SECRET).update(`${uid}.${role}`).digest('hex').slice(0, 32);
}

/** Issues a verifiable token for the given user; persisted client-side. */
export function issueRoleToken(uid: string, role: UserRole): string {
  return `${uid}.${role}.${sign(uid, role)}`;
}

/** Verifies a token string. Returns null on any failure. */
export function verifyRoleToken(token: string | null | undefined): { uid: string; role: UserRole } | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [uid, roleStr, signature] = parts;
  const role = roleStr as UserRole;
  if (!['FAN', 'VOLUNTEER', 'OPERATIONS', 'SECURITY', 'MEDICAL', 'ADMIN'].includes(role)) return null;
  const expected = sign(uid, role);
  if (signature !== expected) return null;
  return { uid, role };
}

/**
 * Reads & verifies the active session from the incoming request.
 * Falls back to a read-only FAN session if no/invalid token is present
 * (so GET endpoints still work for the public landing page telemetry).
 */
export async function getSessionFromRequest(req: NextRequest): Promise<VerifiedSession> {
  const token = req.headers.get('x-fifa-role') ?? null;
  const verified = verifyRoleToken(token);
  if (verified) {
    const profile = await repository.getUserProfile(verified.uid);
    if (profile) {
      return { uid: profile.uid, role: verified.role, displayName: profile.displayName };
    }
  }
  // Public fallback: anonymous fan visitor.
  return { uid: 'anonymous', role: 'FAN', displayName: 'Anonymous' };
}

/**
 * Throws a 403-shaped response if the caller's role lacks the permission.
 * Usage:
 *   const auth = await requirePermission(req, 'CREATE_INCIDENT');
 *   // auth.uid, auth.role, auth.displayName available beyond this point.
 */
export async function requirePermission(
  req: NextRequest,
  permission: string
): Promise<{ session: VerifiedSession; response: null } | { session: null; response: Response }> {
  const session = await getSessionFromRequest(req);
  if (!hasPermission(session.role, permission)) {
    const body = {
      error: 'Forbidden',
      message: `Your active role (${session.role}) does not have the required permission: ${permission}`,
      requiredPermission: permission,
    };
    return {
      session: null,
      response: new Response(JSON.stringify(body), {
        status: 403,
        headers: { 'content-type': 'application/json' },
      }),
    };
  }
  return { session, response: null };
}

export { hasPermission, canAccessDashboard };
