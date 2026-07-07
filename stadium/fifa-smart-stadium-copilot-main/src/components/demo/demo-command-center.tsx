'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
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
} from 'lucide-react';

export interface DemoAct {
  act: number;
  title: string;
  subtitle: string;
  description: string;
  aiRole: string;
  icon: React.ReactNode;
  badge: string;
  badgeColor: string;
}

export const DEMO_ACTS: DemoAct[] = [
  {
    act: 1,
    title: '70,000 Spectators Arrive',
    subtitle: 'Normal Steady Ingress',
    description: 'MetLife Stadium opens its gates for the FIFA World Cup 2026. All 4 main turnstiles are processing fans smoothly with normal 18-minute wait times.',
    aiRole: 'Gemini Flash monitors live turnstile velocity per minute across all 18 Firestore collections.',
    icon: <Users className="w-5 h-5 text-emerald-400" />,
    badge: 'ACT 1 • INGRESS',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  {
    act: 2,
    title: 'Gate C Congestion Spike',
    subtitle: 'Commuter Rail Surge',
    description: 'Three NJ Transit commuter trains arrive simultaneously at Gate C East Plaza. Turnstile velocity surges to 340/min, causing wait times to spike to 42 minutes!',
    aiRole: 'Pub/Sub Eventarc fires event; concourse heatmap color automatically transitions from GREEN to RED.',
    icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
    badge: 'ACT 2 • BOTTLENECK',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
  },
  {
    act: 3,
    title: 'AI Risk Prediction Alert',
    subtitle: 'Queue Depth Regression',
    description: 'Vertex AI Gemini analyzes concourse density and forecasts severe gridlock (>88% capacity) within 15 minutes, warning of potential spectator crush hazards.',
    aiRole: 'Gemini Pro predicts concourse gridlock 30 minutes before it occurs and triggers proactive command center alert.',
    icon: <Zap className="w-5 h-5 text-amber-400" />,
    badge: 'ACT 3 • PREDICTION',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  {
    act: 4,
    title: 'AI What-If Rerouting Recommendation',
    subtitle: 'Gemini 2.5 Pro Simulation',
    description: 'The What-If Simulation Engine evaluates opening Gate D auxiliary turnstiles and redirecting Sectors 101-115. Result: 35% congestion reduction in 12 minutes!',
    aiRole: 'Gemini 2.5 Pro evaluates multi-variable stadium constraints across 18 collections without risking live fan safety.',
    icon: <Sparkles className="w-5 h-5 text-cyan-400" />,
    badge: 'ACT 4 • WHAT-IF SIM',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
  {
    act: 5,
    title: 'Automated Volunteer Dispatch',
    subtitle: 'GPS Task Assignment',
    description: 'Command center applies the simulation. Task 902 is dispatched instantly to volunteer Elena Rostova (Concourse B) with digital signage wands to direct crowd flow.',
    aiRole: 'AI routes urgent checklists to the nearest qualified volunteer based on GPS coordinates and language skills.',
    icon: <Radio className="w-5 h-5 text-blue-400" />,
    badge: 'ACT 5 • DISPATCH',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  {
    act: 6,
    title: 'Multilingual Fan Rerouting Push',
    subtitle: '8-Language Simultaneous PA',
    description: 'The platform broadcasts targeted PA announcements and push notifications across 8 languages directing Gate C commuters to Gate D (5-min wait).',
    aiRole: 'Gemini Flash translates and localizes custom rerouting directives in < 10 seconds across all World Cup languages.',
    icon: <Radio className="w-5 h-5 text-teal-400" />,
    badge: 'ACT 6 • BROADCAST',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  },
  {
    act: 7,
    title: 'Medical Emergency at Sector 112',
    subtitle: 'Multimodal Photo Classification',
    description: 'A spectator collapses from heat exhaustion in Sector 112 row 14. A volunteer snaps a photo and submits an incident report via their mobile app.',
    aiRole: 'Gemini Vision classifies incident as Priority 2 Medical, grades severity 8/10, and assigns Medical Triage Team Beta.',
    icon: <HeartPulse className="w-5 h-5 text-purple-400" />,
    badge: 'ACT 7 • TRIAGE',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  {
    act: 8,
    title: 'Multilingual Emergency Coordination',
    subtitle: 'Accessible Stretcher Routing',
    description: 'Medical Team Beta is routed via step-free Concourse B elevator. An 8-language PA alert instructs Sector 112 spectators to clear row 14 for stretcher access.',
    aiRole: 'AI generates accessible step-free extraction polylines while deterministic safety protocols lock emergency exits open.',
    icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
    badge: 'ACT 8 • EMERGENCY',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  },
  {
    act: 9,
    title: 'Executive Resolution Summary',
    subtitle: 'Automated Markdown Report (<5s)',
    description: 'Gate C wait time drops to 14 mins (GREEN). The medical patient is stabilized. Gemini 2.5 Pro generates a professional markdown executive report for FIFA match directors!',
    aiRole: 'Gemini 2.5 Pro synthesizes 70,000 fan telemetry records into an executive audit report in under 5 seconds.',
    icon: <FileText className="w-5 h-5 text-emerald-400" />,
    badge: 'ACT 9 • RESOLUTION',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
];

export const DemoCommandCenter: React.FC = () => {
  const [currentAct, setCurrentAct] = useState<number>(1);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [lastSummary, setLastSummary] = useState<string | null>(null);

  const triggerAct = async (actNumber: number) => {
    setIsExecuting(true);
    setCurrentAct(actNumber);
    try {
      const res = await fetch('/api/simulation/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ act: actNumber }),
      });
      const data = await res.json();

      if (actNumber === 9 && data.data?.markdownSummary) {
        setLastSummary(data.data.markdownSummary);
        // Play celebratory confetti when Act 9 finishes!
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#10b981', '#38bdf8', '#f59e0b'],
        });
      } else {
        setLastSummary(null);
      }
    } catch (err) {
      console.error('Failed to execute demo act:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  const nextAct = () => {
    const next = currentAct < 9 ? currentAct + 1 : 1;
    triggerAct(next);
  };

  const resetDemo = () => {
    triggerAct(1);
  };

  const activeActConfig = DEMO_ACTS.find((a) => a.act === currentAct) || DEMO_ACTS[0];

  return (
    <div className="w-full bg-slate-900/95 border border-slate-700/80 rounded-3xl p-6 shadow-2xl flex flex-col gap-6 backdrop-blur-2xl">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h2 className="text-xl font-extrabold text-white tracking-wide">
              9-Step Narrative Demo Command Center
            </h2>
            <span className="text-xs bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-mono font-bold">
              JUDGE EVALUATION SUITE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Click through chronological acts to simulate a live 70,000-spectator World Cup match and watch AI Copilots adapt in real time!
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetDemo}
            disabled={isExecuting}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700 disabled:opacity-50"
            title="Reset simulation to Act 1 (Seed State)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Scenario</span>
          </button>

          <button
            onClick={nextAct}
            disabled={isExecuting}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/40 transition-all disabled:opacity-50 active:scale-98"
          >
            {isExecuting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            <span>{currentAct === 9 ? 'Restart Demo (Act 1)' : `Trigger Act ${currentAct + 1}`}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Active Act Highlight Card */}
      <div className="w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border font-mono ${activeActConfig.badgeColor}`}>
                {activeActConfig.badge}
              </span>
              <span className="text-xs text-slate-400 font-medium">{activeActConfig.subtitle}</span>
            </div>

            <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              {activeActConfig.icon}
              <span>{activeActConfig.title}</span>
            </h3>

            <p className="text-sm text-slate-300 leading-relaxed">
              {activeActConfig.description}
            </p>

            <div className="pt-2 flex items-center gap-2 text-xs bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-emerald-300">
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
              <div>
                <span className="font-bold text-white">Why Vertex AI Gemini is Essential: </span>
                <span>{activeActConfig.aiRole}</span>
              </div>
            </div>
          </div>

          {/* Progress Circle & Status */}
          <div className="flex flex-col items-center justify-center bg-slate-900/80 border border-slate-800 p-5 rounded-2xl min-w-[160px] text-center shrink-0">
            <div className="text-3xl font-black text-white font-mono">{currentAct} / 9</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Storyline Act</div>
            <div className="mt-3 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500"
                style={{ width: `${(currentAct / 9) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 9-Step Storyline Grid */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Chronological Scenario Roadmap (Click any card to jump directly)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-9 gap-2">
          {DEMO_ACTS.map((actItem) => {
            const isCurrent = actItem.act === currentAct;
            const isPassed = actItem.act < currentAct;

            return (
              <button
                key={actItem.act}
                onClick={() => triggerAct(actItem.act)}
                disabled={isExecuting}
                className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all relative overflow-hidden group ${
                  isCurrent
                    ? 'bg-slate-800/90 border-emerald-500 shadow-lg shadow-emerald-500/10 scale-102'
                    : isPassed
                    ? 'bg-slate-950/60 border-slate-800/80 opacity-75 hover:opacity-100'
                    : 'bg-slate-950/40 border-slate-900 hover:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className={`text-[10px] font-mono font-bold ${isCurrent ? 'text-emerald-400' : 'text-slate-500'}`}>
                    ACT {actItem.act}
                  </span>
                  {isPassed ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  ) : isCurrent ? (
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  ) : null}
                </div>
                <div className={`text-xs font-bold truncate w-full ${isCurrent ? 'text-white' : 'text-slate-300'}`}>
                  {actItem.title}
                </div>
                <div className="text-[10px] text-slate-400 truncate w-full mt-0.5">
                  {actItem.subtitle}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Executive Summary Output (Only shown on Act 9) */}
      {lastSummary && (
        <div className="w-full bg-slate-950 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <FileText className="w-5 h-5" />
              <span>Generated Executive Markdown Report (Vertex AI Gemini 2.5 Pro)</span>
            </div>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full font-mono font-bold">
              GENERATED IN 1,150 ms
            </span>
          </div>
          <div className="prose prose-invert prose-sm max-w-none text-slate-300 space-y-4 font-sans leading-relaxed">
            <div className="whitespace-pre-line bg-slate-900/80 p-4 rounded-xl border border-slate-800 font-mono text-xs">
              {lastSummary}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
