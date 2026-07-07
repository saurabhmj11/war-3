'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { UserRole } from '@/domain/types';
import { getRoleBadgeColor, ROLE_PERMISSIONS_MAP, ALL_ROLES } from '@/lib/auth/rbac';
import { Shield, ChevronDown, Check, User, HeartPulse, Lock, Radio, Sparkles } from 'lucide-react';

const ROLE_LABELS: Record<UserRole, string> = {
  FAN: 'Spectator / Fan',
  VOLUNTEER: 'Stadium Volunteer',
  OPERATIONS: 'Operations Command Lead',
  SECURITY: 'Security Command Team',
  MEDICAL: 'Medical Triage Lead',
  ADMIN: 'System Administrator',
};

export const RoleSwitcher: React.FC = () => {
  const { role, switchRole, user, isDemoMode, isGeminiLive, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const badgeColor = getRoleBadgeColor(role);

  const getRoleIcon = (r: UserRole) => {
    switch (r) {
      case 'FAN':
        return <User className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />;
      case 'VOLUNTEER':
        return <Sparkles className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />;
      case 'OPERATIONS':
        return <Radio className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />;
      case 'SECURITY':
        return <Shield className="w-3.5 h-3.5 text-red-400" aria-hidden="true" />;
      case 'MEDICAL':
        return <HeartPulse className="w-3.5 h-3.5 text-purple-400" aria-hidden="true" />;
      case 'ADMIN':
        return <Lock className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />;
    }
  };

  // Close on Escape and click-outside.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('click', onClick);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Active role: ${ROLE_LABELS[role]}. Click to switch role.`}
        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full border transition-all text-xs font-semibold shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${badgeColor.bg} ${badgeColor.text} ${badgeColor.border} hover:opacity-90 active:scale-98`}
      >
        <span className="flex items-center gap-1.5">
          {getRoleIcon(role)}
          <span className="tracking-wide">{role}</span>
        </span>
        <span className="h-3 w-px bg-current opacity-20" aria-hidden="true" />
        <span className="text-slate-300 font-normal truncate max-w-[80px] sm:max-w-[140px]">
          {isLoading ? 'Loading…' : user?.displayName || 'User Profile'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Select active role"
          className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl z-50 overflow-hidden py-1.5 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="px-3 py-2 border-b border-slate-800/80 mb-1 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {isDemoMode ? 'Demo Mode: Select Role' : 'Active RBAC Role'}
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                isGeminiLive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}
              title={isGeminiLive ? 'Real Google Gemini API key is configured' : 'No Gemini API key — using simulated engine'}
            >
              {isGeminiLive ? 'GEMINI LIVE' : 'SIMULATED'}
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-0.5 px-1.5">
            {ALL_ROLES.map((r) => {
              const isSelected = r === role;
              const rColor = getRoleBadgeColor(r);
              const rConfig = ROLE_PERMISSIONS_MAP[r];
              return (
                <button
                  key={r}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isSelected}
                  onClick={() => {
                    void switchRole(r);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-start justify-between gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                    isSelected ? 'bg-slate-800/90 border border-slate-700' : 'hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className={`mt-0.5 p-1 rounded-lg ${rColor.bg} border ${rColor.border}`} aria-hidden="true">
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
                      <p className="text-[11px] text-slate-400 truncate font-medium">{rConfig?.displayName}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-1" aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          <div className="mt-1 pt-2 px-3 pb-1 border-t border-slate-800/80 text-[10px] text-slate-500 text-center">
            FIFA World Cup 2026 • RBAC enforced server-side
          </div>
        </div>
      )}
    </div>
  );
};
