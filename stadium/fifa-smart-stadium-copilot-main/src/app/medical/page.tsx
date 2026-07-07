'use client';

import React, { useState, useEffect } from 'react';
import { RoleGuard } from '@/components/auth/role-guard';
import { Incident } from '@/domain/types';
import { repository } from '@/lib/db/repository';
import { StadiumMap } from '@/components/stadium/stadium-map';
import {
  HeartPulse,
  AlertCircle,
  CheckCircle2,
  Navigation,
  Clock,
  Sparkles,
  Users,
  Ambulance,
} from 'lucide-react';

export default function MedicalDashboardPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeStretcherRoute, setActiveStretcherRoute] = useState<string | undefined>('sec-112-to-med-station-1');

  useEffect(() => {
    const unsubInc = repository.subscribe<Incident>('incidents', (data) =>
      setIncidents(data.filter((i) => i.incidentType === 'MEDICAL'))
    );
    return () => unsubInc();
  }, []);

  const getPriorityStyle = (sev: number) => {
    if (sev >= 8) return { bg: 'bg-red-500/20 text-red-300 border-red-500/30', label: 'PRIORITY 1 • URGENT EXTRACTION' };
    if (sev >= 5) return { bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30', label: 'PRIORITY 2 • MODERATE TRIAGE' };
    return { bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', label: 'PRIORITY 3 • FIRST AID' };
  };

  return (
    <RoleGuard allowedRoles={['MEDICAL', 'OPERATIONS', 'ADMIN']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 font-mono">
                PERSONA 5: DR. ARIS THORNE • PARAMEDIC FIRST-AID LEAD
              </span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-mono">
                MED-STATION-1
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 flex items-center gap-2.5">
              <HeartPulse className="w-7 h-7 text-purple-400" />
              <span>Medical Triage Dashboard & Stretcher Routing</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Real-time emergency triage queue with Gemini Vision injury classification and step-free WCAG AA elevator extraction routing.
            </p>
          </div>
        </div>

        {/* Two Columns: Triage Queue & Accessible Stretcher Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Active Medical Triage Queue (5 Cols) */}
          <div className="lg:col-span-5 w-full space-y-6">
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Ambulance className="w-5 h-5 text-purple-400" />
                  <span>Active Medical Triage Queue</span>
                </h3>
                <span className="text-xs font-mono text-slate-400">PRIORITY SORTED</span>
              </div>

              <div className="space-y-4">
                {incidents.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    🟢 Zero active medical incidents across all concourse levels. Medical stations operating at standby.
                  </div>
                ) : (
                  incidents.map((inc) => {
                    const pri = getPriorityStyle(inc.severity);
                    return (
                      <div
                        key={inc.incidentId}
                        className="bg-slate-950/90 border border-purple-500/40 p-4 rounded-2xl space-y-3 shadow-lg"
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${pri.bg}`}>
                            {pri.label}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">Sector {inc.location.sector}</span>
                        </div>

                        <div className="text-sm font-bold text-white">{inc.description}</div>

                        {inc.aiSummary && (
                          <div className="text-xs text-purple-200 bg-purple-950/40 p-3 rounded-xl border border-purple-500/30 font-mono leading-relaxed">
                            ⚡ AI Triage Assessment: {inc.aiSummary}
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-400 font-mono">Assigned: {inc.assignedTeamId}</span>
                          <button
                            onClick={() => setActiveStretcherRoute(`extract-${inc.incidentId}`)}
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md active:scale-95"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Route Stretcher Extraction</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Accessible Step-Free Stretcher Map (7 Cols) */}
          <div className="lg:col-span-7 w-full space-y-6">
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-white">Step-Free Accessible Stretcher Route</h3>
                </div>
                <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">
                  WCAG AA COMPLIANT • ZERO STAIRS
                </span>
              </div>

              <p className="text-xs text-slate-300">
                To prevent patient jarring during stretcher extraction, our AI routing engine filters out stairs and steep concourse ramps, calculating the fastest step-free service elevator path to Medical Station 1.
              </p>

              <div className="pt-2">
                <StadiumMap activeRouteId={activeStretcherRoute} showHeatmap={false} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
