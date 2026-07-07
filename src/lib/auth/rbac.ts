import { UserRole, RolePermission } from '@/domain/types';
import { SEED_DATA } from '@/lib/db/seed-data';

export const ROLE_PERMISSIONS_MAP: Record<UserRole, RolePermission> = {
  FAN: SEED_DATA.roles.find((r) => r.roleId === 'FAN')!,
  VOLUNTEER: SEED_DATA.roles.find((r) => r.roleId === 'VOLUNTEER')!,
  OPERATIONS: SEED_DATA.roles.find((r) => r.roleId === 'OPERATIONS')!,
  SECURITY: SEED_DATA.roles.find((r) => r.roleId === 'SECURITY')!,
  MEDICAL: SEED_DATA.roles.find((r) => r.roleId === 'MEDICAL')!,
  ADMIN: SEED_DATA.roles.find((r) => r.roleId === 'ADMIN')!,
};

/**
 * Returns true if the given role is allowed to perform the named permission.
 * ADMIN always returns true (full access).
 */
export function hasPermission(role: UserRole, requiredPermission: string): boolean {
  if (role === 'ADMIN') return true;
  const roleConfig = ROLE_PERMISSIONS_MAP[role];
  if (!roleConfig) return false;
  return roleConfig.permissions.includes(requiredPermission) || roleConfig.permissions.includes('FULL_ACCESS');
}

/**
 * Returns true if the given role is allowed to view the dashboard at the
 * given pathname. ADMIN always returns true.
 */
export function canAccessDashboard(role: UserRole, pathname: string): boolean {
  if (role === 'ADMIN') return true;
  const roleConfig = ROLE_PERMISSIONS_MAP[role];
  if (!roleConfig) return false;
  return roleConfig.allowedDashboards.some((allowedPath) => pathname.startsWith(allowedPath));
}

/** Stable, copy-safe role → badge color tokens (used by both server and client). */
export function getRoleBadgeColor(role: UserRole): { bg: string; text: string; border: string } {
  switch (role) {
    case 'FAN':
      return { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' };
    case 'VOLUNTEER':
      return { bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' };
    case 'OPERATIONS':
      return { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' };
    case 'SECURITY':
      return { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' };
    case 'MEDICAL':
      return { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' };
    case 'ADMIN':
      return { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30' };
    default:
      return { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30' };
  }
}

export const ALL_ROLES: UserRole[] = ['FAN', 'VOLUNTEER', 'OPERATIONS', 'SECURITY', 'MEDICAL', 'ADMIN'];
