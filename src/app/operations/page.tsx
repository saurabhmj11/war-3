'use client';

import React from 'react';
import { RoleGuard } from '@/components/auth/role-guard';
import { WhatIfSandbox } from '@/components/operations/what-if-sandbox';
import { DemoCommandCenter } from '@/components/demo/demo-command-center';
import { PageHeader } from '@/components/layout/page-header';
import { LayoutDashboard, Flag } from 'lucide-react';

export default function OperationsDashboardPage() {
  return (
    <RoleGuard allowedRoles={['OPERATIONS', 'ADMIN']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        <PageHeader
          persona="PERSONA 3 • MARCUS VANCE • VENUE OPERATIONS SUPERVISOR"
          badge="COMMAND CENTER"
          title="Operations What-If Sandbox"
          description="Test hypothetical operational interventions across live stadium telemetry using Gemini 2.5 Pro without risking fan safety. All changes sync across every connected dashboard."
          icon={LayoutDashboard}
          kit="amber"
          number="08"
        />

        <WhatIfSandbox />

        <section aria-labelledby="storyline-title" className="pt-8 border-t border-emerald-900/50 space-y-6">
          <div className="flex items-center gap-3">
            <Flag className="w-5 h-5 text-emerald-400" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-300 jersey-heading">Scenario Control Engine</span>
          </div>
          <div>
            <h2 id="storyline-title" className="jersey-heading text-xl sm:text-2xl font-black text-white">
              Match-Day Command Center
            </h2>
            <p className="text-xs text-emerald-50/60 mt-1">
              Trigger simulated turnstile bottlenecks, AI What-If rerouting, and 8-language emergency coordination. All acts respect RBAC: security-sensitive acts (8) require SECURITY or ADMIN.
            </p>
          </div>
          <DemoCommandCenter />
        </section>
      </div>
    </RoleGuard>
  );
}
