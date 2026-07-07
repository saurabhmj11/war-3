'use client';

import React, { useState } from 'react';
import { RoleGuard } from '@/components/auth/role-guard';
import { FanCopilotChat } from '@/components/fan/fan-copilot-chat';
import { StadiumMap } from '@/components/stadium/stadium-map';
import { PageHeader } from '@/components/layout/page-header';
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
        <PageHeader
          persona="PERSONA 1 • CARLOS • INTERNATIONAL FAN"
          badge="METLIFE STADIUM"
          title="Fan Navigation & Concessions"
          description="Your personalized World Cup partner. Get instant multilingual assistance, live wait times, and WCAG 2.2 AA accessible step-free directions."
          icon={Compass}
          kit="emerald"
          number="10"
        />

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

            {/* Amenity tiles — jersey-card style */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="card-floodlit rounded-md p-4 flex items-center gap-3">
                <div className="w-1 h-10 rounded-full bg-emerald-400" aria-hidden="true" />
                <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" aria-hidden="true">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-white jersey-heading">SEAT 112 • ROW 14</div>
                  <div className="text-[11px] text-emerald-100/60">Lower Bowl • Step-free</div>
                </div>
              </div>
              <div className="card-floodlit rounded-md p-4 flex items-center gap-3">
                <div className="w-1 h-10 rounded-full bg-teal-400" aria-hidden="true" />
                <div className="p-2 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/20" aria-hidden="true">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-white jersey-heading">{tacoVendor?.name ?? 'TACO FIESTA'}</div>
                  <div className="text-[11px] text-emerald-100/60">{tacoVendor?.currentQueueMinutes ?? 12} min queue • Veg/Halal</div>
                </div>
              </div>
              <div className="card-floodlit rounded-md p-4 flex items-center gap-3">
                <div className="w-1 h-10 rounded-full bg-cyan-400" aria-hidden="true" />
                <div className="p-2 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20" aria-hidden="true">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-white jersey-heading">RESTROOM 110</div>
                  <div className="text-[11px] text-emerald-100/60">All Gender • {restroom110?.currentQueueMinutes ?? 5} min wait</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
