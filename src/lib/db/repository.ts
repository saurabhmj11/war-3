import 'server-only';
import { SEED_DATA, SeedDatabase } from './seed-data';
import {
  Stadium,
  Gate,
  Route,
  Parking,
  FoodVendor,
  Restroom,
  AccessibilityRoute,
  Incident,
  CrowdMetric,
  Volunteer,
  Task,
  Announcement,
  Notification,
  AISession,
  Analytics,
  AuditLog,
  UserProfile,
  RolePermission,
  UserRole,
} from '@/domain/types';

/**
 * StadiumRepository — server-side singleton.
 *
 * IMPORTANT: This module imports `server-only` so any attempt to bundle it
 * into client components will fail the build. Client components must talk to
 * the API routes (`/api/state`, `/api/incidents`, etc.) which in turn call
 * this singleton.
 *
 * The singleton is hung off `globalThis` so that Next.js HMR / serverless
 * warm-restarts do not destroy in-memory state mid-session. In production
 * with multiple replicas this is a known limitation — see README for the
 * production upgrade path (Firestore / shared cache).
 */

export type CollectionName = keyof SeedDatabase;

class StadiumRepository {
  private memoryDb: SeedDatabase;
  private listeners: Map<CollectionName, Set<(data: unknown) => void>> = new Map();
  private seq = 0;

  constructor() {
    this.memoryDb = JSON.parse(JSON.stringify(SEED_DATA));
  }

  /**
   * Internal pub/sub used by the /api/events SSE endpoint to fan out
   * collection changes to every connected browser tab.
   */
  public subscribe<T>(collectionName: CollectionName, callback: (data: T[]) => void): () => void {
    if (!this.listeners.has(collectionName)) {
      this.listeners.set(collectionName, new Set());
    }
    this.listeners.get(collectionName)!.add(callback as (data: unknown[]) => void);
    // Immediately fire with current state so the subscriber gets a snapshot.
    callback(this.memoryDb[collectionName] as unknown as T[]);
    return () => {
      this.listeners.get(collectionName)?.delete(callback as (data: unknown[]) => void);
    };
  }

  private notifyListeners(collectionName: CollectionName) {
    const callbacks = this.listeners.get(collectionName);
    if (callbacks) {
      const currentData = this.memoryDb[collectionName];
      callbacks.forEach((cb) => cb(currentData));
    }
  }

  // --- Users & Roles ---
  public async getUserProfile(uid: string): Promise<UserProfile | null> {
    const user = this.memoryDb.users.find((u) => u.uid === uid);
    return user ? { ...user } : null;
  }

  public async getRolePermissions(role: UserRole): Promise<RolePermission | null> {
    const rolePerm = this.memoryDb.roles.find((r) => r.roleId === role);
    return rolePerm ? { ...rolePerm } : null;
  }

  public async getAllUsers(): Promise<UserProfile[]> {
    return this.memoryDb.users.map((u) => ({ ...u }));
  }

  // --- Stadium & Infrastructure ---
  public async getStadium(stadiumId = 'metlife-ny-nj'): Promise<Stadium | null> {
    const stadium = this.memoryDb.stadiums.find((s) => s.stadiumId === stadiumId);
    return stadium ? { ...stadium } : null;
  }

  public async getGates(stadiumId = 'metlife-ny-nj'): Promise<Gate[]> {
    return this.memoryDb.gates.filter((g) => g.stadiumId === stadiumId).map((g) => ({ ...g }));
  }

  public async updateGateStatus(gateId: string, status: Gate['status'], waitMinutes: number): Promise<Gate | null> {
    const gateIndex = this.memoryDb.gates.findIndex((g) => g.gateId === gateId);
    if (gateIndex === -1) return null;
    this.memoryDb.gates[gateIndex].status = status;
    this.memoryDb.gates[gateIndex].currentWaitMinutes = waitMinutes;
    this.notifyListeners('gates');
    return { ...this.memoryDb.gates[gateIndex] };
  }

  public async getFoodVendors(stadiumId = 'metlife-ny-nj'): Promise<FoodVendor[]> {
    return this.memoryDb.foodVendors.filter((v) => v.stadiumId === stadiumId).map((v) => ({ ...v }));
  }

  public async getRestrooms(stadiumId = 'metlife-ny-nj'): Promise<Restroom[]> {
    return this.memoryDb.restrooms.filter((r) => r.stadiumId === stadiumId).map((r) => ({ ...r }));
  }

  public async getParking(stadiumId = 'metlife-ny-nj'): Promise<Parking[]> {
    return this.memoryDb.parking.filter((p) => p.stadiumId === stadiumId).map((p) => ({ ...p }));
  }

  public async getRoutes(stadiumId = 'metlife-ny-nj'): Promise<Route[]> {
    return this.memoryDb.routes.filter((r) => r.stadiumId === stadiumId).map((r) => ({ ...r }));
  }

  public async getAccessibilityRoutes(stadiumId = 'metlife-ny-nj'): Promise<AccessibilityRoute[]> {
    return this.memoryDb.accessibilityRoutes.filter((r) => r.stadiumId === stadiumId).map((r) => ({ ...r }));
  }

  // --- Incidents & Telemetry ---
  public async getIncidents(stadiumId = 'metlife-ny-nj'): Promise<Incident[]> {
    return this.memoryDb.incidents.filter((i) => i.stadiumId === stadiumId).map((i) => ({ ...i }));
  }

  public async createIncident(
    incidentData: Omit<Incident, 'incidentId' | 'createdAt' | 'status' | 'severity'> & { severity?: number }
  ): Promise<Incident> {
    this.seq += 1;
    const newIncident: Incident = {
      ...incidentData,
      incidentId: `inc-${Date.now()}-${this.seq}`,
      status: 'REPORTED',
      severity: incidentData.severity ?? 5,
      createdAt: new Date().toISOString(),
    };
    this.memoryDb.incidents.unshift(newIncident);
    this.notifyListeners('incidents');
    return { ...newIncident };
  }

  public async updateIncidentStatus(
    incidentId: string,
    status: Incident['status'],
    aiSummary?: string,
    assignedTeamId?: string
  ): Promise<Incident | null> {
    const index = this.memoryDb.incidents.findIndex((i) => i.incidentId === incidentId);
    if (index === -1) return null;
    this.memoryDb.incidents[index].status = status;
    if (aiSummary) this.memoryDb.incidents[index].aiSummary = aiSummary;
    if (assignedTeamId) this.memoryDb.incidents[index].assignedTeamId = assignedTeamId;
    if (status === 'RESOLVED') this.memoryDb.incidents[index].resolvedAt = new Date().toISOString();
    this.notifyListeners('incidents');
    return { ...this.memoryDb.incidents[index] };
  }

  public async getCrowdMetrics(stadiumId = 'metlife-ny-nj'): Promise<CrowdMetric[]> {
    return this.memoryDb.crowdMetrics.filter((m) => m.stadiumId === stadiumId).map((m) => ({ ...m }));
  }

  public async updateCrowdMetric(
    zoneId: string,
    densityPct: number,
    riskLevel: CrowdMetric['riskLevel'],
    forecast?: string
  ): Promise<CrowdMetric | null> {
    const index = this.memoryDb.crowdMetrics.findIndex((m) => m.zoneId === zoneId || m.metricId.includes(zoneId));
    if (index === -1) return null;
    this.memoryDb.crowdMetrics[index].currentDensityPct = densityPct;
    this.memoryDb.crowdMetrics[index].riskLevel = riskLevel;
    this.memoryDb.crowdMetrics[index].timestamp = new Date().toISOString();
    if (forecast) this.memoryDb.crowdMetrics[index].aiCongestionForecast = forecast;
    this.notifyListeners('crowdMetrics');
    return { ...this.memoryDb.crowdMetrics[index] };
  }

  // --- Volunteers & Tasks ---
  public async getVolunteers(stadiumId = 'metlife-ny-nj'): Promise<Volunteer[]> {
    return this.memoryDb.volunteers.filter((v) => v.stadiumId === stadiumId).map((v) => ({ ...v }));
  }

  public async getTasks(stadiumId = 'metlife-ny-nj', volunteerId?: string): Promise<Task[]> {
    return this.memoryDb.tasks
      .filter((t) => t.stadiumId === stadiumId && (!volunteerId || t.assignedToVolunteerId === volunteerId))
      .map((t) => ({ ...t }));
  }

  public async createTask(taskData: Omit<Task, 'taskId' | 'createdAt' | 'status'>): Promise<Task> {
    this.seq += 1;
    const newTask: Task = {
      ...taskData,
      taskId: `task-${Date.now()}-${this.seq}`,
      status: 'ASSIGNED',
      createdAt: new Date().toISOString(),
    };
    this.memoryDb.tasks.unshift(newTask);
    this.notifyListeners('tasks');
    return { ...newTask };
  }

  public async updateTaskStatus(
    taskId: string,
    status: Task['status'],
    checklist?: Task['checklist']
  ): Promise<Task | null> {
    const index = this.memoryDb.tasks.findIndex((t) => t.taskId === taskId);
    if (index === -1) return null;
    this.memoryDb.tasks[index].status = status;
    if (checklist) this.memoryDb.tasks[index].checklist = checklist;
    this.notifyListeners('tasks');
    return { ...this.memoryDb.tasks[index] };
  }

  // --- Announcements & Notifications ---
  public async getAnnouncements(stadiumId = 'metlife-ny-nj'): Promise<Announcement[]> {
    return this.memoryDb.announcements.filter((a) => a.stadiumId === stadiumId).map((a) => ({ ...a }));
  }

  public async createAnnouncement(
    announcementData: Omit<Announcement, 'announcementId' | 'broadcastedAt' | 'status'>
  ): Promise<Announcement> {
    this.seq += 1;
    const newAnnouncement: Announcement = {
      ...announcementData,
      announcementId: `anc-${Date.now()}-${this.seq}`,
      status: 'BROADCASTED',
      broadcastedAt: new Date().toISOString(),
    };
    this.memoryDb.announcements.unshift(newAnnouncement);
    this.notifyListeners('announcements');
    return { ...newAnnouncement };
  }

  public async getNotifications(uid: string): Promise<Notification[]> {
    return this.memoryDb.notifications.filter((n) => n.recipientUid === uid).map((n) => ({ ...n }));
  }

  // --- AI Sessions & Analytics ---
  public async getAISessions(uid?: string): Promise<AISession[]> {
    return this.memoryDb.aiSessions.filter((s) => !uid || s.uid === uid).map((s) => ({ ...s }));
  }

  public async saveAISessionTurn(
    sessionId: string,
    uid: string,
    copilotType: AISession['copilotType'],
    modelUsed: string,
    userMsg: string,
    modelMsg: string
  ): Promise<AISession> {
    let session = this.memoryDb.aiSessions.find((s) => s.sessionId === sessionId);
    const now = new Date().toISOString();
    if (!session) {
      session = {
        sessionId: sessionId || `sess-${Date.now()}`,
        uid,
        copilotType,
        modelUsed,
        turnCount: 0,
        history: [],
        createdAt: now,
      };
      this.memoryDb.aiSessions.unshift(session);
    }
    session.history.push({ role: 'user', content: userMsg, timestamp: now });
    session.history.push({ role: 'model', content: modelMsg, timestamp: new Date(Date.now() + 1000).toISOString() });
    session.turnCount = Math.floor(session.history.length / 2);
    this.notifyListeners('aiSessions');
    return { ...session };
  }

  public async getAnalytics(stadiumId = 'metlife-ny-nj'): Promise<Analytics | null> {
    const a = this.memoryDb.analytics.find((a) => a.stadiumId === stadiumId);
    return a ? { ...a } : null;
  }

  public async getAuditLogs(stadiumId = 'metlife-ny-nj'): Promise<AuditLog[]> {
    return this.memoryDb.auditLogs.filter((l) => l.stadiumId === stadiumId).map((l) => ({ ...l }));
  }

  public async logAudit(
    actorUid: string,
    actionType: string,
    targetResource: string,
    details: string,
    ipAddress = '127.0.0.1'
  ): Promise<AuditLog> {
    this.seq += 1;
    const newLog: AuditLog = {
      auditId: `audit-${Date.now()}-${this.seq}`,
      stadiumId: 'metlife-ny-nj',
      actorUid,
      actionType,
      targetResource,
      details,
      ipAddress,
      timestamp: new Date().toISOString(),
    };
    this.memoryDb.auditLogs.unshift(newLog);
    this.notifyListeners('auditLogs');
    return { ...newLog };
  }

  /** Returns a snapshot of every collection (used by the /api/state endpoint). */
  public async snapshot(): Promise<SeedDatabase> {
    return JSON.parse(JSON.stringify(this.memoryDb));
  }

  // --- Reset for Demo Storyline ---
  public resetToSeedState(): void {
    this.memoryDb = JSON.parse(JSON.stringify(SEED_DATA));
    (Object.keys(this.memoryDb) as CollectionName[]).forEach((collectionName) => {
      this.notifyListeners(collectionName);
    });
  }
}

// Hang the singleton off globalThis so HMR / warm restarts don't wipe state.
interface GlobalWithRepo {
  __stadiumRepository?: StadiumRepository;
}
const globalWithRepo = globalThis as unknown as GlobalWithRepo;

export const repository: StadiumRepository =
  globalWithRepo.__stadiumRepository ?? new StadiumRepository();

if (process.env.NODE_ENV !== 'production') {
  globalWithRepo.__stadiumRepository = repository;
}
