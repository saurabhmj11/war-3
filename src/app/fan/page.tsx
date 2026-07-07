'use client';

import React, { useState } from 'react';
import { RoleGuard } from '@/components/auth/role-guard';
import { FanCopilotChat } from '@/components/fan/fan-copilot-chat';
import { StadiumMap } from '@/components/stadium/stadium-map';
import { useStadiumState } from '@/hooks/use-stadium-state';
import { Compass, MapPin, ShieldCheck, Utensils } from 'lucide-react';

export default function FanDashboardPage() {
  const [activeRouteId, setActiveRouteId] = useState<string | undefined>('gate-c-to-sec-112');
  const { state } = useStadiumState();

  const tacoVendor = state.foodVendors.find((v) => v.vendorId === 'food-taco-fiesta');
  const restroom110 = state.restrooms.find((r) => r.restroomId === 'restroom-110');

  return (
    <RoleGuard allowedRoles={['FAN', 'VOLUNTEER', 'OPERATIONS']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">PERSONA 1: CARLOS • INTERNATIONAL FAN</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">METLIFE STADIUM</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 flex items-center gap-2.5">
              <Compass className="w-7 h-7 text-emerald-400" aria-hidden="true" />
              <span>Fan Navigation &amp; Concessions Dashboard</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Your personalized World Cup partner. Get instant multilingual assistance, live wait times, and WCAG 2.2 AA accessible step-free directions.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 w-full">
            <FanCopilotChat
              onNavigateRequest={(targetId) => {
                setActiveRouteId(`route-to-${targetId}`);
              }}
            />
          </div>

          <div className="lg:col-span-7 w-full space-y-6">
            <StadiumMap activeRouteId={activeRouteId} showHeatmap={true} />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" aria-hidden="true">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Seat Sec 112 Row 14</div>
                  <div className="text-[11px] text-slate-400">Lower Bowl • Step-free</div>
                </div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20" aria-hidden="true">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{tacoVendor?.name ?? 'Taco Fiesta'} (Sec {tacoVendor?.sector ?? '110'})</div>
                  <div className="text-[11px] text-slate-400">{tacoVendor?.currentQueueMinutes ?? 12} min queue • Veg/Halal</div>
                </div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" aria-hidden="true">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Restroom 110</div>
                  <div className="text-[11px] text-slate-400">All Gender • {restroom110?.currentQueueMinutes ?? 5} min wait</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
