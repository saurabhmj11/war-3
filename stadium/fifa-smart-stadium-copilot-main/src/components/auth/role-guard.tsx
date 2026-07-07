'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { UserRole } from '@/domain/types';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { ROLE_PERMISSIONS_MAP } from '@/lib/auth/rbac';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { role, switchRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400 font-medium">Verifying role permissions...</p>
        </div>
      </div>
    );
  }

  // Admins can access everything
  if (role === 'ADMIN' || allowedRoles.includes(role)) {
    return <>{children}</>;
  }

  // Find the primary recommended role for this route
  const recommendedRole = allowedRoles[0];
  const roleConfig = ROLE_PERMISSIONS_MAP[recommendedRole];

  return (
    <div className="flex items-center justify-center min-h-[60vh] w-full p-4">
      <div className="max-w-md w-full bg-slate-900/90 border border-red-500/30 rounded-2xl p-8 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Restricted Command Center</h2>
          <p className="text-slate-400 text-sm">
            Your current active profile (<span className="text-white font-semibold">{role}</span>) does not have the required security authorization to view this operational dashboard.
          </p>
        </div>

        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 text-left space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Required Role Authorization</div>
          <div className="text-sm font-medium text-white flex items-center justify-between">
            <span>{roleConfig?.displayName || recommendedRole}</span>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
              {recommendedRole}
            </span>
          </div>
          <p className="text-xs text-slate-400">{roleConfig?.description}</p>
        </div>

        <button
          onClick={() => switchRole(recommendedRole)}
          className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 group"
        >
          <span>Switch to {recommendedRole} Profile</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
