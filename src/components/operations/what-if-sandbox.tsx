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
        <div className="lg:col-span-6 w-full card-floodlit ref-card-gold rounded-xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 pitch-stripes opacity-10" aria-hidden="true" />
          <div className="flex items-center justify-between border-b border-emerald-900/50 pb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md trophy-badge flex items-center justify-center shadow-lg" aria-hidden="true">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="jersey-heading text-base font-black text-white flex items-center gap-2">
                  <span>What-If Simulation Engine</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold border ${
                      isGeminiLive
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {isGeminiLive ? '◆ GEMINI 2.5 PRO' : '◇ SIMULATED'}
                  </span>
                </h3>
                <p className="text-xs text-emerald-100/60">Evaluate multi-variable interventions across live stadium telemetry</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 relative z-10">
            <span className="text-[11px] font-black text-emerald-100/50 uppercase tracking-widest jersey-heading">Select preset:</span>
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
                  className="p-2.5 rounded-md bg-[#03110a]/80 hover:bg-emerald-950/60 border border-emerald-900/50 text-left text-xs text-emerald-100/80 hover:text-emerald-100 transition-all shadow-sm group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  aria-label={`Load preset: ${preset.label}`}
                >
                  <div className="font-black truncate group-hover:text-amber-300 jersey-heading">{preset.label}</div>
                  <div className="text-[10px] text-emerald-100/40 truncate mt-0.5">Click to configure</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSimulate} className="space-y-4 relative z-10">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="whatif-intervention" className="block text-xs font-black text-emerald-100/60 uppercase mb-1.5 tracking-widest jersey-heading">
                  Intervention
                </label>
                <select
                  id="whatif-intervention"
                  value={interventionType}
                  onChange={(e) => setInterventionType(e.target.value as typeof interventionType)}
                  className="w-full bg-[#03110a] border border-emerald-900/50 rounded-md px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="OPEN_AUXILIARY_GATE">Open Auxiliary Turnstiles</option>
                  <option value="CLOSE_GATE">Close Entrance Gate</option>
                  <option value="REASSIGN_STAFF">Reassign Ground Staff</option>
                  <option value="TRANSIT_DELAY">Hold Commuter Rail Transit</option>
                </select>
              </div>
              <div>
                <label htmlFor="whatif-gate" className="block text-xs font-black text-emerald-100/60 uppercase mb-1.5 tracking-widest jersey-heading">
                  Target Gate
                </label>
                <select
                  id="whatif-gate"
                  value={targetGateId}
                  onChange={(e) => setTargetGateId(e.target.value)}
                  className="w-full bg-[#03110a] border border-emerald-900/50 rounded-md px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="gate-d">Gate D (North Auxiliary Plaza)</option>
                  <option value="gate-c">Gate C (East Rail Hub)</option>
                  <option value="gate-a">Gate A (West VIP Plaza)</option>
                  <option value="gate-b">Gate B (South Plaza)</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="whatif-description" className="block text-xs font-black text-emerald-100/60 uppercase mb-1.5 tracking-widest jersey-heading">
                Scenario Details
              </label>
              <textarea
                id="whatif-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain proposed intervention…"
                className="w-full bg-[#03110a] border border-emerald-900/50 rounded-md p-3 text-xs sm:text-sm text-white placeholder:text-emerald-100/30 focus:outline-none focus:border-amber-500"
              />
            </div>

            {error && (
              <div role="alert" className="rounded-md bg-red-500/15 border border-red-500/40 text-red-300 text-xs p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!description.trim() || isSimulating}
              className="w-full py-3.5 rounded-md bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              {isSimulating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spin-ball" aria-hidden="true" />
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
            <div className="card-floodlit ref-card-gold rounded-xl p-6 shadow-2xl space-y-5 animate-in fade-in duration-300 relative overflow-hidden" role="status" aria-live="polite">
              <div className="absolute inset-0 pitch-stripes opacity-10" aria-hidden="true" />
              <div className="flex items-center justify-between border-b border-emerald-900/50 pb-4 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-400 live-pulse" aria-hidden="true" />
                  <h3 className="jersey-heading text-base font-black text-white">Simulation Analysis Complete</h3>
                </div>
                <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-md uppercase tracking-widest ${simResult.engine === 'gemini' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}`}>
                  {simResult.engine === 'gemini' ? '◆ GEMINI 2.5 PRO' : '◇ SIMULATED'} • {simResult.scenarioId.slice(-6)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="bg-[#03110a]/80 p-4 rounded-md border border-emerald-900/40 text-center">
                  <div className="text-3xl font-black text-emerald-400 font-mono scoreboard-numeral flex items-center justify-center gap-1">
                    <TrendingDown className="w-6 h-6" aria-hidden="true" />
                    <span>-{simResult.projectedCongestionReductionPct}%</span>
                  </div>
                  <div className="text-[11px] text-emerald-100/60 uppercase tracking-widest font-black mt-1 jersey-heading">Congestion Reduction</div>
                </div>
                <div className="bg-[#03110a]/80 p-4 rounded-md border border-emerald-900/40 text-center">
                  <div className="text-3xl font-black text-white font-mono scoreboard-numeral">
                    {simResult.newEstimatedWaitMinutes} <span className="text-sm font-normal text-emerald-100/40">min</span>
                  </div>
                  <div className="text-[11px] text-emerald-100/60 uppercase tracking-widest font-black mt-1 jersey-heading">Projected Wait Time</div>
                </div>
              </div>

              <div className="space-y-2 relative z-10">
                <span className="text-xs font-black text-emerald-100/60 uppercase tracking-widest jersey-heading">Affected Sectors:</span>
                <div className="flex flex-wrap gap-1.5">
                  {simResult.affectedSectors.map((sec, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-md bg-emerald-950/60 text-emerald-300 text-xs font-mono font-black border border-emerald-700/40 tracking-widest">
                      SEC {sec}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2 relative z-10">
                <span className="text-xs font-black text-emerald-100/60 uppercase tracking-widest jersey-heading">AI Recommended Action Plan:</span>
                <ol className="space-y-1.5">
                  {simResult.recommendedActions.map((act, i) => (
                    <li key={i} className="text-xs text-emerald-100/80 bg-[#03110a]/60 p-2.5 rounded-md border border-emerald-900/40 flex items-start gap-2">
                      <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 font-mono font-black flex items-center justify-center shrink-0 mt-0.5 scoreboard-numeral">
                        {i + 1}
                      </span>
                      <span>{act}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="bg-[#03110a] p-4 rounded-md border border-emerald-900/40 font-mono text-xs text-emerald-100/80 leading-relaxed whitespace-pre-line relative z-10">
                {simResult.executiveSummary}
              </div>

              <div className="pt-2 relative z-10">
                {appliedSuccess ? (
                  <div className="w-full py-3.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black flex items-center justify-center gap-2 uppercase tracking-widest" role="status">
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    <span>Applied to Live Stadium! All dashboards updated.</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={isApplying}
                    className="w-full py-3.5 rounded-md bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-[#03110a] font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-900/40 transition-all flex items-center justify-center gap-2 active:scale-98 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  >
                    {isApplying ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full spin-ball" aria-hidden="true" />
                    ) : (
                      <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                    )}
                    <span>Apply to Live Stadium</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="card-floodlit rounded-xl p-12 text-center flex flex-col items-center justify-center h-full min-h-[360px] text-emerald-100/40 space-y-3 relative overflow-hidden">
              <div className="absolute inset-0 pitch-stripes opacity-15" aria-hidden="true" />
              <Sparkles className="w-10 h-10 text-emerald-700 animate-pulse relative z-10" aria-hidden="true" />
              <div className="text-sm font-black text-emerald-100/60 jersey-heading relative z-10">No Active Simulation Running</div>
              <p className="text-xs max-w-xs relative z-10">
                Select a preset scenario on the left or type a custom intervention to test Gemini 2.5 Pro reasoning!
              </p>
            </div>
          )}

          {/* Executive Summary */}
          <div className="card-floodlit rounded-xl p-6 shadow-2xl space-y-4 relative overflow-hidden">
            <div className="absolute inset-0 pitch-stripes opacity-10" aria-hidden="true" />
            <div className="flex items-center justify-between border-b border-emerald-900/50 pb-3 gap-3 relative z-10">
              <div className="flex items-center gap-2 text-white font-black text-sm jersey-heading">
                <FileText className="w-5 h-5 text-emerald-400" aria-hidden="true" />
                <span>Executive Operations Summary</span>
              </div>
              <button
                type="button"
                onClick={handleGenerateSummary}
                disabled={isSummarizing}
                className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-[#03110a] text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                {isSummarizing ? (
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full spin-ball" aria-hidden="true" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>Generate (&lt;5s)</span>
              </button>
            </div>
            {summary ? (
              <div className="bg-[#03110a] p-4 rounded-md border border-emerald-900/40 font-mono text-xs text-emerald-100/80 leading-relaxed whitespace-pre-line max-h-80 overflow-y-auto scrollbar-pitch relative z-10">
                <div className={`text-[10px] font-black mb-2 uppercase tracking-widest ${summary.engine === 'gemini' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {summary.engine === 'gemini' ? '◆ Real Google Gemini 2.5 Pro' : '◇ Simulated fallback engine'}
                </div>
                {summary.markdown}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-emerald-100/40 relative z-10">
                Click "Generate" to let Gemini synthesize live telemetry into an executive audit report!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
