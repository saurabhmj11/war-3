'use client';

import React from 'react';
import { RoleGuard } from '@/components/auth/role-guard';
import { IncidentReporter } from '@/components/volunteer/incident-reporter';
import { PageHeader } from '@/components/layout/page-header';
import { Sparkles } from 'lucide-react';

export default function VolunteerDashboardPage() {
  return (
    <RoleGuard allowedRoles={['VOLUNTEER', 'OPERATIONS']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        <PageHeader
          persona="PERSONA 2 • ELENA ROSTOVA • CONCOURSE B GROUND STAFF"
          badge="VOL-881"
          title="Volunteer Checklist & Incident Triage"
          description="Manage your shift tasks and submit multimodal safety reports. Gemini Vision automatically classifies photo severity and dispatches medical or security teams."
          icon={Sparkles}
          kit="sky"
          number="06"
        />
        <IncidentReporter />
      </div>
    </RoleGuard>
  );
}
