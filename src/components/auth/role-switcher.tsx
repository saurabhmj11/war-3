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

/** Each role gets a "kit color" like a national team jersey. */
const KIT: Record<UserRole, { stripe: string; bg: string; text: string; border: string; label: string }> = {
  FAN: { stripe: 'bg-emerald-400', bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/40', label: 'EMERALD' },
  VOLUNTEER: { stripe: 'bg-sky-400', bg: 'bg-sky-500/15', text: 'text-sky-300', border: 'border-sky-500/40', label: 'SKY' },
  OPERATIONS: { stripe: 'bg-amber-400', bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/40', label: 'AMBER' },
  SECURITY: { stripe: 'bg-red-400', bg: 'bg-red-500/15', text: 'text-red-300', border: 'border-red-500/40', label: 'RED' },
  MEDICAL: { stripe: 'bg-purple-400', bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/40', label: 'PURPLE' },
  ADMIN: { stripe: 'bg-cyan-400', bg: 'bg-cyan-500/15', text: 'text-cyan-300', border: 'border-cyan-500/40', label: 'CYAN' },
};

export const RoleSwitcher: React.FC = () => {
  const { role, switchRole, user, isDemoMode, isGeminiLive, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const kit = KIT[role];

  const getRoleIcon = (r: UserRole) => {
    const cls = `w-3.5 h-3.5 ${KIT[r].text} shrink-0`;
    switch (r) {
      case 'FAN':
        return <User className={cls} aria-hidden="true" />;
      case 'VOLUNTEER':
        return <Sparkles className={cls} aria-hidden="true" />;
      case 'OPERATIONS':
        return <Radio className={cls} aria-hidden="true" />;
      case 'SECURITY':
        return <Shield className={cls} aria-hidden="true" />;
      case 'MEDICAL':
        return <HeartPulse className={cls} aria-hidden="true" />;
      case 'ADMIN':
        return <Lock className={cls} aria-hidden="true" />;
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
        className={`group flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-md border transition-all text-xs font-bold uppercase tracking-wider shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${kit.bg} ${kit.text} ${kit.border} hover:brightness-125 active:scale-98`}
      >
        {/* Referee-card-style kit stripe */}
        <span className={`w-1 h-5 rounded-sm ${kit.stripe}`} aria-hidden="true" />
        <span className="flex items-center gap-1.5">
          {getRoleIcon(role)}
          <span className="tracking-wider">{role}</span>
        </span>
        <span className="h-3 w-px bg-current opacity-20" aria-hidden="true" />
        <span className="text-emerald-100/80 font-medium normal-case tracking-normal truncate max-w-[70px] sm:max-w-[140px]">
          {isLoading ? 'Loading…' : user?.displayName || 'Profile'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Select active role"
          className="absolute right-0 mt-2 w-80 rounded-xl bg-[#0a1f15] border border-emerald-900/60 shadow-2xl z-50 overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Floodlit top edge */}
          <div className="h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" aria-hidden="true" />

          <div className="px-3 py-2.5 border-b border-emerald-900/50 mb-1 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-300/80 jersey-heading">
              {isDemoMode ? 'Select Role Kit' : 'Active RBAC Role'}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                isGeminiLive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
              title={isGeminiLive ? 'Real GLM 5.2 API key is configured' : 'No GLM API key — using simulated engine'}
            >
              {isGeminiLive ? '◆ GLM 5.2 LIVE' : '◇ SIMULATED'}
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-1 px-1.5 py-1 scrollbar-pitch">
            {ALL_ROLES.map((r) => {
              const isSelected = r === role;
              const rKit = KIT[r];
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
                  className={`w-full text-left px-2.5 py-2.5 rounded-lg transition-all flex items-start justify-between gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                    isSelected ? `${rKit.bg} border ${rKit.border}` : 'hover:bg-emerald-950/40 border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    {/* Vertical kit stripe */}
                    <div className="flex flex-col items-center gap-1">
                      <span className={`w-1 h-10 rounded-sm ${rKit.stripe}`} aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(r)}
                        <span className="text-xs font-black text-white tracking-wider uppercase jersey-heading">{r}</span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${rKit.bg} ${rKit.text} ${rKit.border} border`}>
                          {rKit.label}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] trophy-badge font-bold px-1.5 py-0.2 rounded">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-emerald-100/50 truncate font-medium mt-0.5">{rConfig?.displayName}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-1" aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          <div className="mt-1 pt-2 px-3 pb-2 border-t border-emerald-900/50 text-[10px] text-emerald-100/75 text-center font-mono">
            FIFA WC 2026 • RBAC ENFORCED SERVER-SIDE
          </div>
        </div>
      )}
    </div>
  );
};

// Re-export to avoid an unused-import warning in callers that still pull this.
export const _unusedBadgeColorExport = getRoleBadgeColor;
