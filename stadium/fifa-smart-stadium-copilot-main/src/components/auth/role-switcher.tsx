'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { UserRole } from '@/domain/types';
import { getRoleBadgeColor, ROLE_PERMISSIONS_MAP } from '@/lib/auth/rbac';
import { Shield, ChevronDown, Check, User, HeartPulse, Lock, Radio, Sparkles } from 'lucide-react';

const ROLES: UserRole[] = ['FAN', 'VOLUNTEER', 'OPERATIONS', 'SECURITY', 'MEDICAL', 'ADMIN'];

export const RoleSwitcher: React.FC = () => {
  const { role, switchRole, user, isDemoMode } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const badgeColor = getRoleBadgeColor(role);

  const getRoleIcon = (r: UserRole) => {
    switch (r) {
      case 'FAN': return <User className="w-3.5 h-3.5 text-emerald-400" />;
      case 'VOLUNTEER': return <Sparkles className="w-3.5 h-3.5 text-blue-400" />;
      case 'OPERATIONS': return <Radio className="w-3.5 h-3.5 text-amber-400" />;
      case 'SECURITY': return <Shield className="w-3.5 h-3.5 text-red-400" />;
      case 'MEDICAL': return <HeartPulse className="w-3.5 h-3.5 text-purple-400" />;
      case 'ADMIN': return <Lock className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full border transition-all text-xs font-semibold shadow-sm ${badgeColor.bg} ${badgeColor.text} ${badgeColor.border} hover:opacity-90 active:scale-98`}
        title="Click to switch active user role"
      >
        <span className="flex items-center gap-1.5">
          {getRoleIcon(role)}
          <span className="tracking-wide">{role}</span>
        </span>
        <span className="h-3 w-px bg-current opacity-20"></span>
        <span className="text-slate-300 font-normal truncate max-w-[120px] sm:max-w-[180px]">
          {user?.displayName || 'User Profile'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close on click outside */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl z-50 overflow-hidden py-1.5 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-3 py-2 border-b border-slate-800/80 mb-1 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {isDemoMode ? '⚡ Demo Mode: Select Role' : 'Active RBAC Role'}
              </span>
              {isDemoMode && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                  INSTANT SWAP
                </span>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto space-y-0.5 px-1.5">
              {ROLES.map((r) => {
                const isSelected = r === role;
                const rColor = getRoleBadgeColor(r);
                const rConfig = ROLE_PERMISSIONS_MAP[r];

                return (
                  <button
                    key={r}
                    onClick={() => {
                      switchRole(r);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-start justify-between gap-2 group ${
                      isSelected ? 'bg-slate-800/90 border border-slate-700' : 'hover:bg-slate-800/50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`mt-0.5 p-1 rounded-lg ${rColor.bg} border ${rColor.border}`}>
                        {getRoleIcon(r)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white tracking-wide">{r}</span>
                          {isSelected && (
                            <span className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.2 rounded-full">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate font-medium">
                          {rConfig?.displayName}
                        </p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-1 pt-2 px-3 pb-1 border-t border-slate-800/80 text-[10px] text-slate-500 text-center">
              FIFA World Cup 2026 • Security Level AA
            </div>
          </div>
        </>
      )}
    </div>
  );
};
