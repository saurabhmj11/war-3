import { describe, it, expect } from 'vitest';
import { hasPermission, canAccessDashboard, ROLE_PERMISSIONS_MAP, ALL_ROLES, getRoleBadgeColor } from '@/lib/auth/rbac';
import { UserRole } from '@/domain/types';

describe('rbac.ts', () => {
  describe('hasPermission', () => {
    it('returns true for ADMIN regardless of permission', () => {
      expect(hasPermission('ADMIN', 'ANYTHING_MADE_UP')).toBe(true);
      expect(hasPermission('ADMIN', 'FULL_ACCESS')).toBe(true);
      expect(hasPermission('ADMIN', 'CREATE_INCIDENT')).toBe(true);
    });

    it('returns true when the role has the exact permission', () => {
      expect(hasPermission('FAN', 'USE_FAN_COPILOT')).toBe(true);
      expect(hasPermission('FAN', 'READ_MAP')).toBe(true);
      expect(hasPermission('VOLUNTEER', 'CREATE_INCIDENT')).toBe(true);
      expect(hasPermission('OPERATIONS', 'RUN_WHAT_IF')).toBe(true);
      expect(hasPermission('SECURITY', 'TRIGGER_EVACUATION')).toBe(true);
      expect(hasPermission('MEDICAL', 'DISPATCH_TRIAGE')).toBe(true);
    });

    it('returns false when the role lacks the permission', () => {
      // FAN cannot create incidents or trigger evacuations
      expect(hasPermission('FAN', 'CREATE_INCIDENT')).toBe(false);
      expect(hasPermission('FAN', 'TRIGGER_EVACUATION')).toBe(false);
      // VOLUNTEER cannot run What-If simulations
      expect(hasPermission('VOLUNTEER', 'RUN_WHAT_IF')).toBe(false);
      // MEDICAL cannot trigger evacuations
      expect(hasPermission('MEDICAL', 'TRIGGER_EVACUATION')).toBe(false);
      // SECURITY cannot run What-If
      expect(hasPermission('SECURITY', 'RUN_WHAT_IF')).toBe(false);
    });

    it('returns false for an unknown permission', () => {
      expect(hasPermission('FAN', 'NOT_A_REAL_PERMISSION')).toBe(false);
    });
  });

  describe('canAccessDashboard', () => {
    it('ADMIN can access every dashboard', () => {
      ALL_ROLES.forEach((r) => {
        if (r === 'ADMIN') return;
        // For each role's allowed dashboard, ADMIN should also be allowed
        ROLE_PERMISSIONS_MAP[r].allowedDashboards.forEach((p) => {
          expect(canAccessDashboard('ADMIN', p)).toBe(true);
        });
      });
    });

    it('returns true for the role on its own dashboard', () => {
      expect(canAccessDashboard('FAN', '/fan')).toBe(true);
      expect(canAccessDashboard('VOLUNTEER', '/volunteer')).toBe(true);
      expect(canAccessDashboard('OPERATIONS', '/operations')).toBe(true);
      expect(canAccessDashboard('SECURITY', '/security')).toBe(true);
      expect(canAccessDashboard('MEDICAL', '/medical')).toBe(true);
      expect(canAccessDashboard('ADMIN', '/admin')).toBe(true);
    });

    it('returns false when a role accesses a dashboard it does not own', () => {
      expect(canAccessDashboard('FAN', '/operations')).toBe(false);
      expect(canAccessDashboard('FAN', '/security')).toBe(false);
      expect(canAccessDashboard('FAN', '/admin')).toBe(false);
      expect(canAccessDashboard('VOLUNTEER', '/security')).toBe(false);
      expect(canAccessDashboard('SECURITY', '/operations')).toBe(false);
      expect(canAccessDashboard('MEDICAL', '/operations')).toBe(false);
    });

    it('handles prefix-based sub-paths correctly', () => {
      expect(canAccessDashboard('OPERATIONS', '/operations/what-if')).toBe(true);
      expect(canAccessDashboard('OPERATIONS', '/volunteer/tasks')).toBe(true); // ops can see volunteer dashboard
      expect(canAccessDashboard('FAN', '/fan/route=gate-d')).toBe(true);
    });
  });

  describe('getRoleBadgeColor', () => {
    it('returns distinct color tokens for every role', () => {
      const seen = new Set<string>();
      ALL_ROLES.forEach((r: UserRole) => {
        const c = getRoleBadgeColor(r);
        expect(c.bg).toBeTruthy();
        expect(c.text).toBeTruthy();
        expect(c.border).toBeTruthy();
        seen.add(c.text);
      });
      // All six roles should have distinct text colors
      expect(seen.size).toBe(ALL_ROLES.length);
    });
  });
});
