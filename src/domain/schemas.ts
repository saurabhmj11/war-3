import { z } from 'zod';

export const UserRoleSchema = z.enum(['FAN', 'VOLUNTEER', 'OPERATIONS', 'SECURITY', 'MEDICAL', 'ADMIN']);
export const LanguageCodeSchema = z.enum(['en', 'es', 'fr', 'pt', 'ar', 'ja', 'hi', 'de']);

export const GeoCoordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const UserProfileSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().min(1),
  role: UserRoleSchema,
  stadiumId: z.string().min(1),
  preferredLanguage: LanguageCodeSchema,
  accessibilityNeeds: z.array(z.string()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const GateStatusSchema = z.enum(['OPEN', 'CONGESTED', 'CLOSED', 'EMERGENCY_EXIT_ONLY']);

export const IncidentTypeSchema = z.enum(['MEDICAL', 'SECURITY', 'MAINTENANCE', 'CROWD_CONGESTION']);
export const IncidentStatusSchema = z.enum(['REPORTED', 'CLASSIFIED', 'ACTIVE_TRIAGE', 'RESOLVED']);

export const IncidentCreateSchema = z.object({
  stadiumId: z.string().min(1),
  incidentType: IncidentTypeSchema,
  location: z.object({
    sector: z.string().optional(),
    concourseLevel: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }),
  description: z.string().min(5, 'Description must be at least 5 characters long').max(1000),
  photoUrl: z.string().url().optional(),
});

export const RiskLevelSchema = z.enum(['GREEN', 'YELLOW', 'RED', 'CRITICAL']);

export const TaskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
export const TaskStatusSchema = z.enum(['ASSIGNED', 'IN_PROGRESS', 'COMPLETED']);

// AI DTO Validation Schemas
export const WhatIfScenarioSchema = z.object({
  stadiumId: z.string().min(1),
  interventionType: z.enum(['CLOSE_GATE', 'OPEN_AUXILIARY_GATE', 'TRANSIT_DELAY', 'WEATHER_ALERT', 'REASSIGN_STAFF']),
  targetGateId: z.string().optional(),
  targetSector: z.string().optional(),
  description: z.string().min(5),
});

export const WhatIfResultSchema = z.object({
  scenarioId: z.string(),
  projectedCongestionReductionPct: z.number().min(0).max(100),
  newEstimatedWaitMinutes: z.number().min(0),
  affectedSectors: z.array(z.string()),
  recommendedActions: z.array(z.string()),
  executiveSummary: z.string(),
  riskSeverityAfter: z.number().min(1).max(10),
});

export const AIChatRequestSchema = z.object({
  copilotType: z.enum(['FAN', 'VOLUNTEER', 'OPERATIONS', 'EMERGENCY']),
  message: z.string().min(1),
  stadiumId: z.string().min(1),
  userLocation: z.string().optional(),
  language: LanguageCodeSchema.default('en'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        content: z.string(),
        timestamp: z.string(),
      })
    )
    .optional(),
});

export const EmergencyBroadcastSchema = z.object({
  summaryEn: z.string().min(5),
  targetSectors: z.array(z.string()).min(1),
  priority: z.enum(['HIGH', 'URGENT']).default('HIGH'),
});
