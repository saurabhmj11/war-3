'use client';

import React, { useState } from 'react';
import { Gate } from '@/domain/types';
import { useStadiumState } from '@/hooks/use-stadium-state';
import { BallPassAnimation } from '@/components/football/ball-pass-animation';
import { Compass, AlertTriangle } from 'lucide-react';

interface StadiumMapProps {
  activeRouteId?: string;
  selectedGateId?: string;
  onGateSelect?: (gate: Gate) => void;
  showHeatmap?: boolean;
  /** Visually hides the concourse-level switcher when only one level is relevant (e.g. medical stretcher map). */
  compact?: boolean;
}

const GATE_COORDS: Record<string, { x: number; y: number; label: string; zone: string }> = {
  'gate-a': { x: 120, y: 300, label: 'Gate A (VIP West)', zone: 'Gate A VIP Plaza' },
  'gate-b': { x: 400, y: 520, label: 'Gate B (South Plaza)', zone: 'Gate B Plaza' },
  'gate-c': { x: 680, y: 300, label: 'Gate C (Rail Hub East)', zone: 'Gate C Plaza' },
  'gate-d': { x: 400, y: 80, label: 'Gate D (North Aux)', zone: 'Gate D Auxiliary Plaza' },
};

function getGateColor(status: Gate['status'], waitMins: number) {
  if (status === 'EMERGENCY_EXIT_ONLY') return { fill: '#06b6d4', stroke: '#0e7490', pulse: true, label: 'EMERGENCY' };
  if (status === 'CLOSED') return { fill: '#64748b', stroke: '#1e293b', pulse: false, label: 'CLOSED' };
  if (status === 'CONGESTED' || waitMins > 30) return { fill: '#ef4444', stroke: '#991b1b', pulse: true, label: 'RED' };
  if (waitMins > 15) return { fill: '#facc15', stroke: '#b45309', pulse: false, label: 'YELLOW' };
  return { fill: '#22c55e', stroke: '#065f46', pulse: false, label: 'GREEN' };
}

export const StadiumMap: React.FC<StadiumMapProps> = ({
  selectedGateId,
  onGateSelect,
  showHeatmap = true,
  compact = false,
}) => {
  const { state } = useStadiumState();
  const [concourseLevel, setConcourseLevel] = useState<'Lower Bowl' | 'Mezzanine' | 'Upper Bowl'>('Lower Bowl');
  const [selectedGate, setSelectedGate] = useState<Gate | null>(null);

  React.useEffect(() => {
    if (selectedGateId) {
      const match = state.gates.find((g) => g.gateId === selectedGateId);
      if (match) setSelectedGate(match);
    }
  }, [selectedGateId, state.gates]);

  const handleGateClick = (gate: Gate) => {
    setSelectedGate(gate);
    onGateSelect?.(gate);
  };

  return (
    <section
      aria-label="Interactive stadium map showing live gate wait times and crowd heatmap"
      className="w-full card-floodlit rounded-xl p-6 shadow-2xl flex flex-col gap-6 relative overflow-hidden"
    >
      <div className="absolute inset-0 pitch-stripes opacity-15" aria-hidden="true" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-emerald-900/50 pb-4 relative z-10">
        <div>
          <h3 className="jersey-heading text-lg font-black text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-400" aria-hidden="true" />
            <span>Vector Pitch Map</span>
            <span className="text-xs bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 px-2 py-0.5 rounded-md font-mono">
              METLIFE • 82,500 CAP
            </span>
          </h3>
          <p className="text-xs text-emerald-50/60 mt-0.5">
            Real-time turnstile telemetry, crowd risk heatmap overlays, and step-free polyline routing.
          </p>
        </div>

        {!compact && (
          <div
            className="flex items-center gap-1 bg-[#03110a] p-1 rounded-md border border-emerald-900/50"
            role="group"
            aria-label="Select concourse level"
          >
            {(['Lower Bowl', 'Mezzanine', 'Upper Bowl'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setConcourseLevel(level)}
                aria-pressed={concourseLevel === level}
                className={`px-3 py-1.5 rounded-md text-xs font-black uppercase tracking-wider transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                  concourseLevel === level
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-[#03110a] shadow-md'
                    : 'text-emerald-100/60 hover:text-emerald-100'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative w-full aspect-[16/10] bg-gradient-to-b from-[#0a3a22] to-[#051a10] rounded-md border border-emerald-900/50 overflow-hidden flex items-center justify-center p-4">
        {/* Floodlight cones from the four corners */}
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-amber-300/15 to-transparent pointer-events-none" aria-hidden="true" />
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-amber-300/15 to-transparent pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-amber-300/8 to-transparent pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-amber-300/8 to-transparent pointer-events-none" aria-hidden="true" />

        <svg viewBox="0 0 800 600" className="w-full h-full max-h-[500px] drop-shadow-2xl relative z-10" role="img" aria-label="Vector map of MetLife Stadium with four entrance gates, yard-line markings, and a center pitch">
          <defs>
            {/* Pitch grass gradient with mowed stripes */}
            <linearGradient id="pitch-grass" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0a3a22" />
              <stop offset="10%" stopColor="#0f5132" />
              <stop offset="20%" stopColor="#0a3a22" />
              <stop offset="30%" stopColor="#0f5132" />
              <stop offset="40%" stopColor="#0a3a22" />
              <stop offset="50%" stopColor="#0f5132" />
              <stop offset="60%" stopColor="#0a3a22" />
              <stop offset="70%" stopColor="#0f5132" />
              <stop offset="80%" stopColor="#0a3a22" />
              <stop offset="90%" stopColor="#0f5132" />
              <stop offset="100%" stopColor="#0a3a22" />
            </linearGradient>

            {/* Heatmap gradients */}
            <radialGradient id="heat-red" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heat-green" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heat-yellow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#facc15" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heat-cyan" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </radialGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer perimeter / plaza ring */}
          <ellipse cx="400" cy="300" rx="340" ry="240" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="8 8" />

          {/* Outer stadium structure (Upper Bowl) — filled with pitch grass */}
          <ellipse
            cx="400"
            cy="300"
            rx="280"
            ry="190"
            fill="url(#pitch-grass)"
            stroke={concourseLevel === 'Upper Bowl' ? '#22c55e' : 'rgba(255,255,255,0.15)'}
            strokeWidth={concourseLevel === 'Upper Bowl' ? '4' : '2'}
            className="transition-all duration-300"
          />
          <ellipse cx="400" cy="300" rx="220" ry="145" fill="#0a1f15" stroke={concourseLevel === 'Mezzanine' ? '#22c55e' : 'rgba(255,255,255,0.2)'} strokeWidth={concourseLevel === 'Mezzanine' ? '4' : '2'} className="transition-all duration-300" />
          <ellipse cx="400" cy="300" rx="160" ry="105" fill="#03110a" stroke={concourseLevel === 'Lower Bowl' ? '#22c55e' : 'rgba(255,255,255,0.3)'} strokeWidth={concourseLevel === 'Lower Bowl' ? '4' : '2'} className="transition-all duration-300" />

          {/* Crowd heatmap overlays driven by live metrics */}
          {showHeatmap && (
            <g>
              {state.crowdMetrics.map((m) => {
                const coords = Object.values(GATE_COORDS).find((c) => c.zone === m.zoneId);
                if (!coords) return null;
                const grad = m.riskLevel === 'RED' || m.riskLevel === 'CRITICAL' ? 'heat-red' : m.riskLevel === 'YELLOW' ? 'heat-yellow' : 'heat-green';
                const r = Math.max(80, Math.min(180, m.currentDensityPct * 1.7));
                return <circle key={m.metricId} cx={coords.x} cy={coords.y} r={r} fill={`url(#${grad})`} className={m.riskLevel === 'RED' || m.riskLevel === 'CRITICAL' ? 'animate-pulse' : ''} />;
              })}
            </g>
          )}

          {/* ===== FOOTBALL PITCH (center) ===== */}
          {/* Outer boundary */}
          <rect x="290" y="220" width="220" height="160" fill="url(#pitch-grass)" stroke="#ffffff" strokeWidth="2" opacity="0.95" />
          {/* Halfway line */}
          <line x1="400" y1="220" x2="400" y2="380" stroke="#ffffff" strokeWidth="2" opacity="0.9" />
          {/* Center circle */}
          <circle cx="400" cy="300" r="32" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.9" />
          <circle cx="400" cy="300" r="3" fill="#ffffff" />
          {/* Center spot */}
          {/* Penalty box left */}
          <rect x="290" y="260" width="40" height="80" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.9" />
          <rect x="290" y="285" width="18" height="30" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.9" />
          {/* Penalty box right */}
          <rect x="470" y="260" width="40" height="80" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.9" />
          <rect x="492" y="285" width="18" height="30" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.9" />
          {/* Goal left */}
          <rect x="285" y="295" width="5" height="10" fill="#ffffff" opacity="0.9" />
          {/* Goal right */}
          <rect x="510" y="295" width="5" height="10" fill="#ffffff" opacity="0.9" />

          {/* Tournament branding text */}
          <text x="400" y="212" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="10" fontWeight="bold" letterSpacing="3" fontFamily="monospace">
            FIFA WORLD CUP 2026 • METLIFE PITCH
          </text>

          {/* Sector labels */}
          <text x="400" y="145" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10" fontWeight="bold" fontFamily="monospace">SECTORS 101-115 (NORTH)</text>
          <text x="400" y="465" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10" fontWeight="bold" fontFamily="monospace">SECTORS 120-135 (SOUTH)</text>
          <text x="210" y="303" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10" fontWeight="bold" fontFamily="monospace">WEST VIP</text>
          <text x="590" y="303" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold" fontFamily="monospace">EAST RAIL HUB</text>

          {/* Animated polyline: Gate C → Gate D reroute suggestion, with a football passing along it */}
          <g>
            <path d="M 680 300 Q 640 120 400 80" fill="none" stroke="#22c55e" strokeWidth="4" strokeDasharray="8 6" filter="url(#glow)">
              <animate attributeName="stroke-dashoffset" from="0" to="-28" dur="2s" repeatCount="indefinite" />
            </path>
            {/* Football continuously traveling the reroute polyline — a "long ball" from Gate C to Gate D */}
            <BallPassAnimation pathD="M 680 300 Q 640 120 400 80" duration={4} radius={9} idSuffix="reroute" />
            <circle cx="560" cy="180" r="6" fill="#22c55e">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="1.6s" repeatCount="indefinite" />
            </circle>
            <text x="570" y="175" fill="#22c55e" fontSize="11" fontWeight="bold" className="drop-shadow-md">
              ⚡ AI Step-Free Reroute (3 min Walk)
            </text>
          </g>

          {/* Gates — referee-card circles */}
          {state.gates.map((gate) => {
            const coords = GATE_COORDS[gate.gateId] || { x: 400, y: 300, label: gate.name, zone: '' };
            const style = getGateColor(gate.status, gate.currentWaitMinutes);
            const isSelected = selectedGate?.gateId === gate.gateId;
            return (
              <g
                key={gate.gateId}
                onClick={() => handleGateClick(gate)}
                className="cursor-pointer group transition-transform hover:scale-110"
                role="button"
                tabIndex={0}
                aria-label={`${gate.name}, status ${gate.status}, current wait ${gate.currentWaitMinutes} minutes`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleGateClick(gate);
                  }
                }}
              >
                {style.pulse && (
                  <circle cx={coords.x} cy={coords.y} r="28" fill="none" stroke={style.fill} strokeWidth="3" className="animate-ping opacity-75" />
                )}
                {isSelected && (
                  <circle cx={coords.x} cy={coords.y} r="24" fill="none" stroke="#38bdf8" strokeWidth="3" strokeDasharray="4 4" />
                )}
                <circle cx={coords.x} cy={coords.y} r="16" fill={style.fill} stroke={style.stroke} strokeWidth="3" className="shadow-lg transition-all" />
                <text x={coords.x} y={coords.y + 4} textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="900" fontFamily="monospace">
                  {gate.gateId.split('-')[1]?.toUpperCase() || 'G'}
                </text>
                <rect x={coords.x - 55} y={coords.y + 22} width="110" height="22" rx="4" fill="#03110a" stroke={style.fill} strokeWidth="1.5" />
                <text x={coords.x} y={coords.y + 36} textAnchor="middle" fill="#f8fafc" fontSize="10" fontWeight="bold" fontFamily="monospace">
                  {gate.gateId.toUpperCase()} ({gate.currentWaitMinutes}m)
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected gate tooltip */}
        {selectedGate && (
          <div className="absolute bottom-4 right-4 max-w-xs w-full bg-[#0a1f15]/95 border border-emerald-700/60 rounded-md p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-200" role="dialog" aria-label={`${selectedGate.name} details`}>
            <div className="flex items-center justify-between border-b border-emerald-900/50 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${selectedGate.status === 'CONGESTED' ? 'bg-red-500' : selectedGate.status === 'EMERGENCY_EXIT_ONLY' ? 'bg-cyan-400' : 'bg-emerald-500'}`} aria-hidden="true" />
                <span className="text-sm font-black text-white uppercase jersey-heading">{selectedGate.name}</span>
              </div>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-md font-mono uppercase ${
                  selectedGate.status === 'CONGESTED'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : selectedGate.status === 'EMERGENCY_EXIT_ONLY'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {selectedGate.status}
              </span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-emerald-100/60">
                <span>Wait Time:</span>
                <span className="font-black text-white font-mono scoreboard-numeral">{selectedGate.currentWaitMinutes} min</span>
              </div>
              <div className="flex justify-between text-emerald-100/60">
                <span>Turnstile Velocity:</span>
                <span className="font-black text-white font-mono">{selectedGate.turnstileVelocityPerMin} / min</span>
              </div>
              <div className="flex justify-between text-emerald-100/60">
                <span>Sectors:</span>
                <span className="font-bold text-emerald-300">{selectedGate.assignedSectors.join(', ')}</span>
              </div>
            </div>
            {selectedGate.status === 'CONGESTED' && (
              <div className="mt-3 p-2.5 rounded-md bg-red-500/10 border border-red-500/30 text-[11px] text-red-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" aria-hidden="true" />
                <div>
                  <span className="font-black">AI Rerouting Active:</span> Redirecting commuter rail fans to Gate D to drop wait times by 35%.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs relative z-10" role="list" aria-label="Map legend">
        {[
          { color: 'bg-emerald-500', title: 'Optimal Flow', desc: '< 15 min wait' },
          { color: 'bg-amber-500', title: 'Elevated Load', desc: '15 - 30 min wait' },
          { color: 'bg-red-500', title: 'Bottleneck', desc: '> 30 min wait' },
          { color: 'bg-cyan-400 border-2 border-white', title: 'Step-Free Route', desc: 'Elevator path' },
        ].map((item) => (
          <div key={item.title} role="listitem" className="bg-[#03110a]/80 p-3 rounded-md border border-emerald-900/40 flex items-center gap-3">
            <div className={`w-3.5 h-3.5 rounded-full ${item.color} shadow-lg`} aria-hidden="true" />
            <div>
              <div className="font-black text-white jersey-heading">{item.title}</div>
              <div className="text-[11px] text-emerald-100/50">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
