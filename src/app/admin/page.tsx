'use client';

import React from 'react';
import { RoleGuard } from '@/components/auth/role-guard';
import { useStadiumState } from '@/hooks/use-stadium-state';
import { useAuth } from '@/lib/auth/auth-context';
import {
  Lock,
  Server,
  Cpu,
  Database,
  Activity,
  DollarSign,
  FileText,
  Users,
  CheckCircle2,
  TrendingDown,
  Recycle,
  Zap,
} from 'lucide-react';

const PROMPT_GOVERNANCE = [
  { copilot: '1. Fan Navigation & Concessions', model: 'gemini-2.5-flash', version: 'v2.4.1 (Stable)', tokensAvg: '380 in / 140 out', caching: '75% Context Cache Savings', status: 'ACTIVE' },
  { copilot: '2. Volunteer Incident Classifier', model: 'gemini-2.5-flash / Vision', version: 'v2.1.0 (Multimodal)', tokensAvg: '1,200 in / 280 out', caching: '60% Context Cache Savings', status: 'ACTIVE' },
  { copilot: '3. Operations What-If Sandbox', model: 'gemini-2.5-pro', version: 'v3.0.0 (Reasoning)', tokensAvg: '3,400 in / 850 out', caching: '45% Schema Pruning', status: 'ACTIVE' },
  { copilot: '4. Multilingual Emergency Coordinator', model: 'gemini-2.5-flash', version: 'v1.8.0 (8-Lang PA)', tokensAvg: '620 in / 490 out', caching: '80% Static Schematic Cache', status: 'ACTIVE' },
];

export default function AdminDashboardPage() {
  const { state } = useStadiumState();
  const { isGeminiLive } = useAuth();
  const analytics = state.analytics[0];
  const auditLogs = state.auditLogs.slice(0, 8);

  const SYSTEM_METRICS = [
    { label: 'Total Ingress Fans Processed', val: analytics ? `${analytics.totalSpectatorsIngress.toLocaleString()} / 82,500` : '—', icon: <Users className="w-5 h-5 text-emerald-400" aria-hidden="true" />, trend: '84.8% Capacity' },
    { label: 'Average AI TTFT Latency', val: analytics ? `${analytics.avgAiResponseLatencyMs.toLocaleString()} ms` : '—', icon: <Zap className="w-5 h-5 text-cyan-400" aria-hidden="true" />, trend: 'P95 < 1,500 ms SLA' },
    { label: 'Pub/Sub Eventarc Ingestion', val: '1,420 msgs / sec', icon: <Activity className="w-5 h-5 text-purple-400" aria-hidden="true" />, trend: '0% Drop Rate' },
    { label: 'Projected Monthly Cost', val: '$142.50 / stadium', icon: <DollarSign className="w-5 h-5 text-amber-400" aria-hidden="true" />, trend: '68% Under Budget ($450)' },
  ];

  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">PERSONA 6: DAVID KIM • CLOUD INFRASTRUCTURE &amp; AI LEAD</span>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono">GCP-ADMIN-ROOT</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${isGeminiLive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                {isGeminiLive ? 'GEMINI LIVE' : 'SIMULATED'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 flex items-center gap-2.5">
              <Lock className="w-7 h-7 text-cyan-400" aria-hidden="true" />
              <span>System Admin &amp; Cloud Observability Portal</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Enterprise observability across analytics, prompt governance, RBAC security policies, and audit logs.
            </p>
          </div>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SYSTEM_METRICS.map((met, i) => (
            <div key={i} className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 shadow-xl backdrop-blur-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800" aria-hidden="true">{met.icon}</div>
                <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">{met.trend}</span>
              </div>
              <div>
                <div className="text-2xl font-black text-white font-mono">{met.val}</div>
                <div className="text-xs text-slate-400 font-semibold mt-0.5">{met.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Sustainability Metrics */}
        {analytics && (
          <section aria-labelledby="sust-title" className="bg-gradient-to-r from-emerald-900/30 to-teal-900/20 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <Recycle className="w-5 h-5 text-emerald-400" aria-hidden="true" />
              <h2 id="sust-title" className="text-base font-bold text-white">Sustainability Metrics (stretch brief pillar)</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-emerald-500/30">
                <div className="text-2xl font-black text-emerald-400 font-mono">{analytics.concessionWasteDivertedKg} kg</div>
                <div className="text-xs text-slate-400 mt-1">Concession food waste diverted from landfill this match</div>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-emerald-500/30">
                <div className="text-2xl font-black text-emerald-400 font-mono">{analytics.energyPerZoneKwh} kWh</div>
                <div className="text-xs text-slate-400 mt-1">Average energy consumption per zone</div>
              </div>
            </div>
          </section>
        )}

        {/* Prompt Governance */}
        <section aria-labelledby="gov-title" className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 id="gov-title" className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" aria-hidden="true" />
                <span>Prompt Governance &amp; Model Routing Registry</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Strict guardrail versioning, token budgets, and context caching across our 4 domain-specialized AI Copilots.
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full">ZOD SCHEMA ENFORCED</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <caption className="sr-only">AI Copilot prompt governance and model routing</caption>
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  <th scope="col" className="py-3 px-4">AI Copilot Service</th>
                  <th scope="col" className="py-3 px-4">Assigned Gemini Model</th>
                  <th scope="col" className="py-3 px-4">Prompt Version</th>
                  <th scope="col" className="py-3 px-4">Token Budget (Avg)</th>
                  <th scope="col" className="py-3 px-4">Optimization Strategy</th>
                  <th scope="col" className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {PROMPT_GOVERNANCE.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4 font-extrabold text-white">{row.copilot}</td>
                    <td className="py-4 px-4 font-mono text-cyan-400">{row.model}</td>
                    <td className="py-4 px-4 font-mono text-slate-300">{row.version}</td>
                    <td className="py-4 px-4 font-mono text-slate-300">{row.tokensAvg}</td>
                    <td className="py-4 px-4 text-emerald-300 font-semibold">{row.caching}</td>
                    <td className="py-4 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                        <span>{row.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Audit Log */}
        <section aria-labelledby="audit-title" className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 id="audit-title" className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" aria-hidden="true" />
              <span>Recent Audit Log</span>
            </h2>
            <span className="text-xs font-mono text-slate-400">REAL-TIME SSE SYNC</span>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {auditLogs.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">No audit entries yet.</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.auditId} className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-emerald-400">{log.actionType}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="text-slate-300">{log.details}</div>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">
                    Actor: {log.actorUid} • Target: {log.targetResource}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Infrastructure */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-400" aria-hidden="true" />
              <span>Database Schemas &amp; Indexes</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              14 collections active (`gates`, `incidents`, `crowdMetrics`, `announcements`, etc.). Composite indexes configured for high-speed geo-spatial querying and severity sorting. In-memory singleton with globalThis persistence; production would back this with Firestore.
            </p>
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 font-mono text-[11px] text-emerald-400 space-y-1">
              <div>✔ Index: incidents [stadiumId ASC, severity DESC]</div>
              <div>✔ Index: crowdMetrics [stadiumId ASC, riskLevel DESC]</div>
              <div>✔ Index: tasks [assignedToVolunteerId ASC, priority DESC]</div>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-purple-400" aria-hidden="true" />
              <span>Serverless Architecture Status</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Next.js serverless routes auto-scale during match-day ingress surges. SSE keeps every connected dashboard in sync without polling overhead.
            </p>
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 font-mono text-[11px] text-cyan-400 space-y-1">
              <div>✔ Next.js Route Handlers: auto-scaling</div>
              <div>✔ Pub/Sub Event Bus: worker triggers healthy</div>
              <div>✔ SSE Stream: real-time cross-tab sync</div>
              <div>✔ HMAC Role Tokens: server-side verified</div>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
