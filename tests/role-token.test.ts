import { describe, it, expect, vi, beforeEach } from 'vitest';
import { issueRoleToken, verifyRoleToken } from '@/lib/auth/session';
import { UserRole } from '@/domain/types';

// session.ts is normally server-only; for tests we stub the import.
vi.mock('server-only', () => ({}));

describe('role-token HMAC verification', () => {
  it('issues a token with three dot-separated parts', () => {
    const token = issueRoleToken('usr_vol_1', 'VOLUNTEER');
    expect(token.split('.')).toHaveLength(3);
    expect(token.startsWith('usr_vol_1.VOLUNTEER.')).toBe(true);
  });

  it.each<[UserRole]>([['FAN'], ['VOLUNTEER'], ['OPERATIONS'], ['SECURITY'], ['MEDICAL'], ['ADMIN']])(
    'verifies a token issued for role %s',
    (role) => {
      const token = issueRoleToken('usr_x', role);
      const verified = verifyRoleToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.uid).toBe('usr_x');
      expect(verified?.role).toBe(role);
    }
  );

  it('rejects a token whose signature was tampered with', () => {
    const token = issueRoleToken('usr_vol_1', 'VOLUNTEER');
    const parts = token.split('.');
    const tampered = `${parts[0]}.${parts[1]}.deadbeefdeadbeefdeadbeefdeadbeef`;
    expect(verifyRoleToken(tampered)).toBeNull();
  });

  it('rejects a token whose role was tampered with', () => {
    // Take a valid FAN token and try to escalate to ADMIN
    const token = issueRoleToken('usr_fan_1', 'FAN');
    const parts = token.split('.');
    const spoofed = `${parts[0]}.ADMIN.${parts[2]}`;
    expect(verifyRoleToken(spoofed)).toBeNull();
  });

  it('rejects a token with an unknown role', () => {
    const token = 'usr_x.SUPERUSER.abc';
    expect(verifyRoleToken(token)).toBeNull();
  });

  it('rejects null / undefined / malformed tokens', () => {
    expect(verifyRoleToken(null)).toBeNull();
    expect(verifyRoleToken(undefined)).toBeNull();
    expect(verifyRoleToken('')).toBeNull();
    expect(verifyRoleToken('only-one-part')).toBeNull();
    expect(verifyRoleToken('a.b')).toBeNull();
    expect(verifyRoleToken('a.b.c.d')).toBeNull();
  });
});
