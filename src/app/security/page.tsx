'use client';

import React, { useState } from 'react';
import { RoleGuard } from '@/components/auth/role-guard';
import { PageHeader } from '@/components/layout/page-header';
import { useStadiumState } from '@/hooks/use-stadium-state';
import { useGoalCelebration } from '@/components/football/goal-celebration';
import { api } from '@/lib/api-client';
import {
  Shield,
  ShieldAlert,
  AlertTriangle,
  Lock,
  Unlock,
  Radio,
  CheckCircle2,
  Volume2,
  AlertCircle,
} from 'lucide-react';

const BROADCAST_MESSAGE =
  'Security advisory: Please maintain clear concourse pathways and report any unattended bags to nearest perimeter staff.';

export default function SecurityDashboardPage() {
  const { state } = useStadiumState();
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);
  const [overrideGateId, setOverrideGateId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const goal = useGoalCelebration();

  const incidents = state.incidents.filter((i) => i.incidentType === 'SECURITY' || i.incidentType === 'CROWD_CONGESTION');
  const gates = state.gates;

  const handleBroadcast = async () => {
    setIsBroadcasting(true);
    setBroadcastSuccess(false);
    setError(null);
    try {
      await api.broadcastEmergency({
        summaryEn: BROADCAST_MESSAGE,
        targetSectors: ['101', '102', '108', '110', '112'],
        priority: 'HIGH',
      });
      setBroadcastSuccess(true);
    } catch (err) {
      const e = err as Error & { status?: number };
      setError(e.status === 403 ? 'Your role cannot dispatch broadcasts. Switch to SECURITY or ADMIN.' : e.message || 'Broadcast failed.');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleDeterministicOverride = async (gateId: string, e?: React.MouseEvent) => {
    setOverrideGateId(gateId);
    setError(null);
    try {
      await api.triggerGateOverride(gateId);
      // Fire a goal celebration at the click point — "OVERRIDE!" like a keeper scoring
      if (e) goal.fire(e.clientX, e.clientY, 'OVERRIDE!');
    } catch (err) {
      const errr = err as Error & { status?: number };
      setError(errr.status === 403 ? 'Your role cannot trigger evacuation overrides.' : errr.message || 'Override failed.');
    } finally {
      setOverrideGateId(null);
    }
  };

  return (
    <RoleGuard allowedRoles={['SECURITY', 'OPERATIONS', 'ADMIN']}>
      {goal.node}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        <PageHeader
          persona="PERSONA 4 • SARAH JENKINS • PERIMETER SECURITY LEAD"
          badge="SEC-COMMAND"
          title="Security Threat & Evacuation Overrides"
          description="Monitor concourse anomalies and dispatch 8-language PA announcements. Execute deterministic, non-LLM safety overrides during life-critical evacuations."
          icon={Shield}
          kit="red"
          number="04"
        />

        {error && (
          <div role="alert" className="rounded-md bg-red-500/15 border border-red-500/40 text-red-300 text-xs p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Threats + Broadcast */}
          <div className="lg:col-span-6 w-full space-y-6">
            <div className="card-floodlit ref-card-red rounded-xl p-6 shadow-2xl space-y-4 relative overflow-hidden">
              <div className="absolute inset-0 pitch-stripes opacity-10" aria-hidden="true" />
              <div className="flex items-center justify-between border-b border-emerald-900/50 pb-3 relative z-10">
                <h3 className="jersey-heading text-base font-black text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-400" aria-hidden="true" />
                  <span>Active Threats</span>
                </h3>
                <span className="text-xs font-mono text-emerald-100/50 tracking-widest uppercase">PRIORITY SORTED</span>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1 scrollbar-pitch relative z-10">
                {incidents.length === 0 ? (
                  <div className="text-center py-8 text-xs text-emerald-100/75">
                    🟢 All concourse sectors and perimeter gates secure. Zero anomalies reported.
                  </div>
                ) : (
                  incidents.map((inc) => (
                    <div key={inc.incidentId} className="bg-[#03110a]/80 border border-red-500/30 p-4 rounded-md space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/40 tracking-widest uppercase">
                          SEV {inc.severity} • {inc.incidentType}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-100/50">SECTOR {inc.location.sector}</span>
                      </div>
                      <div className="text-xs font-bold text-white">{inc.description}</div>
                      {inc.aiSummary && (
                        <div className="text-[11px] text-emerald-100/80 bg-[#0a1f15] p-2.5 rounded-md border border-emerald-900/40 font-mono">
                          ⚡ AI Triage: {inc.aiSummary}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card-floodlit rounded-xl p-6 shadow-2xl space-y-4 relative overflow-hidden">
              <div className="absolute inset-0 pitch-stripes opacity-10" aria-hidden="true" />
              <div className="flex items-center justify-between border-b border-emerald-900/50 pb-3 relative z-10">
                <h3 className="jersey-heading text-base font-black text-white flex items-center gap-2">
                  <Radio className="w-5 h-5 text-teal-400" aria-hidden="true" />
                  <span>8-Language PA Broadcast</span>
                </h3>
                <span className="text-[10px] font-mono bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-md border border-teal-500/40 font-bold">&lt; 10s</span>
              </div>
              <p className="text-xs text-emerald-100/70 leading-relaxed relative z-10">
                Trigger instant, localized security advisories across all 8 supported World Cup languages to prevent panic.
              </p>
              <div className="pt-2 relative z-10">
                {broadcastSuccess ? (
                  <div className="w-full py-3 rounded-md bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs font-black flex items-center justify-center gap-2 uppercase tracking-wider" role="status">
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    <span>Dispatched Across 8 Languages!</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleBroadcast}
                    disabled={isBroadcasting}
                    className="w-full py-3.5 rounded-md bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-black text-xs uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                  >
                    {isBroadcasting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spin-ball" aria-hidden="true" />
                    ) : (
                      <Volume2 className="w-4 h-4" aria-hidden="true" />
                    )}
                    <span>Dispatch 8-Language Advisory</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right: Deterministic Gate Overrides */}
          <div className="lg:col-span-6 w-full space-y-6">
            <div className="card-floodlit ref-card-red rounded-xl p-6 shadow-2xl space-y-5 relative overflow-hidden">
              <div className="absolute inset-0 pitch-stripes opacity-15" aria-hidden="true" />
              <div className="flex items-center justify-between border-b border-red-500/30 pb-4 relative z-10">
                <div className="flex items-center gap-2 text-red-300 font-black text-sm jersey-heading">
                  <AlertTriangle className="w-5 h-5 animate-pulse" aria-hidden="true" />
                  <span>DETERMINISTIC GATE OVERRIDES</span>
                </div>
                <span className="text-[10px] font-mono font-black bg-red-500/20 text-red-300 px-2 py-0.5 rounded-md border border-red-500/40">ZERO LLM BYPASS</span>
              </div>

              <p className="text-xs text-emerald-100/70 leading-relaxed relative z-10">
                In strict compliance with international tournament safety standards, life-critical gate unlock commands and fire
                evacuation alarms <span className="text-white font-black underline">bypass LLM generation entirely</span>. These
                buttons execute hardcoded, deterministic safety scripts with zero latency and zero hallucination risk.
              </p>

              <div className="space-y-3 pt-2 relative z-10">
                {gates.map((gate) => {
                  const isOverrideActive = gate.status === 'EMERGENCY_EXIT_ONLY';
                  const isWorking = overrideGateId === gate.gateId;
                  return (
                    <div
                      key={gate.gateId}
                      className={`p-4 rounded-md border flex items-center justify-between gap-4 transition-all ${
                        isOverrideActive ? 'bg-red-950/40 border-red-500 shadow-lg shadow-red-500/20' : 'bg-[#03110a]/80 border-emerald-900/40'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black text-white uppercase jersey-heading">{gate.name}</span>
                          <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-md ${isOverrideActive ? 'bg-red-500 text-[#03110a]' : 'bg-emerald-950 text-emerald-100/60'}`}>
                            {gate.status}
                          </span>
                        </div>
                        <div className="text-xs text-emerald-100/50 mt-0.5 font-mono">
                          WAIT: {gate.currentWaitMinutes}m • VELOCITY: {gate.turnstileVelocityPerMin}/m
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeterministicOverride(gate.gateId, e)}
                        disabled={isWorking || isOverrideActive}
                        aria-label={`${isOverrideActive ? 'Override active on' : 'Trigger deterministic evacuation override on'} ${gate.name}`}
                        className={`px-4 py-2.5 rounded-md text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 ${
                          isOverrideActive
                            ? 'bg-emerald-950 text-emerald-100/75 cursor-not-allowed border border-emerald-900/50'
                            : 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-900/50 active:scale-95'
                        }`}
                      >
                        {isWorking ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full spin-ball" aria-hidden="true" />
                        ) : isOverrideActive ? (
                          <Unlock className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                        ) : (
                          <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                        <span>{isOverrideActive ? 'LOCKED OPEN' : 'TRIGGER'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
