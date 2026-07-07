'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { api } from '@/lib/api-client';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Users,
  HeartPulse,
  Radio,
  FileText,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  Clock,
} from 'lucide-react';

export interface DemoAct {
  act: number;
  title: string;
  subtitle: string;
  description: string;
  aiRole: string;
  icon: React.ReactNode;
  /** Referee card color: yellow / red / green / blue / purple / cyan / amber */
  card: 'yellow' | 'red' | 'green' | 'blue' | 'purple' | 'cyan' | 'amber' | 'rose';
  /** Match minute label, e.g. "00'", "15'", "HT" */
  minute: string;
}

export const DEMO_ACTS: DemoAct[] = [
  {
    act: 1,
    title: '70,000 Spectators Arrive',
    subtitle: 'Normal Steady Ingress',
    description: 'MetLife Stadium opens its gates for the FIFA World Cup 2026. All 4 main turnstiles are processing fans smoothly with normal 18-minute wait times.',
    aiRole: 'GLM Flash monitors live turnstile velocity per minute across all stadium collections.',
    icon: <Users className="w-5 h-5 text-emerald-400" aria-hidden="true" />,
    card: 'green',
    minute: "00'",
  },
  {
    act: 2,
    title: 'Gate C Congestion Spike',
    subtitle: 'Commuter Rail Surge',
    description: 'Three NJ Transit commuter trains arrive simultaneously at Gate C East Plaza. Turnstile velocity surges to 340/min, causing wait times to spike to 42 minutes!',
    aiRole: 'Event-bus fires a congestion event; concourse heatmap transitions from GREEN to RED.',
    icon: <AlertTriangle className="w-5 h-5 text-red-400" aria-hidden="true" />,
    card: 'red',
    minute: "15'",
  },
  {
    act: 3,
    title: 'AI Risk Prediction Alert',
    subtitle: 'Queue Depth Regression',
    description: 'GLM analyzes concourse density and forecasts severe gridlock (>88% capacity) within 15 minutes, warning of potential spectator crush hazards.',
    aiRole: 'GLM Pro predicts concourse gridlock 30 minutes before it occurs and triggers a proactive command-center alert.',
    icon: <Zap className="w-5 h-5 text-amber-400" aria-hidden="true" />,
    card: 'amber',
    minute: "30'",
  },
  {
    act: 4,
    title: 'AI What-If Rerouting',
    subtitle: 'GLM 5.2 Pro Simulation',
    description: 'The What-If Simulation Engine evaluates opening Gate D auxiliary turnstiles and redirecting Sectors 101-115. Result: 35% congestion reduction in 12 minutes!',
    aiRole: 'GLM 5.2 Pro evaluates multi-variable stadium constraints without risking live fan safety.',
    icon: <Sparkles className="w-5 h-5 text-cyan-400" aria-hidden="true" />,
    card: 'cyan',
    minute: "45'",
  },
  {
    act: 5,
    title: 'Automated Volunteer Dispatch',
    subtitle: 'GPS Task Assignment',
    description: 'Command center applies the simulation. Task 902 is dispatched instantly to volunteer Elena Rostova (Concourse B) with digital signage wands to direct crowd flow.',
    aiRole: 'AI routes urgent checklists to the nearest qualified volunteer based on GPS coordinates and language skills.',
    icon: <Radio className="w-5 h-5 text-sky-400" aria-hidden="true" />,
    card: 'blue',
    minute: "60'",
  },
  {
    act: 6,
    title: 'Multilingual Fan Push',
    subtitle: '8-Language Simultaneous PA',
    description: 'The platform broadcasts targeted PA announcements and push notifications across 8 languages directing Gate C commuters to Gate D (5-min wait).',
    aiRole: 'GLM Flash translates and localizes custom rerouting directives in < 10 seconds across all World Cup languages.',
    icon: <Radio className="w-5 h-5 text-teal-400" aria-hidden="true" />,
    card: 'green',
    minute: "75'",
  },
  {
    act: 7,
    title: 'Medical Emergency Sec 112',
    subtitle: 'Multimodal Photo Classification',
    description: 'A spectator collapses from heat exhaustion in Sector 112 row 14. A volunteer snaps a photo and submits an incident report via their mobile app.',
    aiRole: 'GLM Vision classifies incident as Priority 2 Medical, grades severity 8/10, and assigns Medical Triage Team Beta.',
    icon: <HeartPulse className="w-5 h-5 text-purple-400" aria-hidden="true" />,
    card: 'purple',
    minute: "82'",
  },
  {
    act: 8,
    title: 'Multilingual Emergency',
    subtitle: 'Accessible Stretcher Routing',
    description: 'Medical Team Beta is routed via step-free Concourse B elevator. An 8-language PA alert instructs Sector 112 spectators to clear row 14 for stretcher access.',
    aiRole: 'AI generates accessible step-free extraction polylines while deterministic safety protocols lock emergency exits open.',
    icon: <ShieldAlert className="w-5 h-5 text-rose-400" aria-hidden="true" />,
    card: 'rose',
    minute: "85'",
  },
  {
    act: 9,
    title: 'Executive Resolution Summary',
    subtitle: 'Automated Markdown Report (<5s)',
    description: 'Gate C wait time drops to 14 mins (GREEN). The medical patient is stabilized. GLM 5.2 Pro generates a professional markdown executive report for FIFA match directors!',
    aiRole: 'GLM 5.2 Pro synthesizes 70,000 fan telemetry records into an executive audit report in under 5 seconds.',
    icon: <FileText className="w-5 h-5 text-emerald-400" aria-hidden="true" />,
    card: 'green',
    minute: 'FT',
  },
];

const CARD_BORDER: Record<DemoAct['card'], string> = {
  yellow: 'border-amber-400/50 ref-card-yellow',
  red: 'border-red-400/50 ref-card-red',
  green: 'border-emerald-400/50 ref-card-green',
  blue: 'border-sky-400/50',
  purple: 'border-purple-400/50',
  cyan: 'border-cyan-400/50',
  amber: 'border-amber-400/50 ref-card-gold',
  rose: 'border-rose-400/50',
};
const CARD_PILL: Record<DemoAct['card'], string> = {
  yellow: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  red: 'bg-red-500/20 text-red-300 border-red-500/30',
  green: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  blue: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  cyan: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  rose: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
};

export const DemoCommandCenter: React.FC = () => {
  const [currentAct, setCurrentAct] = useState<number>(1);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [lastSummary, setLastSummary] = useState<string | null>(null);
  const [lastEngine, setLastEngine] = useState<'gemini' | 'simulated' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const triggerAct = async (actNumber: number) => {
    setIsExecuting(true);
    setError(null);
    setCurrentAct(actNumber);
    try {
      const data = await api.triggerAct(actNumber);
      if (actNumber === 9 && data.markdownSummary) {
        setLastSummary(data.markdownSummary);
        setLastEngine(data.engine ?? null);
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#10b981', '#fbbf24', '#38bdf8', '#ffffff'],
        });
      } else {
        setLastSummary(null);
      }
    } catch (err) {
      const e = err as Error & { status?: number };
      if (e.status === 403) {
        setError(`Your active role cannot trigger Act ${actNumber}. Switch to OPERATIONS or SECURITY.`);
      } else {
        setError(e.message || `Failed to trigger Act ${actNumber}.`);
      }
      setLastSummary(null);
    } finally {
      setIsExecuting(false);
    }
  };

  const nextAct = () => {
    const next = currentAct < 9 ? currentAct + 1 : 1;
    void triggerAct(next);
  };

  const activeActConfig = DEMO_ACTS.find((a) => a.act === currentAct) || DEMO_ACTS[0];

  return (
    <div className="w-full card-floodlit rounded-xl p-6 shadow-2xl flex flex-col gap-6 relative overflow-hidden">
      <div className="absolute inset-0 pitch-stripes opacity-15" aria-hidden="true" />

      {/* Header Bar — Scoreboard style */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-emerald-900/50 pb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/20 border border-red-500/40">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 live-pulse" aria-hidden="true" />
              <span className="text-[10px] font-black text-red-300 font-mono tracking-widest uppercase">LIVE</span>
            </div>
            <h2 className="jersey-heading text-xl font-black text-white tracking-wide">Match-Day Command Center</h2>
            <span className="text-xs trophy-badge px-2.5 py-0.5 rounded-md font-mono font-black">JUDGE SUITE</span>
          </div>
          <p className="text-xs text-emerald-50/60 mt-1.5">
            Click through chronological acts to simulate a live 70,000-spectator World Cup match. All state changes sync to every connected browser tab via SSE.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => triggerAct(1)}
            disabled={isExecuting}
            className="px-3 py-2 rounded-md bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-200 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border border-emerald-800/50 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            aria-label="Reset simulation to Act 1 (seed state)"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={nextAct}
            disabled={isExecuting}
            className="px-5 py-2 rounded-md trophy-badge text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all disabled:opacity-50 active:scale-98 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            {isExecuting ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full spin-ball" aria-hidden="true" />
            ) : (
              <Play className="w-4 h-4 fill-current" aria-hidden="true" />
            )}
            <span>{currentAct === 9 ? 'Restart Match' : `Next Play (${currentAct + 1}/9)`}</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="relative z-10 rounded-md bg-red-500/15 border border-red-500/40 text-red-300 text-xs p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Active Act Highlight — Match Card */}
      <div className={`relative z-10 w-full bg-gradient-to-br from-[#0a1f15] to-[#03110a] border rounded-lg p-6 shadow-xl overflow-hidden ${CARD_BORDER[activeActConfig.card]}`}>
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-xs font-black px-2.5 py-1 rounded-md border font-mono tracking-widest uppercase ${CARD_PILL[activeActConfig.card]}`}>
                ACT {activeActConfig.act} • {activeActConfig.subtitle}
              </span>
              <span className="flex items-center gap-1 text-xs text-emerald-100/60 font-mono">
                <Clock className="w-3 h-3" aria-hidden="true" />
                <span className="font-bold">{activeActConfig.minute}</span>
              </span>
            </div>

            <h3 className="jersey-heading text-2xl font-black text-white flex items-center gap-2.5">
              {activeActConfig.icon}
              <span>{activeActConfig.title}</span>
            </h3>

            <p className="text-sm text-emerald-50/80 leading-relaxed">{activeActConfig.description}</p>

            <div className="pt-2 flex items-center gap-2 text-xs bg-[#03110a]/90 p-3 rounded-md border border-emerald-900/50 text-emerald-200">
              <Sparkles className="w-4 h-4 shrink-0 text-amber-400" aria-hidden="true" />
              <div>
                <span className="font-black text-white">Why GLM: </span>
                <span className="text-emerald-100/80">{activeActConfig.aiRole}</span>
              </div>
            </div>
          </div>

          {/* Scoreboard-style progress */}
          <div
            className="flex flex-col items-center justify-center bg-[#03110a]/90 border border-emerald-900/50 p-5 rounded-md min-w-[170px] text-center shrink-0"
            role="status"
            aria-label={`Storyline act ${currentAct} of 9`}
          >
            <div className="text-[10px] font-mono text-emerald-100/50 tracking-widest uppercase">Match Progress</div>
            <div className="text-4xl font-black text-white font-mono mt-1">
              {currentAct}<span className="text-emerald-700 mx-1">/</span><span className="text-emerald-400">9</span>
            </div>
            <div className="text-[10px] text-emerald-100/40 font-mono mt-0.5">{activeActConfig.minute}</div>
            <div className="mt-3 w-full bg-emerald-950 rounded-full h-1.5 overflow-hidden" role="progressbar" aria-valuenow={currentAct} aria-valuemin={1} aria-valuemax={9}>
              <div
                className="bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-400 h-full transition-all duration-500"
                style={{ width: `${(currentAct / 9) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 9-Step Storyline Grid — Jersey-number tiles */}
      <div className="space-y-2 relative z-10">
        <div className="text-xs font-bold uppercase tracking-widest text-emerald-100/60 jersey-heading">
          Match Timeline (click any tile to jump)
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
          {DEMO_ACTS.map((actItem) => {
            const isCurrent = actItem.act === currentAct;
            const isPassed = actItem.act < currentAct;
            return (
              <button
                key={actItem.act}
                type="button"
                onClick={() => triggerAct(actItem.act)}
                disabled={isExecuting}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`Trigger Act ${actItem.act}: ${actItem.title}`}
                className={`flex flex-col items-center p-2.5 rounded-md border text-center transition-all relative overflow-hidden group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:opacity-50 ${
                  isCurrent
                    ? `${CARD_PILL[actItem.card]} scale-105 shadow-lg`
                    : isPassed
                    ? 'bg-emerald-950/40 border-emerald-900/50 opacity-70 hover:opacity-100'
                    : 'bg-[#03110a]/60 border-emerald-900/30 hover:border-emerald-700/60'
                }`}
              >
                <div className="text-[9px] font-mono font-black text-emerald-100/50 tracking-widest">{actItem.minute}</div>
                <div className={`text-lg font-black scoreboard-numeral mt-0.5 ${isCurrent ? 'text-white' : 'text-emerald-100/60'}`}>
                  {actItem.act}
                </div>
                <div className="text-[9px] text-emerald-100/60 leading-tight mt-0.5 line-clamp-2 hidden sm:block">
                  {actItem.title}
                </div>
                {isPassed && (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 absolute top-1 right-1" aria-hidden="true" />
                )}
                {isCurrent && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400 live-pulse" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Executive Summary Output (Act 9) */}
      {lastSummary && (
        <div className="relative z-10 w-full bg-[#03110a] border border-emerald-500/40 rounded-lg p-6 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between border-b border-emerald-900/50 pb-3 mb-4">
            <div className="flex items-center gap-2 text-emerald-300 font-black text-sm jersey-heading">
              <FileText className="w-5 h-5" aria-hidden="true" />
              <span>Full-Time Executive Report</span>
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded-md font-mono font-black ${
                lastEngine === 'gemini'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
              title={lastEngine === 'gemini' ? 'Generated by real GLM 5.2 API' : 'Generated by simulated fallback engine'}
            >
              {lastEngine === 'gemini' ? '◆ GLM 5.2 PRO' : '◇ SIMULATED'}
            </span>
          </div>
          <div className="prose prose-invert prose-sm max-w-none text-emerald-50/80 space-y-4 font-sans leading-relaxed">
            <div className="whitespace-pre-line bg-[#0a1f15]/80 p-4 rounded-md border border-emerald-900/40 font-mono text-xs max-h-96 overflow-y-auto scrollbar-pitch">
              {lastSummary}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
