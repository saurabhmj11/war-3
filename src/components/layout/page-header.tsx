'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  persona: string;
  badge: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Tailwind kit color key — controls the accent stripe and icon color. */
  kit: 'emerald' | 'sky' | 'amber' | 'red' | 'purple' | 'cyan';
  /** Jersey number for this role (display). */
  number: string;
}

const KIT: Record<PageHeaderProps['kit'], { stripe: string; icon: string; badge: string }> = {
  emerald: { stripe: 'bg-emerald-400', icon: 'text-emerald-300', badge: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/40' },
  sky: { stripe: 'bg-sky-400', icon: 'text-sky-300', badge: 'bg-sky-500/15 text-sky-200 border-sky-500/40' },
  amber: { stripe: 'bg-amber-400', icon: 'text-amber-300', badge: 'bg-amber-500/15 text-amber-200 border-amber-500/40' },
  red: { stripe: 'bg-red-400', icon: 'text-red-300', badge: 'bg-red-500/15 text-red-200 border-red-500/40' },
  purple: { stripe: 'bg-purple-400', icon: 'text-purple-300', badge: 'bg-purple-500/15 text-purple-200 border-purple-500/40' },
  cyan: { stripe: 'bg-cyan-400', icon: 'text-cyan-300', badge: 'bg-cyan-500/15 text-cyan-200 border-cyan-500/40' },
};

export const PageHeader: React.FC<PageHeaderProps> = ({ persona, badge, title, description, icon: Icon, kit, number }) => {
  const k = KIT[kit];
  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-emerald-900/50 pb-6 relative">
      {/* Subtle floodlit top edge */}
      <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent" aria-hidden="true" />
      <div className="flex items-start gap-4">
        {/* Jersey-number block with kit stripe */}
        <div className="relative flex items-stretch gap-2">
          <div className={`w-1 rounded-full ${k.stripe}`} aria-hidden="true" />
          <div className="w-16 h-16 rounded-md bg-[#03110a]/90 border border-white/10 flex items-center justify-center relative">
            <span className="text-2xl font-black scoreboard-numeral text-white">{number}</span>
            <div className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-md bg-[#0a1f15] border border-white/10">
              <Icon className={`w-4 h-4 ${k.icon}`} aria-hidden="true" />
            </div>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-100/60 font-mono">{persona}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold border ${k.badge}`}>{badge}</span>
          </div>
          <h1 className="jersey-heading text-2xl sm:text-3xl font-black text-white mt-1">{title}</h1>
          <p className="text-sm text-emerald-50/60 mt-1 max-w-2xl">{description}</p>
        </div>
      </div>
    </header>
  );
};
