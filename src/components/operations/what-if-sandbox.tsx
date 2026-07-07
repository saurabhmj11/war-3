'use client';

import React, { useState } from 'react';
import { WhatIfScenarioDTO, WhatIfResultDTO } from '@/domain/types';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth/auth-context';
import {
  Sparkles,
  Play,
  CheckCircle2,
  TrendingDown,
  FileText,
  AlertCircle,
} from 'lucide-react';

const PRESET_SCENARIOS = [
  {
    label: '🚀 Reroute Gate C → Gate D',
    type: 'OPEN_AUXILIARY_GATE' as const,
    gate: 'gate-d',
    desc: 'Open all 8 auxiliary turnstiles at Gate D North Plaza to absorb commuter rail surge from Gate C.',
  },
  {
    label: '🚧 Emergency Gate C Closure',
    type: 'CLOSE_GATE' as const,
    gate: 'gate-c',
    desc: 'Close Gate C East Plaza due to mechanical turnstile failure and redirect commuter trains to Gate B South Plaza.',
  },
  {
    label: '👮 Deploy Mobile Scanner Team',
    type: 'REASSIGN_STAFF' as const,
    gate: 'gate-a',
    desc: 'Deploy 25 volunteer mobile scanning wands to Gate A VIP West Plaza to accelerate pre-match VIP ingress.',
  },
];

export const WhatIfSandbox: React.FC = () => {
  const { isGeminiLive } = useAuth();
  const [interventionType, setInterventionType] = useState<WhatIfScenarioDTO['interventionType']>('OPEN_AUXILIARY_GATE');
  const [targetGateId, setTargetGateId] = useState('gate-d');
  const [description, setDescription] = useState(
    'Open all 8 auxiliary turnstiles at Gate D North Plaza to absorb commuter rail surge from Gate C.'
  );
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<WhatIfResultDTO | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [summary, setSummary] = useState<{ markdown: string; engine: 'gemini' | 'simulated' } | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || isSimulating) return;
    setIsSimulating(true);
    setSimResult(null);
    setAppliedSuccess(false);
    setError(null);
    try {
      const data = await api.runWhatIf({
        stadiumId: 'metlife-ny-nj',
        interventionType,
        targetGateId,
        description,
      });
      setSimResult(data);
    } catch (err) {
      const e = err as Error & { status?: number };
      setError(e.status === 403 ? 'Your role cannot run What-If simulations. Switch to OPERATIONS or ADMIN.' : e.message || 'Simulation failed.');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleApply = async () => {
    if (!simResult || isApplying) return;
    setIsApplying(true);
    try {
      // Act 4 applies the What-If rerouting to live state.
      await api.triggerAct(4);
      setAppliedSuccess(true);
    } catch (err) {
      const e = err as Error & { status?: number };
      setError(e.status === 403 ? 'Your role cannot apply simulations.' : e.message || 'Failed to apply simulation.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleGenerateSummary = async () => {
    setIsSummarizing(true);
    setSummary(null);
    try {
      const data = await api.getOperationsSummary();
      setSummary({ markdown: data.markdown, engine: data.engine });
    } catch (err) {
      const e = err as Error & { status?: number };
      setError(e.status === 403 ? 'Your role cannot generate executive summaries.' : e.message || 'Failed to generate summary.');
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="w-full space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Configuration */}
        <div className="lg:col-span-6 w-full bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20" aria-hidden="true">
                <Sparkles className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>What-If Simulation Engine</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
                      isGeminiLive
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {isGeminiLive ? 'GEMINI 2.5 PRO' : 'SIMULATED'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Evaluate multi-variable interventions across live stadium telemetry</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Select preset scenario:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PRESET_SCENARIOS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInterventionType(preset.type);
                    setTargetGateId(preset.gate);
                    setDescription(preset.desc);
                  }}
                  className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-left text-xs text-slate-300 hover:text-white transition-all shadow-sm group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  aria-label={`Load preset: ${preset.label}`}
                >
                  <div className="font-bold truncate group-hover:text-amber-400">{preset.label}</div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">Click to configure</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSimulate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="whatif-intervention" className="block text-xs font-bold text-slate-400 uppercase mb-1.5">
                  Intervention action
                </label>
                <select
                  id="whatif-intervention"
                  value={interventionType}
                  onChange={(e) => setInterventionType(e.target.value as typeof interventionType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="OPEN_AUXILIARY_GATE">Open Auxiliary Turnstiles</option>
                  <option value="CLOSE_GATE">Close Entrance Gate</option>
                  <option value="REASSIGN_STAFF">Reassign Ground Staff</option>
                  <option value="TRANSIT_DELAY">Hold Commuter Rail Transit</option>
                </select>
              </div>
              <div>
                <label htmlFor="whatif-gate" className="block text-xs font-bold text-slate-400 uppercase mb-1.5">
                  Target gate / plaza
                </label>
                <select
                  id="whatif-gate"
                  value={targetGateId}
                  onChange={(e) => setTargetGateId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="gate-d">Gate D (North Auxiliary Plaza)</option>
                  <option value="gate-c">Gate C (East Rail Hub)</option>
                  <option value="gate-a">Gate A (West VIP Plaza)</option>
                  <option value="gate-b">Gate B (South Plaza)</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="whatif-description" className="block text-xs font-bold text-slate-400 uppercase mb-1.5">
                Scenario details &amp; constraints
              </label>
              <textarea
                id="whatif-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain proposed intervention…"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            {error && (
              <div role="alert" className="rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!description.trim() || isSimulating}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white font-extrabold text-xs shadow-xl shadow-amber-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              {isSimulating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="w-4 h-4 fill-current" aria-hidden="true" />
              )}
              <span>Run What-If Simulation</span>
            </button>
          </form>
        </div>

        {/* Right: Results + Summary */}
        <div className="lg:col-span-6 w-full space-y-6">
          {simResult ? (
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-amber-500/50 rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in duration-300" role="status" aria-live="polite">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" aria-hidden="true" />
                  <h3 className="text-base font-bold text-white">Simulation Analysis Complete</h3>
                </div>
                <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full ${simResult.engine === 'gemini' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                  {simResult.engine === 'gemini' ? 'GEMINI 2.5 PRO' : 'SIMULATED'} • {simResult.scenarioId.slice(-6)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-center">
                  <div className="text-3xl font-black text-emerald-400 font-mono flex items-center justify-center gap-1">
                    <TrendingDown className="w-6 h-6" aria-hidden="true" />
                    <span>-{simResult.projectedCongestionReductionPct}%</span>
                  </div>
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mt-1">Congestion Reduction</div>
                </div>
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-center">
                  <div className="text-3xl font-black text-white font-mono">
                    {simResult.newEstimatedWaitMinutes} <span className="text-sm font-normal text-slate-400">min</span>
                  </div>
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mt-1">Projected New Wait Time</div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Affected stadium sectors:</span>
                <div className="flex flex-wrap gap-1.5">
                  {simResult.affectedSectors.map((sec, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-800 text-emerald-300 text-xs font-mono font-bold border border-emerald-500/20">
                      Sector {sec}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI recommended action plan:</span>
                <ol className="space-y-1.5">
                  {simResult.recommendedActions.map((act, i) => (
                    <li key={i} className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 flex items-start gap-2">
                      <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{act}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {simResult.executiveSummary}
              </div>

              <div className="pt-2">
                {appliedSuccess ? (
                  <div className="w-full py-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2" role="status">
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    <span>Simulation applied to live venue state! Heatmap updated across all dashboards.</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={isApplying}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-xl shadow-emerald-900/40 transition-all flex items-center justify-center gap-2 active:scale-98 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  >
                    {isApplying ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                    ) : (
                      <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                    )}
                    <span>Apply Simulation to Live Stadium State</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/50 border border-slate-800/60 rounded-3xl p-12 text-center flex flex-col items-center justify-center h-full min-h-[360px] text-slate-500 space-y-3">
              <Sparkles className="w-10 h-10 text-slate-700 animate-pulse" aria-hidden="true" />
              <div className="text-sm font-bold text-slate-400">No Active Simulation Running</div>
              <p className="text-xs max-w-xs">
                Select a preset scenario on the left or type a custom intervention to test Gemini 2.5 Pro reasoning!
              </p>
            </div>
          )}

          {/* Executive Summary */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <FileText className="w-5 h-5 text-emerald-400" aria-hidden="true" />
                <span>Executive Operations Summary</span>
              </div>
              <button
                type="button"
                onClick={handleGenerateSummary}
                disabled={isSummarizing}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                {isSummarizing ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>Generate Report (&lt;5s)</span>
              </button>
            </div>
            {summary ? (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-line max-h-80 overflow-y-auto">
                <div className={`text-[10px] font-bold mb-2 ${summary.engine === 'gemini' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  Generated by: {summary.engine === 'gemini' ? 'Real Google Gemini 2.5 Pro' : 'Simulated fallback engine'}
                </div>
                {summary.markdown}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-500">
                Click "Generate Report" to let Gemini synthesize live telemetry into an executive audit report!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
