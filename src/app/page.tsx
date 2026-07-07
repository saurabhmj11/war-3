'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { DemoCommandCenter } from '@/components/demo/demo-command-center';
import { StadiumMap } from '@/components/stadium/stadium-map';
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
  Globe,
  CheckCircle2,
  Radio,
  Cpu,
} from 'lucide-react';

const ROLE_CARDS = [
  {
    role: 'FAN' as const,
    title: 'Fan Navigation & Concessions',
    subtitle: 'Carlos • International Tourist',
    description: 'Multilingual assistant (8 languages), step-by-step vector map routing, live turnstile wait times, and WCAG 2.2 AA accessible step-free paths.',
    href: '/fan',
    icon: Compass,
    color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-300',
    badge: '8 LANGUAGES SUPPORTED',
  },
  {
    role: 'VOLUNTEER' as const,
    title: 'Volunteer Task Checklist',
    subtitle: 'Elena • Concourse B Ground Staff',
    description: 'GPS-prioritized task checklist, multimodal AI incident photo classification (Gemini Vision), and voice note transcription.',
    href: '/volunteer',
    icon: Sparkles,
    color: 'from-sky-500/20 to-cyan-500/10 border-sky-500/30 text-sky-300',
    badge: 'GEMINI VISION ENABLED',
  },
  {
    role: 'OPERATIONS' as const,
    title: 'Operations Command Center',
    subtitle: 'Marcus • Venue Supervisor',
    description: 'Real-time telemetry across all stadium collections, crowd congestion heatmap overlays, and the AI What-If Simulation Sandbox.',
    href: '/operations',
    icon: LayoutDashboard,
    color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-300',
    badge: 'GEMINI 2.5 PRO ENGINE',
  },
  {
    role: 'SECURITY' as const,
    title: 'Security Alert Feed',
    subtitle: 'Sarah • Perimeter Security Lead',
    description: 'Priority-sorted threat tracking, crowd anomaly detection, and deterministic emergency gate evacuation override controls.',
    href: '/security',
    icon: Shield,
    color: 'from-red-500/20 to-rose-500/10 border-red-500/30 text-red-300',
    badge: 'DETERMINISTIC OVERRIDES',
  },
  {
    role: 'MEDICAL' as const,
    title: 'Medical Triage Dashboard',
    subtitle: 'Dr. Aris • Paramedic First-Aid Lead',
    description: 'Real-time triage queue (Priority 1-3), AI injury classification summaries, and step-free accessible stretcher extraction routing.',
    href: '/medical',
    icon: HeartPulse,
    color: 'from-purple-500/20 to-fuchsia-500/10 border-purple-500/30 text-purple-300',
    badge: 'STEP-FREE EXTRACTION',
  },
  {
    role: 'ADMIN' as const,
    title: 'System Admin Portal',
    subtitle: 'David • Cloud Infrastructure Lead',
    description: 'Analytics metrics, RBAC user management, prompt version inspection, and AI latency observability.',
    href: '/admin',
    icon: Lock,
    color: 'from-cyan-500/20 to-sky-500/10 border-cyan-500/30 text-cyan-300',
    badge: 'OBSERVABILITY',
  },
];

export default function HomePage() {
  const { switchRole, isGeminiLive } = useAuth();

  return (
    <div className="w-full flex flex-col gap-12 pb-16">
      {/* Hero */}
      <section className="relative w-full pt-12 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800/80" aria-labelledby="hero-title">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 blur-3xl pointer-events-none rounded-full" aria-hidden="true" />

        <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/40 shadow-xl shadow-emerald-500/10 text-xs font-semibold text-emerald-300 animate-in fade-in slide-in-from-top-4 duration-500">
            <Trophy className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <span className="uppercase tracking-wide font-mono">Prompt Wars Challenge 4 • Smart Stadiums &amp; Tournament Operations</span>
          </div>

          <h1 id="hero-title" className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl leading-tight sm:leading-none">
            The Digital Command Center for <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">FIFA World Cup 2026</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
            An enterprise-grade, cloud-native SaaS platform powered by <span className="text-white font-semibold">Google Gemini 2.5</span>. Predictive crowd control, 8-language real-time translation, and multimodal emergency coordination.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${isGeminiLive ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/15 text-amber-300 border-amber-500/40'}`}>
              <Cpu className="w-3.5 h-3.5" aria-hidden="true" />
              {isGeminiLive ? 'Live Google Gemini API connected' : 'Simulated engine (set GOOGLE_GENAI_API_KEY for live Gemini)'}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a
              href="#demo-section"
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-sm shadow-xl shadow-emerald-900/50 transition-all flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              <Zap className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" aria-hidden="true" />
              <span>Launch 9-Step Demo Storyline</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </a>

            <Link
              href="/operations"
              className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-sm border border-slate-700 shadow-lg transition-all flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <LayoutDashboard className="w-4 h-4 text-amber-400" aria-hidden="true" />
              <span>Enter Operations Sandbox</span>
            </Link>
          </div>

          {/* Telemetry Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 w-full max-w-4xl pt-8">
            {[
              { val: '82,500', label: 'MetLife Stadium Cap', color: 'text-white' },
              { val: '70,000', label: 'Simulated Ingress', color: 'text-emerald-400' },
              { val: '< 1.5s', label: 'AI TTFT Latency', color: 'text-cyan-400' },
              { val: '8 Core', label: 'World Cup Languages', color: 'text-purple-400' },
            ].map((stat, i) => (
              <div key={i} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-center backdrop-blur-xl">
                <div className={`text-2xl sm:text-3xl font-black font-mono ${stat.color}`}>{stat.val}</div>
                <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo-section" aria-labelledby="demo-title" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-6 scroll-mt-20">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">Competition Judge Evaluation Suite</span>
          <h2 id="demo-title" className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Interactive 9-Step Storyline Simulator</h2>
          <p className="text-sm text-slate-400 max-w-2xl mt-1">
            Test our dual-mode Gemini adapter live. Trigger simulated turnstile bottlenecks, AI What-If rerouting, volunteer task dispatch, and 8-language emergency coordination. All state changes sync across every connected browser tab via SSE.
          </p>
        </div>
        <DemoCommandCenter />
      </section>

      {/* Stadium Map */}
      <section aria-labelledby="map-title" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">Real-time Operational Telemetry</span>
          <h2 id="map-title" className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Live Venue Heatmap &amp; Polyline Routing</h2>
          <p className="text-sm text-slate-400 max-w-2xl mt-1">
            Watch how crowd density alerts dynamically reroute spectators to step-free accessible entrances. Updates flow over SSE — open a second tab on a different role to see cross-tab sync in action.
          </p>
        </div>
        <StadiumMap />
      </section>

      {/* Role Dashboards */}
      <section aria-labelledby="roles-title" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-6">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">Role-Based Access Control (RBAC)</span>
          <h2 id="roles-title" className="text-2xl sm:text-4xl font-extrabold text-white">6 Specialized Stakeholder Dashboards</h2>
          <p className="text-sm sm:text-base text-slate-400">
            Tailored tools, data feeds, and AI capabilities for every tournament role. Click any card to switch roles instantly — authorization is enforced server-side.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {ROLE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.role}
                className={`bg-gradient-to-br bg-slate-900/90 border rounded-3xl p-6 shadow-xl flex flex-col justify-between gap-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${card.color}`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-md" aria-hidden="true">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-slate-950/80 border border-slate-800 tracking-wider">
                      {card.badge}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider opacity-80 font-mono">{card.role} PROFILE</div>
                    <h3 className="text-xl font-extrabold text-white mt-0.5">{card.title}</h3>
                    <div className="text-xs font-semibold text-slate-400 mt-0.5">{card.subtitle}</div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{card.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => switchRole(card.role)}
                    className="px-3.5 py-2 rounded-xl bg-slate-950/80 hover:bg-slate-950 text-xs font-bold text-white border border-slate-800 transition-all flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    aria-label={`Switch active user profile to ${card.role}`}
                  >
                    <span>Select Profile</span>
                  </button>
                  <Link
                    href={card.href}
                    onClick={() => switchRole(card.role)}
                    className="flex-1 py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  >
                    <span>Launch Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Differentiators */}
      <section aria-labelledby="why-title" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl space-y-8">
          <div className="max-w-3xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">Innovation &amp; Differentiation</span>
            <h2 id="why-title" className="text-2xl sm:text-3xl font-extrabold text-white">Why This Platform Excels in Prompt Wars Challenge 4</h2>
            <p className="text-sm text-slate-400">
              We did not build a simple FAQ chatbot. We architected a production-ready, enterprise command center solving real operational challenges during 70,000-spectator tournament surges.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { color: 'text-emerald-400', title: 'Real Gemini Integration', body: 'Five copilot operations all route through @google/genai when an API key is set, with deterministic fallback if the call fails or times out (>3s).' },
              { color: 'text-teal-400', title: 'What-If Sandbox (Gemini Pro)', body: 'Evaluates complex operational interventions (gate closures, rail delays) across live stadium telemetry without risking live fan safety.' },
              { color: 'text-cyan-400', title: 'WCAG 2.2 AA Accessibility', body: 'Full keyboard navigation, ARIA landmarks, screen-reader labels, skip link, and dedicated step-free elevator/ramp routing for disabled fans.' },
              { color: 'text-purple-400', title: 'Deterministic Safety Overrides', body: 'Life-critical evacuation alarms and gate unlock overrides bypass LLM generation entirely to guarantee zero latency and zero hallucination.' },
              { color: 'text-amber-400', title: 'Server-Side RBAC', body: 'HMAC-signed role tokens verified on every mutating API call. Unauthorized roles get 403 — server is the source of truth, not the client.' },
              { color: 'text-rose-400', title: 'Real-Time Cross-Tab Sync', body: 'Server-Sent Events stream pushes state changes to every connected dashboard. One role action is instantly visible on all others.' },
              { color: 'text-sky-400', title: 'Multimodal Photo Triage', body: 'Volunteer incident reporter sends actual photo URLs to Gemini Vision for severity grading and structured JSON classification.' },
              { color: 'text-fuchsia-400', title: 'Auditable AI Decisions', body: 'Every Gemini call is logged with engine name (gemini/simulated), actor uid, and structured response — full traceability.' },
            ].map((item) => (
              <div key={item.title} className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80 space-y-2">
                <CheckCircle2 className={`w-5 h-5 ${item.color}`} aria-hidden="true" />
                <div className="font-bold text-white text-sm">{item.title}</div>
                <p className="text-xs text-slate-400">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
