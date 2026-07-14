import { UserRole, RolePermission } from '@/domain/types';
import { SEED_DATA } from '@/lib/db/seed-data';

/**
 * Static lookup map from `UserRole` → its full `RolePermission` config,
 * sourced from the seed data (single source of truth for permissions,
 * dashboards, and UI display metadata).
 *
 * Prefer `hasPermission()` over direct access when checking capabilities
 * to ensure ADMIN's full-access override is always honoured.
 */
export const ROLE_PERMISSIONS_MAP: Record<UserRole, RolePermission> = {
  FAN: SEED_DATA.roles.find((r) => r.roleId === 'FAN')!,
  VOLUNTEER: SEED_DATA.roles.find((r) => r.roleId === 'VOLUNTEER')!,
  OPERATIONS: SEED_DATA.roles.find((r) => r.roleId === 'OPERATIONS')!,
  SECURITY: SEED_DATA.roles.find((r) => r.roleId === 'SECURITY')!,
  MEDICAL: SEED_DATA.roles.find((r) => r.roleId === 'MEDICAL')!,
  ADMIN: SEED_DATA.roles.find((r) => r.roleId === 'ADMIN')!,
};

/**
 * Returns `true` if `role` is permitted to perform `requiredPermission`.
 *
 * The ADMIN role always returns `true` regardless of the permission string,
 * implementing a full-access override without enumerating every capability.
 *
 * @param role - The active user role to check.
 * @param requiredPermission - The permission string, e.g. `'CREATE_INCIDENT'`.
 * @returns `true` if the role has the permission or is ADMIN.
 */
export function hasPermission(role: UserRole, requiredPermission: string): boolean {
  if (role === 'ADMIN') return true;
  const roleConfig = ROLE_PERMISSIONS_MAP[role];
  if (!roleConfig) return false;
  return roleConfig.permissions.includes(requiredPermission) || roleConfig.permissions.includes('FULL_ACCESS');
}

/**
 * Returns `true` if `role` is permitted to view the dashboard at `pathname`.
 *
 * Matching is prefix-based so `/dashboard/operations/crowd` is allowed when
 * the role's `allowedDashboards` contains `/dashboard/operations`.
 * The ADMIN role always returns `true`.
 *
 * @param role - The active user role to check.
 * @param pathname - The Next.js pathname being accessed.
 * @returns `true` if the role may access the given path.
 */
export function canAccessDashboard(role: UserRole, pathname: string): boolean {
  if (role === 'ADMIN') return true;
  const roleConfig = ROLE_PERMISSIONS_MAP[role];
  if (!roleConfig) return false;
  return roleConfig.allowedDashboards.some((allowedPath) => pathname.startsWith(allowedPath));
}

/**
 * Returns stable Tailwind CSS class tokens for the role's badge color.
 *
 * Values are deterministic and safe to use in both server and client
 * components without hydration mismatches. Tokens cover background tint,
 * foreground text color, and border color.
 *
 * @param role - The user role to retrieve color tokens for.
 * @returns An object with `bg`, `text`, and `border` Tailwind class strings.
 */
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

/** Ordered list of all valid user roles. Use for iteration and validation. */
export const ALL_ROLES: UserRole[] = ['FAN', 'VOLUNTEER', 'OPERATIONS', 'SECURITY', 'MEDICAL', 'ADMIN'];
