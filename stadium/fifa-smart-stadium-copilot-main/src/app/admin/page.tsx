'use client';

import React from 'react';
import { RoleGuard } from '@/components/auth/role-guard';
import {
  Lock,
  Server,
  Cpu,
  Database,
  Activity,
  DollarSign,
  ShieldCheck,
  Zap,
  FileText,
  Users,
  CheckCircle2,
  TrendingDown,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const PROMPT_GOVERNANCE = [
    {
      copilot: '1. Fan Navigation & Concessions',
      model: 'gemini-2.5-flash',
      version: 'v2.4.1 (Stable)',
      tokensAvg: '380 in / 140 out',
      caching: '75% Context Cache Savings',
      status: 'ACTIVE',
    },
    {
      copilot: '2. Volunteer Incident Classifier',
      model: 'gemini-2.5-flash / Vision',
      version: 'v2.1.0 (Multimodal)',
      tokensAvg: '1,200 in / 280 out',
      caching: '60% Context Cache Savings',
      status: 'ACTIVE',
    },
    {
      copilot: '3. Operations What-If Sandbox',
      model: 'gemini-2.5-pro',
      version: 'v3.0.0 (Reasoning)',
      tokensAvg: '3,400 in / 850 out',
      caching: '45% Schema Pruning',
      status: 'ACTIVE',
    },
    {
      copilot: '4. Multilingual Emergency Coordinator',
      model: 'gemini-2.5-flash',
      version: 'v1.8.0 (8-Lang PA)',
      tokensAvg: '620 in / 490 out',
      caching: '80% Static Schematic Cache',
      status: 'ACTIVE',
    },
  ];

  const SYSTEM_METRICS = [
    { label: 'Total Ingress Fans Processed', val: '70,000 / 82,500', icon: <Users className="w-5 h-5 text-emerald-400" />, trend: '84.8% Capacity' },
    { label: 'Average Gemini TTFT Latency', val: '1,150 ms', icon: <Zap className="w-5 h-5 text-cyan-400" />, trend: 'P95 < 1,500 ms SLA' },
    { label: 'Pub/Sub Eventarc Ingestion', val: '1,420 msgs / sec', icon: <Activity className="w-5 h-5 text-purple-400" />, trend: '0% Drop Rate' },
    { label: 'Projected Monthly GCP Cost', val: '$142.50 / stadium', icon: <DollarSign className="w-5 h-5 text-amber-400" />, trend: '68% Under Budget ($450)' },
  ];

  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                PERSONA 6: DAVID KIM • CLOUD INFRASTRUCTURE & AI LEAD
              </span>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono">
                GCP-ADMIN-ROOT
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 flex items-center gap-2.5">
              <Lock className="w-7 h-7 text-cyan-400" />
              <span>System Admin & Cloud Observability Portal</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Enterprise observability across Google Cloud BigQuery, Firestore indexes, Vertex AI token governance, and RBAC security policies.
            </p>
          </div>
        </div>

        {/* 4 Key Cloud Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SYSTEM_METRICS.map((met, i) => (
            <div key={i} className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 shadow-xl backdrop-blur-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800">{met.icon}</div>
                <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                  {met.trend}
                </span>
              </div>
              <div>
                <div className="text-2xl font-black text-white font-mono">{met.val}</div>
                <div className="text-xs text-slate-400 font-semibold mt-0.5">{met.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Prompt Governance & Model Routing Table */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <span>Prompt Governance & Model Routing Registry</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Strict guardrail versioning, token budgets, and context caching across our 4 domain-specialized AI Copilots.
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full">
              ZOD SCHEMA ENFORCED
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  <th className="py-3 px-4">AI Copilot Service</th>
                  <th className="py-3 px-4">Assigned Gemini Model</th>
                  <th className="py-3 px-4">Prompt Version</th>
                  <th className="py-3 px-4">Token Budget (Avg)</th>
                  <th className="py-3 px-4">Optimization Strategy</th>
                  <th className="py-3 px-4 text-right">Status</th>
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
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{row.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* GCP Serverless Infrastructure & Firestore Index Observability */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-400" />
              <span>Firestore Collection Schemas & Indexes</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              18 collections active (`gates`, `incidents`, `crowdMetrics`, `announcements`, etc.). Composite indexes configured in `firestore.indexes.json` for high-speed geo-spatial querying and severity sorting.
            </p>
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 font-mono text-[11px] text-emerald-400 space-y-1">
              <div>✔ Index: incidents [stadiumId ASC, severity DESC]</div>
              <div>✔ Index: crowdMetrics [stadiumId ASC, riskLevel DESC]</div>
              <div>✔ Index: tasks [assignedToVolunteerId ASC, priority DESC]</div>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-purple-400" />
              <span>GCP Serverless Architecture Status</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Cloud Run microservices auto-scale from 0 to 1,000 instances during match-day ingress surges. Cloud Memorystore Redis caches wait times to guarantee sub-second fan app rendering.
            </p>
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 font-mono text-[11px] text-cyan-400 space-y-1">
              <div>✔ Cloud Run: Auto-scaling active (0 - 1,000 pods)</div>
              <div>✔ Cloud Pub/Sub: Eventarc worker triggers healthy</div>
              <div>✔ Cloud Armor: DDoS & Rate-limiting enabled</div>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
