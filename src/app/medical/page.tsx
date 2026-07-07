'use client';

import React, { useState } from 'react';
import { RoleGuard } from '@/components/auth/role-guard';
import { PageHeader } from '@/components/layout/page-header';
import { useStadiumState } from '@/hooks/use-stadium-state';
import { StadiumMap } from '@/components/stadium/stadium-map';
import { HeartPulse, Ambulance, Navigation } from 'lucide-react';

export default function MedicalDashboardPage() {
  const { state } = useStadiumState();
  const [activeStretcherRoute, setActiveStretcherRoute] = useState<string | undefined>('sec-112-to-med-station-1');

  const incidents = state.incidents.filter((i) => i.incidentType === 'MEDICAL');

  const getPriorityStyle = (sev: number) => {
    if (sev >= 8) return { bg: 'bg-red-500/20 text-red-300 border-red-500/40', label: 'PRIORITY 1 • URGENT EXTRACTION' };
    if (sev >= 5) return { bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40', label: 'PRIORITY 2 • MODERATE TRIAGE' };
    return { bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', label: 'PRIORITY 3 • FIRST AID' };
  };

  return (
    <RoleGuard allowedRoles={['MEDICAL', 'OPERATIONS', 'ADMIN']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        <PageHeader
          persona="PERSONA 5 • DR. ARIS THORNE • PARAMEDIC FIRST-AID LEAD"
          badge="MED-STATION-1"
          title="Medical Triage & Stretcher Routing"
          description="Real-time emergency triage queue with Gemini Vision injury classification and step-free WCAG AA elevator extraction routing."
          icon={HeartPulse}
          kit="purple"
          number="07"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 w-full space-y-6">
            <div className="card-floodlit ref-card-red rounded-xl p-6 shadow-2xl space-y-4 relative overflow-hidden">
              <div className="absolute inset-0 pitch-stripes opacity-10" aria-hidden="true" />
              <div className="flex items-center justify-between border-b border-emerald-900/50 pb-3 relative z-10">
                <h3 className="jersey-heading text-base font-black text-white flex items-center gap-2">
                  <Ambulance className="w-5 h-5 text-purple-400" aria-hidden="true" />
                  <span>Active Triage Queue</span>
                </h3>
                <span className="text-xs font-mono text-emerald-100/50 tracking-widest uppercase">PRIORITY SORTED</span>
              </div>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 scrollbar-pitch relative z-10">
                {incidents.length === 0 ? (
                  <div className="text-center py-8 text-xs text-emerald-100/40">
                    🟢 Zero active medical incidents. Medical stations operating at standby.
                  </div>
                ) : (
                  incidents.map((inc) => {
                    const pri = getPriorityStyle(inc.severity);
                    return (
                      <div key={inc.incidentId} className="bg-[#03110a]/90 border border-purple-500/40 p-4 rounded-md space-y-3 shadow-lg">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-md border tracking-widest uppercase ${pri.bg}`}>{pri.label}</span>
                          <span className="text-[10px] font-mono text-emerald-100/50">SECTOR {inc.location.sector}</span>
                        </div>
                        <div className="text-sm font-bold text-white">{inc.description}</div>
                        {inc.aiSummary && (
                          <div className="text-xs text-purple-200 bg-purple-950/40 p-3 rounded-md border border-purple-500/30 font-mono leading-relaxed">
                            ⚡ AI Triage Assessment: {inc.aiSummary}
                          </div>
                        )}
                        <div className="pt-2 border-t border-emerald-900/50 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-emerald-100/50 font-mono">ASSIGNED: {inc.assignedTeamId}</span>
                          <button
                            type="button"
                            onClick={() => setActiveStretcherRoute(`extract-${inc.incidentId}`)}
                            className="px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                            aria-label={`Route step-free stretcher extraction for ${inc.incidentId}`}
                          >
                            <Navigation className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Route Stretcher</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 w-full space-y-6">
            <div className="card-floodlit rounded-xl p-6 shadow-2xl space-y-4 relative overflow-hidden">
              <div className="absolute inset-0 pitch-stripes opacity-10" aria-hidden="true" />
              <div className="flex items-center justify-between border-b border-emerald-900/50 pb-3 relative z-10">
                <div className="flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-cyan-400" aria-hidden="true" />
                  <h3 className="jersey-heading text-base font-black text-white">Step-Free Stretcher Route</h3>
                </div>
                <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-md font-black uppercase tracking-widest">WCAG AA • ZERO STAIRS</span>
              </div>
              <p className="text-xs text-emerald-100/70 relative z-10">
                To prevent patient jarring during stretcher extraction, our routing filters out stairs and steep concourse ramps,
                calculating the fastest step-free service elevator path to Medical Station 1.
              </p>
              <div className="pt-2 relative z-10">
                <StadiumMap activeRouteId={activeStretcherRoute} showHeatmap={false} compact />
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
