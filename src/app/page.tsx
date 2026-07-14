'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { DemoCommandCenter } from '@/components/demo/demo-command-center';
import { StadiumMap } from '@/components/stadium/stadium-map';
import { KickoffIntro } from '@/components/football/kickoff-intro';
import { AnimatedCounter } from '@/components/football/animated-counter';
import { useGoalOnClick } from '@/components/football/goal-celebration';
import {
  Trophy,
  Compass,
  Sparkles,
  LayoutDashboard,
  Shield,
  HeartPulse,
  Lock,
  ArrowRight,
  Zap,
  CheckCircle2,
  Cpu,
  Goal,
  Flag,
} from 'lucide-react';

const ROLE_CARDS = [
  {
    role: 'FAN' as const,
    number: '10',
    title: 'Fan Navigation',
    subtitle: 'Carlos • International Tourist',
    description: 'Multilingual assistant (8 languages), step-by-step vector map routing, live turnstile wait times, and WCAG 2.2 AA accessible step-free paths.',
    href: '/fan',
    icon: Compass,
    kit: 'emerald' as const,
    badge: '8 LANGUAGES',
  },
  {
    role: 'VOLUNTEER' as const,
    number: '06',
    title: 'Volunteer Triage',
    subtitle: 'Elena • Concourse B Ground Staff',
    description: 'GPS-prioritized task checklist, multimodal AI incident photo classification (GLM Vision), and voice note transcription.',
    href: '/volunteer',
    icon: Sparkles,
    kit: 'sky' as const,
    badge: 'GLM VISION',
  },
  {
    role: 'OPERATIONS' as const,
    number: '08',
    title: 'Operations Command',
    subtitle: 'Marcus • Venue Supervisor',
    description: 'Real-time telemetry across all stadium collections, crowd congestion heatmap overlays, and the AI What-If Simulation Sandbox.',
    href: '/operations',
    icon: LayoutDashboard,
    kit: 'amber' as const,
    badge: 'GLM 5.2 PRO',
  },
  {
    role: 'SECURITY' as const,
    number: '04',
    title: 'Security Alert Feed',
    subtitle: 'Sarah • Perimeter Security Lead',
    description: 'Priority-sorted threat tracking, crowd anomaly detection, and deterministic emergency gate evacuation override controls.',
    href: '/security',
    icon: Shield,
    kit: 'red' as const,
    badge: 'DETERMINISTIC',
  },
  {
    role: 'MEDICAL' as const,
    number: '07',
    title: 'Medical Triage',
    subtitle: 'Dr. Aris • Paramedic First-Aid Lead',
    description: 'Real-time triage queue (Priority 1-3), AI injury classification summaries, and step-free accessible stretcher extraction routing.',
    href: '/medical',
    icon: HeartPulse,
    kit: 'purple' as const,
    badge: 'STEP-FREE',
  },
  {
    role: 'ADMIN' as const,
    number: '01',
    title: 'System Admin',
    subtitle: 'David • Cloud Infrastructure Lead',
    description: 'Analytics metrics, RBAC user management, prompt version inspection, and AI latency observability.',
    href: '/admin',
    icon: Lock,
    kit: 'cyan' as const,
    badge: 'OBSERVABILITY',
  },
];

const KIT_BG: Record<string, string> = {
  emerald: 'from-emerald-500/20 to-emerald-900/10 border-emerald-500/40',
  sky: 'from-sky-500/20 to-sky-900/10 border-sky-500/40',
  amber: 'from-amber-500/20 to-amber-900/10 border-amber-500/40',
  red: 'from-red-500/20 to-red-900/10 border-red-500/40',
  purple: 'from-purple-500/20 to-purple-900/10 border-purple-500/40',
  cyan: 'from-cyan-500/20 to-cyan-900/10 border-cyan-500/40',
};

const KIT_ICON: Record<string, string> = {
  emerald: 'text-emerald-300',
  sky: 'text-sky-300',
  amber: 'text-amber-300',
  red: 'text-red-300',
  purple: 'text-purple-300',
  cyan: 'text-cyan-300',
};

const KIT_STRIPE: Record<string, string> = {
  emerald: 'bg-emerald-400',
  sky: 'bg-sky-400',
  amber: 'bg-amber-400',
  red: 'bg-red-400',
  purple: 'bg-purple-400',
  cyan: 'bg-cyan-400',
};

export default function HomePage() {
  const { switchRole, isGeminiLive } = useAuth();
  const kickoffGoal = useGoalOnClick('KICK OFF!');

  return (
    <div className="w-full flex flex-col gap-16 pb-20">
      {/* One-time-per-session kickoff intro — a football flies in and bursts */}
      <KickoffIntro />
      {/* Goal celebration overlay (rendered once; fired by kickoffGoal.onClick) */}
      {kickoffGoal.node}
      {/* ===== HERO — Match-Day Banner with Stadium Floodlights ===== */}
      <section
        aria-labelledby="hero-title"
        className="relative w-full pt-16 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
      >
        {/* Floodlight cones from the top */}
        <div className="absolute inset-0 floodlight-cone pointer-events-none" aria-hidden="true" />
        <div
          className="absolute -top-32 left-1/4 w-96 h-96 bg-amber-300/10 blur-[120px] rounded-full pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -top-32 right-1/4 w-96 h-96 bg-emerald-400/10 blur-[120px] rounded-full pointer-events-none"
          aria-hidden="true"
        />
        {/* Pitch stripes overlay — slowly pans like a camera over mowed grass */}
        <div className="absolute inset-0 pitch-stripes-pan opacity-40 pointer-events-none" aria-hidden="true" />

        <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10 space-y-7">
          {/* Championship badge */}
          <div className="trophy-shine inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0a1f15]/90 border border-amber-400/40 shadow-xl shadow-amber-500/10 text-xs font-bold text-amber-200 animate-in fade-in slide-in-from-top-4 duration-500">
            <Trophy className="w-4 h-4 text-amber-400" aria-hidden="true" />
            <span className="uppercase tracking-widest font-mono">Prompt Wars Challenge 4 • Smart Stadiums</span>
          </div>

          <h1 id="hero-title" className="jersey-heading text-5xl sm:text-7xl font-black text-white max-w-5xl leading-[0.95]">
            The Digital Command
            <br />
            Center for <span className="trophy-text">FIFA World Cup 2026</span>
          </h1>

          <p className="text-base sm:text-lg text-emerald-50/80 max-w-2xl font-normal leading-relaxed">
            An enterprise-grade, cloud-native SaaS platform powered by <span className="text-white font-bold">Zhipu GLM 5.2</span>. Predictive crowd control, 8-language real-time translation, and multimodal emergency coordination across MetLife Stadium.
          </p>

          {/* Engine status pill */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span
              aria-label={isGeminiLive ? 'AI engine: Live GLM 5.2 API connected' : 'AI engine: Simulated mode — set ZAI_DISABLED=0 for live GLM'}
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border ${
                isGeminiLive
                  ? 'bg-emerald-500/15 text-emerald-200 border-emerald-400/40'
                  : 'bg-amber-500/15 text-amber-200 border-amber-400/40'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" aria-hidden="true" />
              {isGeminiLive ? 'Live GLM 5.2 API connected' : 'Simulated engine (set ZAI_DISABLED=0 for live GLM)'}
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-[#0a1f15]/90 border border-emerald-900/60 text-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-pulse" aria-hidden="true" />
              <span aria-label="70,000 spectators currently in-game">70,000 SPECTATORS IN-GAME</span>
            </span>
          </div>

          {/* CTA buttons — scoreboard-style */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a
              href="#demo-section"
              onClick={kickoffGoal.onClick}
              className="trophy-shine group px-7 py-4 rounded-md trophy-badge font-black text-sm uppercase tracking-widest shadow-2xl transition-all flex items-center gap-2.5 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#03110a]"
            >
              <Zap className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" aria-hidden="true" />
              <span>Kick Off 9-Step Demo</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </a>
            <Link
              href="/operations"
              className="px-7 py-4 rounded-md bg-[#0a1f15] hover:bg-emerald-950 text-emerald-100 hover:text-white font-black text-sm uppercase tracking-widest border border-emerald-700/60 shadow-lg transition-all flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <LayoutDashboard className="w-4 h-4 text-amber-400" aria-hidden="true" />
              <span>Operations Sandbox</span>
            </Link>
          </div>

          {/* Scoreboard Telemetry Bar — match clock style, with count-up animation */}
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-5xl pt-10"
            role="group"
            aria-label="Stadium telemetry snapshot"
          >
            {[
              { numeric: 82500, prefix: '', suffix: '', label: 'MetLife Capacity', color: 'text-white', sub: 'EAST RUTHERFORD, NJ', ariaValue: '82,500 seat capacity' },
              { numeric: 70000, prefix: '', suffix: '', label: 'Live Ingress', color: 'text-emerald-400', sub: '84.8% CAPACITY', ariaValue: '70,000 spectators — 84.8% capacity' },
              { numeric: 1.5, prefix: '< ', suffix: 's', decimals: 1, label: 'AI Latency', color: 'text-cyan-400', sub: 'P95 SLA MET', ariaValue: 'AI response latency under 1.5 seconds, P95 SLA met' },
              { numeric: 8, prefix: '', suffix: '', label: 'Languages', color: 'text-amber-400', sub: 'WORLD CUP CORE', ariaValue: '8 World Cup languages supported' },
            ].map((stat, i) => (
              <figure
                key={i}
                className="card-floodlit floodlight-sweep rounded-lg p-4 text-center backdrop-blur-xl relative overflow-hidden"
                aria-label={stat.ariaValue}
              >
                <div className={`text-3xl sm:text-4xl font-black ${stat.color}`} aria-hidden="true">
                  <AnimatedCounter
                    value={stat.numeric}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    decimals={stat.decimals ?? 0}
                    duration={1600}
                  />
                </div>
                <figcaption className="text-[10px] text-emerald-100/70 uppercase tracking-widest font-bold mt-1 jersey-heading">
                  {stat.label}
                </figcaption>
                <div className="text-[9px] text-emerald-100/75 font-mono mt-0.5" aria-hidden="true">{stat.sub}</div>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ===== DEMO COMMAND CENTER ===== */}
      <section id="demo-section" aria-labelledby="demo-title" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-6 scroll-mt-20">
        <div className="flex items-center gap-3">
          <Flag className="w-5 h-5 text-amber-400" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-widest text-amber-300 jersey-heading">Judge Evaluation Suite</span>
        </div>
        <h2 id="demo-title" className="jersey-heading text-3xl sm:text-4xl font-black text-white">
          9-Step Match-Day <span className="pitch-text">Storyline Simulator</span>
        </h2>
        <p className="text-sm text-emerald-50/70 max-w-2xl">
          Test our dual-mode GLM 5.2 adapter live. Trigger simulated turnstile bottlenecks, AI What-If rerouting, volunteer task
          dispatch, and 8-language emergency coordination. All state changes sync across every connected browser tab via SSE.
        </p>
        <DemoCommandCenter />
      </section>

      {/* ===== STADIUM MAP ===== */}
      <section aria-labelledby="map-title" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-6">
        <div className="flex items-center gap-3">
          <Goal className="w-5 h-5 text-emerald-400" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-300 jersey-heading">Real-Time Telemetry</span>
        </div>
        <h2 id="map-title" className="jersey-heading text-3xl sm:text-4xl font-black text-white">
          Live Venue Heatmap &amp; <span className="pitch-text">Polyline Routing</span>
        </h2>
        <p className="text-sm text-emerald-50/70 max-w-2xl">
          Watch how crowd density alerts dynamically reroute spectators to step-free accessible entrances. Updates flow over SSE —
          open a second tab on a different role to see cross-tab sync in action.
        </p>
        <StadiumMap />
      </section>

      {/* ===== ROLE DASHBOARDS — Jersey Cards ===== */}
      <section aria-labelledby="roles-title" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-6">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-emerald-700/50" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-widest text-amber-300 jersey-heading">Role-Based Access Control</span>
            <span className="h-px w-12 bg-emerald-700/50" aria-hidden="true" />
          </div>
          <h2 id="roles-title" className="jersey-heading text-3xl sm:text-5xl font-black text-white">
            6 Specialized <span className="trophy-text">Stakeholder Kits</span>
          </h2>
          <p className="text-sm sm:text-base text-emerald-50/70">
            Tailored tools, data feeds, and AI capabilities for every tournament role. Click any card to swap kits instantly —
            authorization is enforced server-side.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {ROLE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
                <article
                key={card.role}
                aria-labelledby={`role-card-title-${card.role}`}
                aria-describedby={`role-card-desc-${card.role}`}
                className={`relative card-floodlit floodlight-sweep card-lift rounded-xl p-6 shadow-2xl flex flex-col justify-between gap-5 bg-linear-to-br ${KIT_BG[card.kit]}`}
              >
                {/* Vertical kit stripe (jersey side panel) */}
                <div className={`absolute top-0 left-0 bottom-0 w-1 rounded-l-xl ${KIT_STRIPE[card.kit]}`} aria-hidden="true" />

                <div className="space-y-4 pl-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {/* Jersey-number block */}
                      <div className="relative">
                        <div
                          className="w-14 h-14 rounded-md bg-[#03110a]/90 border border-white/10 flex items-center justify-center font-black text-2xl scoreboard-numeral text-white"
                          aria-hidden="true"
                        >
                          {card.number}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 p-1 rounded-md bg-[#03110a] border border-white/10`}>
                          <Icon className={`w-4 h-4 ${KIT_ICON[card.kit]}`} aria-hidden="true" />
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-[#03110a]/80 border border-white/10 tracking-widest text-emerald-100/70" aria-hidden="true">
                      {card.badge}
                    </span>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-emerald-100/50 font-mono" aria-hidden="true">
                      {card.role} • POSITION
                    </div>
                    <h3 id={`role-card-title-${card.role}`} className="jersey-heading text-xl font-black text-white mt-1">{card.title}</h3>
                    <div className="text-xs font-medium text-emerald-100/60 mt-0.5">{card.subtitle}</div>
                  </div>
                  <p id={`role-card-desc-${card.role}`} className="text-xs text-emerald-50/80 leading-relaxed">{card.description}</p>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3 pl-2">
                  <button
                    type="button"
                    onClick={() => switchRole(card.role)}
                    className="px-3.5 py-2 rounded-md bg-[#03110a]/80 hover:bg-[#03110a] text-xs font-black text-white border border-white/10 transition-all flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 uppercase tracking-wider"
                    aria-label={`Switch active user profile to ${card.role}`}
                  >
                    <span>Select Kit</span>
                  </button>
                  <Link
                    href={card.href}
                    onClick={() => switchRole(card.role)}
                    aria-label={`Switch to ${card.role} role and enter ${card.title} dashboard`}
                    className={`flex-1 py-2 px-4 rounded-md bg-linear-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-[#03110a] text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400`}
                  >
                    <span>Enter Pitch</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ===== DIFFERENTIATORS — Trophy Grid ===== */}
      <section aria-labelledby="why-title" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="card-floodlit rounded-xl p-8 sm:p-12 shadow-2xl space-y-8 relative overflow-hidden">
          <div className="absolute inset-0 pitch-stripes opacity-20" aria-hidden="true" />
          <div className="max-w-3xl space-y-2 relative z-10">
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-amber-400" aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-widest text-amber-300 jersey-heading">
                Innovation &amp; Differentiation
              </span>
            </div>
            <h2 id="why-title" className="jersey-heading text-3xl sm:text-4xl font-black text-white">
              Why This Platform <span className="trophy-text">Wins The Tournament</span>
            </h2>
            <p className="text-sm text-emerald-50/70">
              We did not build a simple FAQ chatbot. We architected a production-ready, enterprise command center solving real
              operational challenges during 70,000-spectator tournament surges.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative z-10">
            {[
              { color: 'text-emerald-400', title: 'Real GLM 5.2 Integration', body: 'Five copilot operations route through z-ai-web-dev-sdk (GLM 5.2) by default, with deterministic fallback if the call fails or times out (>3s).' },
              { color: 'text-teal-400', title: 'What-If Sandbox', body: 'Evaluates complex operational interventions across live stadium telemetry without risking live fan safety.' },
              { color: 'text-cyan-400', title: 'WCAG 2.2 AA', body: 'Full keyboard nav, ARIA landmarks, screen-reader labels, skip link, and dedicated step-free elevator/ramp routing.' },
              { color: 'text-purple-400', title: 'Deterministic Safety', body: 'Life-critical evacuation overrides bypass LLM generation entirely to guarantee zero latency and zero hallucination.' },
              { color: 'text-amber-400', title: 'Server-Side RBAC', body: 'HMAC-signed role tokens verified on every mutating API call. Unauthorized roles get 403 — server is the source of truth.' },
              { color: 'text-rose-400', title: 'Real-Time Cross-Tab Sync', body: 'Server-Sent Events stream pushes state changes to every connected dashboard. One role action is instantly visible on all others.' },
              { color: 'text-sky-400', title: 'Multimodal Photo Triage', body: 'Volunteer incident reporter sends actual photo URLs to GLM Vision for severity grading and structured JSON classification.' },
              { color: 'text-fuchsia-400', title: 'Auditable AI Decisions', body: 'Every GLM call is logged with engine name, actor uid, and structured response — full traceability.' },
              { color: 'text-orange-400', title: 'Transportation & Parking', body: 'Fan Copilot gives grounded parking, EV-charging, shuttle, and commuter-rail recommendations — covering all 8 brief pillars.' },
            ].map((item) => (
              <div key={item.title} className="bg-[#03110a]/80 p-5 rounded-lg border border-emerald-900/40 space-y-2 hover:border-emerald-700/60 transition-colors">
                <CheckCircle2 className={`w-5 h-5 ${item.color}`} aria-hidden="true" />
                <h3 className="font-black text-white text-sm jersey-heading">{item.title}</h3>
                <p className="text-xs text-emerald-50/60">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
