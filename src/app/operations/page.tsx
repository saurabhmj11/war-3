'use client';

import React from 'react';
import { RoleGuard } from '@/components/auth/role-guard';
import { WhatIfSandbox } from '@/components/operations/what-if-sandbox';
import { DemoCommandCenter } from '@/components/demo/demo-command-center';
import { LayoutDashboard } from 'lucide-react';

export default function OperationsDashboardPage() {
  return (
    <RoleGuard allowedRoles={['OPERATIONS', 'ADMIN']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">PERSONA 3: MARCUS VANCE • VENUE OPERATIONS SUPERVISOR</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">COMMAND CENTER</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 flex items-center gap-2.5">
              <LayoutDashboard className="w-7 h-7 text-amber-400" aria-hidden="true" />
              <span>Operations What-If Sandbox &amp; Command Center</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Test hypothetical operational interventions across live stadium telemetry using Gemini 2.5 Pro without risking fan safety. All changes sync across every connected dashboard.
            </p>
          </div>
        </header>

        <WhatIfSandbox />

        <section aria-labelledby="storyline-title" className="pt-8 border-t border-slate-800 space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">SCENARIO CONTROL ENGINE</span>
            <h2 id="storyline-title" className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              9-Step Narrative Demo Command Center
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Trigger simulated turnstile bottlenecks, AI What-If rerouting, and 8-language emergency coordination. All acts respect RBAC: security-sensitive acts (8) require SECURITY or ADMIN.
            </p>
          </div>
          <DemoCommandCenter />
        </section>
      </div>
    </RoleGuard>
  );
}
