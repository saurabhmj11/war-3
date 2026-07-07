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

export function hasPermission(role: UserRole, requiredPermission: string): boolean {
  if (role === 'ADMIN') return true;
  const roleConfig = ROLE_PERMISSIONS_MAP[role];
  if (!roleConfig) return false;
  return roleConfig.permissions.includes(requiredPermission) || roleConfig.permissions.includes('FULL_ACCESS');
}

export function canAccessDashboard(role: UserRole, pathname: string): boolean {
  if (role === 'ADMIN') return true;
  const roleConfig = ROLE_PERMISSIONS_MAP[role];
  if (!roleConfig) return false;
  
  // Check if pathname starts with any allowed dashboard path
  return roleConfig.allowedDashboards.some((allowedPath) => pathname.startsWith(allowedPath));
}

export function getRoleBadgeColor(role: UserRole): { bg: string; text: string; border: string } {
  switch (role) {
    case 'FAN':
      return { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' };
    case 'VOLUNTEER':
      return { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' };
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
