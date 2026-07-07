'use client';

import React from 'react';
import { RoleGuard } from '@/components/auth/role-guard';
import { IncidentReporter } from '@/components/volunteer/incident-reporter';
import { Sparkles, Users, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function VolunteerDashboardPage() {
  return (
    <RoleGuard allowedRoles={['VOLUNTEER', 'OPERATIONS']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 font-mono">
                PERSONA 2: ELENA ROSTOVA • CONCOURSE B GROUND STAFF
              </span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono">
                VOL-881
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 flex items-center gap-2.5">
              <Sparkles className="w-7 h-7 text-blue-400" />
              <span>Volunteer Checklist & Incident Triage</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage your shift tasks and submit multimodal safety reports. Vertex AI Gemini Vision automatically classifies photo severity and dispatches medical or security teams.
            </p>
          </div>
        </div>

        {/* Incident Reporter & Task Feed */}
        <IncidentReporter />
      </div>
    </RoleGuard>
  );
}
