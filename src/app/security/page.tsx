'use client';

import React, { useState } from 'react';
import { RoleGuard } from '@/components/auth/role-guard';
import { useStadiumState } from '@/hooks/use-stadium-state';
import { api } from '@/lib/api-client';
import {
  Shield,
  ShieldAlert,
  AlertTriangle,
  Lock,
  Unlock,
  Radio,
  CheckCircle2,
  Users,
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

  const handleDeterministicOverride = async (gateId: string) => {
    setOverrideGateId(gateId);
    setError(null);
    try {
      await api.triggerGateOverride(gateId);
    } catch (err) {
      const e = err as Error & { status?: number };
      setError(e.status === 403 ? 'Your role cannot trigger evacuation overrides.' : e.message || 'Override failed.');
    } finally {
      setOverrideGateId(null);
    }
  };

  return (
    <RoleGuard allowedRoles={['SECURITY', 'OPERATIONS', 'ADMIN']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-red-400 font-mono">PERSONA 4: SARAH JENKINS • PERIMETER SECURITY LEAD</span>
              <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-mono">SEC-COMMAND</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 flex items-center gap-2.5">
              <Shield className="w-7 h-7 text-red-400" aria-hidden="true" />
              <span>Security Threat Tracking &amp; Evacuation Overrides</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Monitor concourse anomalies and dispatch 8-language PA announcements. Execute deterministic, non-LLM safety overrides during life-critical evacuations.
            </p>
          </div>
        </header>

        {error && (
          <div role="alert" className="rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Active threats + Broadcast */}
          <div className="lg:col-span-6 w-full space-y-6">
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-400" aria-hidden="true" />
                  <span>Active Security &amp; Crowd Alerts</span>
                </h3>
                <span className="text-xs font-mono text-slate-400">PRIORITY SORTED</span>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {incidents.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">🟢 All concourse sectors and perimeter gates secure. Zero anomalies reported.</div>
                ) : (
                  incidents.map((inc) => (
                    <div key={inc.incidentId} className="bg-slate-950/80 border border-red-500/30 p-4 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/30">
                          SEVERITY {inc.severity} • {inc.incidentType}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">Sector {inc.location.sector}</span>
                      </div>
                      <div className="text-xs font-bold text-white">{inc.description}</div>
                      {inc.aiSummary && (
                        <div className="text-[11px] text-slate-300 bg-slate-900 p-2.5 rounded-xl border border-slate-800 font-mono">
                          ⚡ AI Triage: {inc.aiSummary}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Radio className="w-5 h-5 text-teal-400" aria-hidden="true" />
                  <span>8-Language Simultaneous PA Broadcast</span>
                </h3>
                <span className="text-[10px] font-mono bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full">&lt; 10s TRANSLATION</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Trigger instant, localized security advisories across all 8 supported World Cup languages (English, Spanish, French, Portuguese, Arabic, Japanese, Hindi, German) to prevent panic.
              </p>
              <div className="pt-2">
                {broadcastSuccess ? (
                  <div className="w-full py-3 rounded-xl bg-teal-500/20 border border-teal-500 text-teal-300 text-xs font-bold flex items-center justify-center gap-2" role="status">
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    <span>Broadcast Dispatched Across 8 Languages!</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleBroadcast}
                    disabled={isBroadcasting}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-extrabold text-xs shadow-lg shadow-teal-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                  >
                    {isBroadcasting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                    ) : (
                      <Volume2 className="w-4 h-4" aria-hidden="true" />
                    )}
                    <span>Dispatch 8-Language Concourse Advisory</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right: Deterministic Gate Overrides */}
          <div className="lg:col-span-6 w-full space-y-6">
            <div className="bg-gradient-to-br from-slate-900 via-red-950/20 to-slate-900 border border-red-500/40 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-5">
              <div className="flex items-center justify-between border-b border-red-500/30 pb-4">
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 animate-pulse" aria-hidden="true" />
                  <span>CRITICAL SAFETY: Deterministic Gate Overrides</span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full border border-red-500/30">ZERO LLM BYPASS</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                In strict compliance with international tournament safety standards, life-critical gate unlock commands and fire evacuation alarms <span className="text-white font-bold underline">bypass LLM generation entirely</span>. These buttons execute hardcoded, deterministic safety scripts with zero latency and zero hallucination risk.
              </p>

              <div className="space-y-3 pt-2">
                {gates.map((gate) => {
                  const isOverrideActive = gate.status === 'EMERGENCY_EXIT_ONLY';
                  const isWorking = overrideGateId === gate.gateId;
                  return (
                    <div
                      key={gate.gateId}
                      className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                        isOverrideActive ? 'bg-red-950/40 border-red-500 shadow-lg shadow-red-500/20' : 'bg-slate-950/80 border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-extrabold text-white uppercase">{gate.name}</span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${isOverrideActive ? 'bg-red-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                            {gate.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 font-mono">
                          Wait: {gate.currentWaitMinutes}m • Velocity: {gate.turnstileVelocityPerMin}/m
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeterministicOverride(gate.gateId)}
                        disabled={isWorking || isOverrideActive}
                        aria-label={`${isOverrideActive ? 'Override active on' : 'Trigger deterministic evacuation override on'} ${gate.name}`}
                        className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 ${
                          isOverrideActive
                            ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                            : 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-900/50 active:scale-95'
                        }`}
                      >
                        {isWorking ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                        ) : isOverrideActive ? (
                          <Unlock className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                        ) : (
                          <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                        <span>{isOverrideActive ? 'LOCKED OPEN (EMERGENCY)' : 'TRIGGER OVERRIDE'}</span>
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
