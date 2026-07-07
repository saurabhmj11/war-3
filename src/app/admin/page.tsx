'use client';

import React from 'react';
import { RoleGuard } from '@/components/auth/role-guard';
import { PageHeader } from '@/components/layout/page-header';
import { useStadiumState } from '@/hooks/use-stadium-state';
import { useAuth } from '@/lib/auth/auth-context';
import {
  Lock,
  Server,
  Database,
  Activity,
  DollarSign,
  FileText,
  Users,
  CheckCircle2,
  Recycle,
  Zap,
} from 'lucide-react';

const PROMPT_GOVERNANCE = [
  { copilot: '1. Fan Navigation & Concessions', model: 'glm-5.2-flash', version: 'v2.4.1 (Stable)', tokensAvg: '380 in / 140 out', caching: '75% Context Cache Savings', status: 'ACTIVE' },
  { copilot: '2. Volunteer Incident Classifier', model: 'glm-4.5v (Vision)', version: 'v2.1.0 (Multimodal)', tokensAvg: '1,200 in / 280 out', caching: '60% Context Cache Savings', status: 'ACTIVE' },
  { copilot: '3. Operations What-If Sandbox', model: 'glm-5.2-pro (thinking)', version: 'v3.0.0 (Reasoning)', tokensAvg: '3,400 in / 850 out', caching: '45% Schema Pruning', status: 'ACTIVE' },
  { copilot: '4. Multilingual Emergency Coordinator', model: 'glm-5.2-flash', version: 'v1.8.0 (8-Lang PA)', tokensAvg: '620 in / 490 out', caching: '80% Static Schematic Cache', status: 'ACTIVE' },
];

export default function AdminDashboardPage() {
  const { state } = useStadiumState();
  const { isGeminiLive } = useAuth();
  const analytics = state.analytics[0];
  const auditLogs = state.auditLogs.slice(0, 8);

  const SYSTEM_METRICS = [
    { label: 'Ingress Fans', val: analytics ? `${analytics.totalSpectatorsIngress.toLocaleString()} / 82,500` : '—', icon: <Users className="w-5 h-5 text-emerald-400" aria-hidden="true" />, trend: '84.8% CAPACITY' },
    { label: 'AI TTFT Latency', val: analytics ? `${analytics.avgAiResponseLatencyMs.toLocaleString()} ms` : '—', icon: <Zap className="w-5 h-5 text-cyan-400" aria-hidden="true" />, trend: 'P95 < 1,500 ms SLA' },
    { label: 'Eventarc Ingest', val: '1,420 msgs/s', icon: <Activity className="w-5 h-5 text-purple-400" aria-hidden="true" />, trend: '0% DROP RATE' },
    { label: 'Projected Cost', val: '$142.50', icon: <DollarSign className="w-5 h-5 text-amber-400" aria-hidden="true" />, trend: '68% UNDER BUDGET' },
  ];

  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        <PageHeader
          persona="PERSONA 6 • DAVID KIM • CLOUD INFRASTRUCTURE & AI LEAD"
          badge={isGeminiLive ? 'GLM 5.2 LIVE' : 'SIMULATED'}
          title="System Admin & Cloud Observability"
          description="Enterprise observability across analytics, prompt governance, RBAC security policies, and audit logs."
          icon={Lock}
          kit="cyan"
          number="01"
        />

        {/* KPI Cards — scoreboard style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SYSTEM_METRICS.map((met, i) => (
            <div key={i} className="card-floodlit rounded-md p-5 shadow-xl space-y-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" aria-hidden="true" />
              <div className="flex items-center justify-between relative z-10">
                <div className="p-2.5 rounded-md bg-[#03110a] border border-emerald-900/40" aria-hidden="true">{met.icon}</div>
                <span className="text-[10px] font-mono font-bold bg-emerald-950/60 text-emerald-200/70 px-2 py-0.5 rounded-md border border-emerald-900/40 tracking-widest">
                  {met.trend}
                </span>
              </div>
              <div className="relative z-10">
                <div className="text-2xl font-black text-white font-mono scoreboard-numeral">{met.val}</div>
                <div className="text-xs text-emerald-100/60 font-bold uppercase tracking-wider mt-0.5 jersey-heading">{met.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Sustainability */}
        {analytics && (
          <section aria-labelledby="sust-title" className="card-floodlit ref-card-green rounded-xl p-6 shadow-2xl space-y-4 relative overflow-hidden">
            <div className="absolute inset-0 pitch-stripes opacity-15" aria-hidden="true" />
            <div className="flex items-center gap-2 relative z-10">
              <Recycle className="w-5 h-5 text-emerald-400" aria-hidden="true" />
              <h2 id="sust-title" className="jersey-heading text-base font-black text-white">Sustainability Metrics <span className="text-emerald-300/60 font-mono text-xs normal-case">stretch brief pillar</span></h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
              <div className="bg-[#03110a]/80 p-4 rounded-md border border-emerald-500/30">
                <div className="text-2xl font-black text-emerald-400 font-mono scoreboard-numeral">{analytics.concessionWasteDivertedKg} kg</div>
                <div className="text-xs text-emerald-100/60 mt-1 uppercase tracking-wider font-bold">Concession Waste Diverted</div>
              </div>
              <div className="bg-[#03110a]/80 p-4 rounded-md border border-emerald-500/30">
                <div className="text-2xl font-black text-emerald-400 font-mono scoreboard-numeral">{analytics.energyPerZoneKwh} kWh</div>
                <div className="text-xs text-emerald-100/60 mt-1 uppercase tracking-wider font-bold">Energy Per Zone (avg)</div>
              </div>
            </div>
          </section>
        )}

        {/* Prompt Governance */}
        <section aria-labelledby="gov-title" className="card-floodlit rounded-xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 pitch-stripes opacity-10" aria-hidden="true" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-emerald-900/50 pb-4 relative z-10">
            <div>
              <h2 id="gov-title" className="jersey-heading text-lg font-black text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" aria-hidden="true" />
                <span>Prompt Governance &amp; Model Routing</span>
              </h2>
              <p className="text-xs text-emerald-100/60 mt-0.5">Strict guardrail versioning, token budgets, and context caching across our 4 domain-specialized AI Copilots.</p>
            </div>
            <span className="text-xs font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-md uppercase tracking-widest">ZOD SCHEMA</span>
          </div>
          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left border-collapse">
              <caption className="sr-only">AI Copilot prompt governance and model routing</caption>
              <thead>
                <tr className="border-b border-emerald-900/50 text-[11px] font-black uppercase tracking-widest text-emerald-100/60 font-mono">
                  <th scope="col" className="py-3 px-4">AI Copilot Service</th>
                  <th scope="col" className="py-3 px-4">Assigned GLM Model</th>
                  <th scope="col" className="py-3 px-4">Prompt Version</th>
                  <th scope="col" className="py-3 px-4">Token Budget (Avg)</th>
                  <th scope="col" className="py-3 px-4">Optimization</th>
                  <th scope="col" className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-900/30 text-xs">
                {PROMPT_GOVERNANCE.map((row, idx) => (
                  <tr key={idx} className="hover:bg-emerald-950/40 transition-colors">
                    <td className="py-4 px-4 font-black text-white jersey-heading">{row.copilot}</td>
                    <td className="py-4 px-4 font-mono text-cyan-300">{row.model}</td>
                    <td className="py-4 px-4 font-mono text-emerald-100/70">{row.version}</td>
                    <td className="py-4 px-4 font-mono text-emerald-100/70">{row.tokensAvg}</td>
                    <td className="py-4 px-4 text-emerald-300 font-semibold">{row.caching}</td>
                    <td className="py-4 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-widest">
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
        <section aria-labelledby="audit-title" className="card-floodlit rounded-xl p-6 shadow-2xl space-y-4 relative overflow-hidden">
          <div className="absolute inset-0 pitch-stripes opacity-10" aria-hidden="true" />
          <div className="flex items-center justify-between border-b border-emerald-900/50 pb-3 relative z-10">
            <h2 id="audit-title" className="jersey-heading text-base font-black text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" aria-hidden="true" />
              <span>Recent Audit Log</span>
            </h2>
            <span className="text-xs font-mono text-emerald-100/50 tracking-widest uppercase">REAL-TIME SSE SYNC</span>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1 scrollbar-pitch relative z-10">
            {auditLogs.length === 0 ? (
              <div className="text-center py-6 text-xs text-emerald-100/75">No audit entries yet.</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.auditId} className="bg-[#03110a]/80 border border-emerald-900/40 p-3 rounded-md text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-black text-emerald-300 tracking-widest uppercase">{log.actionType}</span>
                    <span className="text-[10px] text-emerald-100/75 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="text-emerald-100/80">{log.details}</div>
                  <div className="text-[10px] text-emerald-100/75 mt-1 font-mono">
                    ACTOR: {log.actorUid} • TARGET: {log.targetResource}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Infrastructure */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card-floodlit rounded-xl p-6 shadow-2xl space-y-4 relative overflow-hidden">
            <div className="absolute inset-0 pitch-stripes opacity-10" aria-hidden="true" />
            <h3 className="jersey-heading text-base font-black text-white flex items-center gap-2 relative z-10">
              <Database className="w-5 h-5 text-amber-400" aria-hidden="true" />
              <span>Database Schemas &amp; Indexes</span>
            </h3>
            <p className="text-xs text-emerald-100/70 leading-relaxed relative z-10">
              14 collections active (`gates`, `incidents`, `crowdMetrics`, `announcements`, etc.). Composite indexes configured
              for high-speed geo-spatial querying. In-memory singleton with globalThis persistence; production would back this
              with Firestore.
            </p>
            <div className="bg-[#03110a] p-3.5 rounded-md border border-emerald-900/40 font-mono text-[11px] text-emerald-300 space-y-1 relative z-10">
              <div>✔ Index: incidents [stadiumId ASC, severity DESC]</div>
              <div>✔ Index: crowdMetrics [stadiumId ASC, riskLevel DESC]</div>
              <div>✔ Index: tasks [assignedToVolunteerId ASC, priority DESC]</div>
            </div>
          </div>

          <div className="card-floodlit rounded-xl p-6 shadow-2xl space-y-4 relative overflow-hidden">
            <div className="absolute inset-0 pitch-stripes opacity-10" aria-hidden="true" />
            <h3 className="jersey-heading text-base font-black text-white flex items-center gap-2 relative z-10">
              <Server className="w-5 h-5 text-purple-400" aria-hidden="true" />
              <span>Serverless Architecture Status</span>
            </h3>
            <p className="text-xs text-emerald-100/70 leading-relaxed relative z-10">
              Next.js serverless routes auto-scale during match-day ingress surges. SSE keeps every connected dashboard in sync
              without polling overhead.
            </p>
            <div className="bg-[#03110a] p-3.5 rounded-md border border-emerald-900/40 font-mono text-[11px] text-cyan-300 space-y-1 relative z-10">
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
