export type UserRole = 'FAN' | 'VOLUNTEER' | 'OPERATIONS' | 'SECURITY' | 'MEDICAL' | 'ADMIN';

export type LanguageCode = 'en' | 'es' | 'fr' | 'pt' | 'ar' | 'ja' | 'hi' | 'de';

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  stadiumId: string;
  preferredLanguage: LanguageCode;
  accessibilityNeeds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RolePermission {
  roleId: UserRole;
  displayName: string;
  permissions: string[];
  allowedDashboards: string[];
  description: string;
}

export interface Stadium {
  stadiumId: string;
  name: string;
  city: string;
  capacity: number;
  centerCoordinates: GeoCoordinates;
  activeTournament: string;
  emergencyLockdownActive: boolean;
  concourseLevels: string[];
}

export type GateStatus = 'OPEN' | 'CONGESTED' | 'CLOSED' | 'EMERGENCY_EXIT_ONLY';

export interface Gate {
  gateId: string;
  stadiumId: string;
  name: string;
  location: GeoCoordinates;
  status: GateStatus;
  currentWaitMinutes: number;
  turnstileVelocityPerMin: number;
  maxCapacityPerMin: number;
  assignedSectors: string[];
}

export interface Seat {
  seatId: string;
  stadiumId: string;
  sector: string;
  row: string;
  seatNumber: string;
  concourseLevel: string;
  nearestGateId: string;
  nearestRestroomId: string;
  nearestFoodVendorId: string;
  isAccessible: boolean;
}

export interface Route {
  routeId: string;
  stadiumId: string;
  originId: string;
  destinationId: string;
  distanceMeters: number;
  estimatedWalkMinutes: number;
  polyline: string;
  isStepFree: boolean;
}

export type ParkingStatus = 'OPEN' | 'NEAR_CAPACITY' | 'FULL' | 'CLOSED';

export interface Parking {
  lotId: string;
  stadiumId: string;
  name: string;
  totalSpaces: number;
  occupiedSpaces: number;
  status: ParkingStatus;
  shuttleConnectionToGate: string;
  evChargingAvailable: boolean;
}

export interface FoodVendor {
  vendorId: string;
  stadiumId: string;
  name: string;
  sector: string;
  concourseLevel: string;
  cuisineType: string;
  dietaryOptions: string[];
  currentQueueMinutes: number;
  status: 'OPEN' | 'CLOSED' | 'BUSY';
}

export interface Restroom {
  restroomId: string;
  stadiumId: string;
  sector: string;
  concourseLevel: string;
  type: 'MALE' | 'FEMALE' | 'ALL_GENDER' | 'FAMILY_ACCESSIBLE';
  accessibleStalls: number;
  currentQueueMinutes: number;
  needsJanitorialService: boolean;
}

export interface AccessibilityRoute extends Route {
  features: string[];
}

export type IncidentType = 'MEDICAL' | 'SECURITY' | 'MAINTENANCE' | 'CROWD_CONGESTION';
export type IncidentStatus = 'REPORTED' | 'CLASSIFIED' | 'ACTIVE_TRIAGE' | 'RESOLVED';

export interface IncidentLocation {
  sector?: string;
  concourseLevel?: string;
  lat?: number;
  lng?: number;
}

export interface Incident {
  incidentId: string;
  stadiumId: string;
  reportedByUid: string;
  incidentType: IncidentType;
  location: IncidentLocation;
  severity: number; // 1 to 10
  status: IncidentStatus;
  description: string;
  photoUrl?: string;
  assignedTeamId?: string;
  aiSummary?: string;
  createdAt: string;
  resolvedAt?: string | null;
}

export type RiskLevel = 'GREEN' | 'YELLOW' | 'RED' | 'CRITICAL';

export interface CrowdMetric {
  metricId: string;
  stadiumId: string;
  zoneId: string;
  timestamp: string;
  currentDensityPct: number;
  riskLevel: RiskLevel;
  predictedWaitMinutes: number;
  aiCongestionForecast?: string;
}

export type VolunteerStatus = 'AVAILABLE' | 'ON_TASK' | 'ON_BREAK' | 'OFF_SHIFT';

export interface Volunteer {
  volunteerId: string;
  uid: string;
  stadiumId: string;
  name: string;
  assignedZone: string;
  currentLocation: GeoCoordinates;
  status: VolunteerStatus;
  certifications: string[];
  activeTaskId?: string;
}

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED';

export interface TaskChecklistItem {
  item: string;
  completed: boolean;
}

export interface Task {
  taskId: string;
  stadiumId: string;
  assignedToVolunteerId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  checklist: TaskChecklistItem[];
  createdAt: string;
}

export interface Announcement {
  announcementId: string;
  stadiumId: string;
  targetAudience: string[];
  priority: TaskPriority;
  status: 'DRAFT' | 'BROADCASTED';
  translations: Record<LanguageCode, string>;
  broadcastedAt?: string;
}

export interface Notification {
  notificationId: string;
  recipientUid: string;
  title: string;
  message: string;
  actionUrl?: string;
  read: boolean;
  createdAt: string;
}

export interface AIChatTurn {
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface AISession {
  sessionId: string;
  uid: string;
  copilotType: 'FAN' | 'VOLUNTEER' | 'OPERATIONS' | 'EMERGENCY';
  modelUsed: string;
  turnCount: number;
  history: AIChatTurn[];
  createdAt: string;
}

export interface Analytics {
  analyticsId: string;
  stadiumId: string;
  totalSpectatorsIngress: number;
  avgNavigationTimeMinutes: number;
  avgCongestionResponseMinutes: number;
  totalAiQueriesProcessed: number;
  multilingualBroadcastsGenerated: number;
  avgAiResponseLatencyMs: number;
  /** Concession food waste diverted from landfill this match (kg). */
  concessionWasteDivertedKg: number;
  /** Energy used per zone average (kWh). */
  energyPerZoneKwh: number;
  recordedAt: string;
}

export interface AuditLog {
  auditId: string;
  stadiumId: string;
  actorUid: string;
  actionType: string;
  targetResource: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

// AI DTOs for Gemini Structured Outputs
export interface FanCopilotResponseDTO {
  responseText: string;
  suggestedAction?: {
    type: 'NAVIGATE' | 'VIEW_WAIT_TIME' | 'REPORT_ISSUE';
    targetId?: string;
    label: string;
  };
  navigationPolyline?: string;
  estimatedWaitMinutes?: number;
  translatedLanguage: LanguageCode;
  /** Indicates which engine produced this response (audit / observability). */
  engine: 'gemini' | 'simulated';
}

export interface WhatIfScenarioDTO {
  stadiumId: string;
  interventionType: 'CLOSE_GATE' | 'OPEN_AUXILIARY_GATE' | 'TRANSIT_DELAY' | 'WEATHER_ALERT' | 'REASSIGN_STAFF';
  targetGateId?: string;
  targetSector?: string;
  description: string;
}

export interface WhatIfResultDTO {
  scenarioId: string;
  projectedCongestionReductionPct: number;
  newEstimatedWaitMinutes: number;
  affectedSectors: string[];
  recommendedActions: string[];
  executiveSummary: string;
  riskSeverityAfter: number;
  engine: 'gemini' | 'simulated';
}

export interface IncidentClassificationDTO {
  incidentType: IncidentType;
  estimatedSeverity: number;
  recommendedAction: string;
  requiredTeam: 'SECURITY' | 'MEDICAL' | 'OPERATIONS';
  aiSummary: string;
  engine: 'gemini' | 'simulated';
}

export interface EmergencyBroadcastDTO {
  translations: Record<LanguageCode, string>;
  engine: 'gemini' | 'simulated';
}

export interface OperationsSummaryDTO {
  markdown: string;
  engine: 'gemini' | 'simulated';
}
