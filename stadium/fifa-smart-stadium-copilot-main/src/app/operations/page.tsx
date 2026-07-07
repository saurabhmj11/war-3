'use client';

import React from 'react';
import { RoleGuard } from '@/components/auth/role-guard';
import { WhatIfSandbox } from '@/components/operations/what-if-sandbox';
import { DemoCommandCenter } from '@/components/demo/demo-command-center';
import { LayoutDashboard, Sparkles, AlertTriangle, Users } from 'lucide-react';

export default function OperationsDashboardPage() {
  return (
    <RoleGuard allowedRoles={['OPERATIONS', 'ADMIN']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
                PERSONA 3: MARCUS VANCE • VENUE OPERATIONS SUPERVISOR
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                COMMAND CENTER
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 flex items-center gap-2.5">
              <LayoutDashboard className="w-7 h-7 text-amber-400" />
              <span>Operations What-If Sandbox & Command Center</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Test hypothetical operational interventions (gate closures, rail delays) across 18 live collections using Vertex AI Gemini 2.5 Pro without risking fan safety.
            </p>
          </div>
        </div>

        {/* What-If Simulation Sandbox */}
        <WhatIfSandbox />

        {/* Embedded 9-Step Storyline Suite for Quick Judge Evaluation */}
        <div className="pt-8 border-t border-slate-800 space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
              SCENARIO CONTROL ENGINE
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              9-Step Narrative Demo Command Center
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Trigger simulated turnstile bottlenecks, AI What-If rerouting, and 8-language emergency coordination without network latency!
            </p>
          </div>

          <DemoCommandCenter />
        </div>
      </div>
    </RoleGuard>
  );
}
