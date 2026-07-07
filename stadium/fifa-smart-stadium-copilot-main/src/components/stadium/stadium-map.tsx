'use client';

import React, { useState, useEffect } from 'react';
import { Gate, CrowdMetric, Route } from '@/domain/types';
import { repository } from '@/lib/db/repository';
import {
  Layers,
  Users,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  Compass,
  Zap,
  Info,
} from 'lucide-react';

interface StadiumMapProps {
  activeRouteId?: string;
  selectedGateId?: string;
  onGateSelect?: (gate: Gate) => void;
  showHeatmap?: boolean;
}

export const StadiumMap: React.FC<StadiumMapProps> = ({
  activeRouteId,
  selectedGateId,
  onGateSelect,
  showHeatmap = true,
}) => {
  const [gates, setGates] = useState<Gate[]>([]);
  const [metrics, setMetrics] = useState<CrowdMetric[]>([]);
  const [concourseLevel, setConcourseLevel] = useState<'Lower Bowl' | 'Mezzanine' | 'Upper Bowl'>('Lower Bowl');
  const [selectedGate, setSelectedGate] = useState<Gate | null>(null);

  useEffect(() => {
    // Subscribe to live Firestore/memory updates
    const unsubGates = repository.subscribe<Gate>('gates', (data) => {
      setGates(data);
      if (selectedGateId) {
        const match = data.find((g) => g.gateId === selectedGateId);
        if (match) setSelectedGate(match);
      }
    });

    const unsubMetrics = repository.subscribe<CrowdMetric>('crowdMetrics', (data) => {
      setMetrics(data);
    });

    return () => {
      unsubGates();
      unsubMetrics();
    };
  }, [selectedGateId]);

  const handleGateClick = (gate: Gate) => {
    setSelectedGate(gate);
    if (onGateSelect) onGateSelect(gate);
  };

  const getGateColor = (status: Gate['status'], waitMins: number) => {
    if (status === 'CONGESTED' || waitMins > 30) return { fill: '#ef4444', stroke: '#991b1b', pulse: true, label: 'RED' };
    if (waitMins > 15) return { fill: '#f59e0b', stroke: '#b45309', pulse: false, label: 'YELLOW' };
    return { fill: '#10b981', stroke: '#065f46', pulse: false, label: 'GREEN' };
  };

  const getMetricForZone = (zoneName: string) => {
    return metrics.find((m) => m.zoneId.toLowerCase().includes(zoneName.toLowerCase())) || metrics[0];
  };

  // SVG Coordinates for MetLife Stadium Gates
  const GATE_COORDS: Record<string, { x: number; y: number; label: string; zone: string }> = {
    'gate-a': { x: 120, y: 300, label: 'Gate A (VIP West)', zone: 'Gate A VIP Plaza' },
    'gate-b': { x: 400, y: 520, label: 'Gate B (South Plaza)', zone: 'Gate B Plaza' },
    'gate-c': { x: 680, y: 300, label: 'Gate C (Rail Hub East)', zone: 'Gate C Plaza' },
    'gate-d': { x: 400, y: 80, label: 'Gate D (North Aux)', zone: 'Gate D Auxiliary Plaza' },
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 shadow-2xl flex flex-col gap-6 backdrop-blur-xl">
      
      {/* Map Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-400" />
            <span>Interactive Vector Stadium Map</span>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
              METLIFE STADIUM (82,500 CAP)
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time turnstile telemetry, crowd risk heatmap overlays, and step-free polyline routing.
          </p>
        </div>

        {/* Concourse Level Selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
          {(['Lower Bowl', 'Mezzanine', 'Upper Bowl'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setConcourseLevel(level)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                concourseLevel === level
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Map Canvas & Tooltip Container */}
      <div className="relative w-full aspect-[16/10] bg-slate-950/80 rounded-2xl border border-slate-800/80 overflow-hidden flex items-center justify-center p-4">
        
        {/* Background Grid & Radar Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        {/* SVG Stadium Map */}
        <svg viewBox="0 0 800 600" className="w-full h-full max-h-[500px] drop-shadow-2xl">
          <defs>
            {/* Heatmap Gradients */}
            <radialGradient id="heat-red" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heat-green" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heat-yellow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>

            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Crowd Heatmap Overlays */}
          {showHeatmap && (
            <g className="transition-opacity duration-500">
              {/* Gate C Commuter Rail Congestion Heatmap */}
              <circle cx="680" cy="300" r="160" fill="url(#heat-red)" className="animate-pulse" />
              {/* Gate D Auxiliary North Plaza Heatmap */}
              <circle cx="400" cy="80" r="140" fill="url(#heat-green)" />
              {/* Gate A VIP West Heatmap */}
              <circle cx="120" cy="300" r="140" fill="url(#heat-green)" />
              {/* Gate B South Plaza Heatmap */}
              <circle cx="400" cy="520" r="130" fill="url(#heat-yellow)" />
            </g>
          )}

          {/* Outer Stadium Perimeter / Plaza Ring */}
          <ellipse cx="400" cy="300" rx="340" ry="240" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="8 8" />

          {/* Outer Stadium Structure (Upper Bowl) */}
          <ellipse
            cx="400"
            cy="300"
            rx="280"
            ry="190"
            fill="#0f172a"
            stroke={concourseLevel === 'Upper Bowl' ? '#10b981' : '#334155'}
            strokeWidth={concourseLevel === 'Upper Bowl' ? '4' : '2'}
            className="transition-all duration-300"
          />

          {/* Mezzanine Ring */}
          <ellipse
            cx="400"
            cy="300"
            rx="220"
            ry="145"
            fill="#1e293b"
            stroke={concourseLevel === 'Mezzanine' ? '#10b981' : '#475569'}
            strokeWidth={concourseLevel === 'Mezzanine' ? '4' : '2'}
            className="transition-all duration-300"
          />

          {/* Lower Bowl Ring */}
          <ellipse
            cx="400"
            cy="300"
            rx="160"
            ry="105"
            fill="#090d16"
            stroke={concourseLevel === 'Lower Bowl' ? '#10b981' : '#64748b'}
            strokeWidth={concourseLevel === 'Lower Bowl' ? '4' : '2'}
            className="transition-all duration-300"
          />

          {/* FIFA World Cup Pitch (Soccer Field) */}
          <rect x="290" y="230" width="220" height="140" rx="12" fill="#064e3b" stroke="#10b981" strokeWidth="2" />
          <line x1="400" y1="230" x2="400" y2="370" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 4" />
          <circle cx="400" cy="300" r="28" fill="none" stroke="#10b981" strokeWidth="1.5" />
          <circle cx="400" cy="300" r="3" fill="#10b981" />
          
          <text x="400" y="220" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold" letterSpacing="2">
            FIFA WORLD CUP 2026 • METLIFE STADIUM PITCH
          </text>

          {/* Sector Markers */}
          <text x="400" y="145" textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="bold">SECTORS 101-115 (NORTH)</text>
          <text x="400" y="465" textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="bold">SECTORS 120-135 (SOUTH)</text>
          <text x="210" y="303" textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="bold">WEST VIP</text>
          <text x="590" y="303" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">EAST RAIL HUB</text>

          {/* Animated Polyline Navigation Route (Gate C to Gate D Rerouting) */}
          {(activeRouteId || true) && (
            <g className="animate-in fade-in duration-500">
              <path
                d="M 680 300 Q 640 120 400 80"
                fill="none"
                stroke="#10b981"
                strokeWidth="4"
                strokeDasharray="8 6"
                filter="url(#glow)"
                className="animate-[dash_2s_linear_infinite]"
              />
              <circle cx="560" cy="180" r="6" fill="#10b981" className="animate-ping" />
              <text x="570" y="175" fill="#10b981" fontSize="11" fontWeight="bold" className="drop-shadow-md">
                ⚡ AI Step-Free Reroute (3 min Walk)
              </text>
            </g>
          )}

          {/* Render Gates */}
          {gates.map((gate) => {
            const coords = GATE_COORDS[gate.gateId] || { x: 400, y: 300, label: gate.name, zone: '' };
            const style = getGateColor(gate.status, gate.currentWaitMinutes);
            const isSelected = selectedGate?.gateId === gate.gateId;

            return (
              <g
                key={gate.gateId}
                onClick={() => handleGateClick(gate)}
                className="cursor-pointer group transition-transform hover:scale-110"
              >
                {/* Outer Pulsing Alert Ring for Congested Gates */}
                {style.pulse && (
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r="28"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="3"
                    className="animate-ping opacity-75"
                  />
                )}

                {/* Selection Glow */}
                {isSelected && (
                  <circle cx={coords.x} cy={coords.y} r="24" fill="none" stroke="#38bdf8" strokeWidth="3" strokeDasharray="4 4" />
                )}

                {/* Gate Circle */}
                <circle
                  cx={coords.x}
                  cy={coords.y}
                  r="16"
                  fill={style.fill}
                  stroke={style.stroke}
                  strokeWidth="3"
                  className="shadow-lg transition-all"
                />

                <text
                  x={coords.x}
                  y={coords.y + 4}
                  textAnchor="middle"
                  fill="#0f172a"
                  fontSize="10"
                  fontWeight="black"
                  fontFamily="monospace"
                >
                  {gate.gateId.split('-')[1]?.toUpperCase() || 'G'}
                </text>

                {/* Gate Label Tag */}
                <rect
                  x={coords.x - 55}
                  y={coords.y + 22}
                  width="110"
                  height="22"
                  rx="6"
                  fill="#0f172a"
                  stroke={style.fill}
                  strokeWidth="1.5"
                />
                <text x={coords.x} y={coords.y + 36} textAnchor="middle" fill="#f8fafc" fontSize="10" fontWeight="bold">
                  {gate.gateId.toUpperCase()} ({gate.currentWaitMinutes}m)
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected Gate / Tooltip Overlay Box */}
        {selectedGate && (
          <div className="absolute bottom-4 right-4 max-w-xs w-full bg-slate-900/95 border border-slate-700/90 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                <span className="text-sm font-bold text-white uppercase">{selectedGate.name}</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                selectedGate.status === 'CONGESTED' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {selectedGate.status}
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Current Wait Time:</span>
                <span className="font-bold text-white font-mono">{selectedGate.currentWaitMinutes} minutes</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Turnstile Velocity:</span>
                <span className="font-bold text-white font-mono">{selectedGate.turnstileVelocityPerMin} / min</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Assigned Sectors:</span>
                <span className="font-bold text-emerald-400">{selectedGate.assignedSectors.join(', ')}</span>
              </div>
            </div>

            {selectedGate.status === 'CONGESTED' && (
              <div className="mt-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-[11px] text-red-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <div>
                  <span className="font-bold">AI Rerouting Active:</span> Redirecting commuter rail fans to Gate D to drop wait times by 35%.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Map Legend & Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 flex items-center gap-3">
          <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></div>
          <div>
            <div className="font-bold text-white">Optimal Flow</div>
            <div className="text-[11px] text-slate-400">&lt; 15 min wait time</div>
          </div>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 flex items-center gap-3">
          <div className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50"></div>
          <div>
            <div className="font-bold text-white">Elevated Load</div>
            <div className="text-[11px] text-slate-400">15 - 30 min wait time</div>
          </div>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 flex items-center gap-3">
          <div className="w-3.5 h-3.5 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/50"></div>
          <div>
            <div className="font-bold text-white">Bottleneck Alert</div>
            <div className="text-[11px] text-slate-400">&gt; 30 min wait time</div>
          </div>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 flex items-center gap-3">
          <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-white"></div>
          <div>
            <div className="font-bold text-white">Accessible Route</div>
            <div className="text-[11px] text-slate-400">Step-free elevator path</div>
          </div>
        </div>
      </div>
    </div>
  );
};
