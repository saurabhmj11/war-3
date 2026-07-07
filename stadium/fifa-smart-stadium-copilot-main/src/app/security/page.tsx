'use client';

import React, { useState, useEffect } from 'react';
import { RoleGuard } from '@/components/auth/role-guard';
import { Incident, Gate, Announcement } from '@/domain/types';
import { repository } from '@/lib/db/repository';
import { EmergencyCopilotService } from '@/lib/ai/emergency-copilot';
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
} from 'lucide-react';

export default function SecurityDashboardPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [gates, setGates] = useState<Gate[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);
  const [overrideGateId, setOverrideGateId] = useState<string | null>(null);

  useEffect(() => {
    const unsubInc = repository.subscribe<Incident>('incidents', (data) =>
      setIncidents(data.filter((i) => i.incidentType === 'SECURITY' || i.incidentType === 'CROWD_CONGESTION'))
    );
    const unsubGates = repository.subscribe<Gate>('gates', (data) => setGates(data));
    const unsubAnn = repository.subscribe<Announcement>('announcements', (data) => setAnnouncements(data));

    return () => {
      unsubInc();
      unsubGates();
      unsubAnn();
    };
  }, []);

  const handleBroadcast = async () => {
    setIsBroadcasting(true);
    setBroadcastSuccess(false);
    try {
      await EmergencyCopilotService.broadcastEmergencyAlert(
        'Security advisory: Please maintain clear concourse pathways and report any unattended bags to nearest perimeter staff.',
        ['101', '102', '108', '110', '112'],
        'HIGH'
      );
      setBroadcastSuccess(true);
    } catch (err) {
      console.error('Broadcast error:', err);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleDeterministicOverride = async (gateId: string) => {
    setOverrideGateId(gateId);
    try {
      await EmergencyCopilotService.triggerDeterministicEvacuationOverride(gateId);
    } catch (err) {
      console.error('Override error:', err);
    } finally {
      setOverrideGateId(null);
    }
  };

  return (
    <RoleGuard allowedRoles={['SECURITY', 'OPERATIONS', 'ADMIN']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-red-400 font-mono">
                PERSONA 4: SARAH JENKINS • PERIMETER SECURITY LEAD
              </span>
              <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-mono">
                SEC-COMMAND
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 flex items-center gap-2.5">
              <Shield className="w-7 h-7 text-red-400" />
              <span>Security Threat Tracking & Evacuation Overrides</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Monitor concourse anomalies and dispatch 8-language PA announcements. Execute deterministic, non-LLM safety overrides during life-critical evacuations.
            </p>
          </div>
        </div>

        {/* Two Columns: Threat Feed & Gate Evacuation Overrides */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Active Threats & Crowd Congestion Alerts (6 Cols) */}
          <div className="lg:col-span-6 w-full space-y-6">
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                  <span>Active Security & Crowd Alerts</span>
                </h3>
                <span className="text-xs font-mono text-slate-400">PRIORITY SORTED</span>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800">
                {incidents.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    🟢 All concourse sectors and perimeter gates secure. Zero anomalies reported.
                  </div>
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

            {/* 8-Language Simultaneous PA Broadcast Box */}
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Radio className="w-5 h-5 text-teal-400" />
                  <span>8-Language Simultaneous PA Broadcast</span>
                </h3>
                <span className="text-[10px] font-mono bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full">
                  &lt; 10s TRANSLATION
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Trigger instant, localized security advisories across all 8 supported World Cup languages (English, Spanish, French, Portuguese, Arabic, Japanese, Hindi, German) to prevent panic.
              </p>

              <div className="pt-2">
                {broadcastSuccess ? (
                  <div className="w-full py-3 rounded-xl bg-teal-500/20 border border-teal-500 text-teal-300 text-xs font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Broadcast Dispatched Across 8 Languages!</span>
                  </div>
                ) : (
                  <button
                    onClick={handleBroadcast}
                    disabled={isBroadcasting}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-extrabold text-xs shadow-lg shadow-teal-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
                  >
                    {isBroadcasting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                    <span>Dispatch 8-Language Concourse Advisory</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Deterministic Gate Evacuation Overrides (6 Cols) */}
          <div className="lg:col-span-6 w-full space-y-6">
            <div className="bg-gradient-to-br from-slate-900 via-red-950/20 to-slate-900 border border-red-500/40 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-5">
              <div className="flex items-center justify-between border-b border-red-500/30 pb-4">
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                  <span>CRITICAL SAFETY: Deterministic Gate Overrides</span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full border border-red-500/30">
                  ZERO LLM BYPASS
                </span>
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
                        isOverrideActive
                          ? 'bg-red-950/40 border-red-500 shadow-lg shadow-red-500/20'
                          : 'bg-slate-950/80 border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-white uppercase">{gate.name}</span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                            isOverrideActive ? 'bg-red-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {gate.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 font-mono">
                          Wait: {gate.currentWaitMinutes}m • Velocity: {gate.turnstileVelocityPerMin}/m
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeterministicOverride(gate.gateId)}
                        disabled={isWorking || isOverrideActive}
                        className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0 ${
                          isOverrideActive
                            ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                            : 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-900/50 active:scale-95'
                        }`}
                      >
                        {isWorking ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : isOverrideActive ? (
                          <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Lock className="w-3.5 h-3.5" />
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
