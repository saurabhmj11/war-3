import { SEED_DATA, SeedDatabase } from './seed-data';
import {
  Stadium,
  Gate,
  Seat,
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

// Check if we are running in Demo Mode (default to true if no GCP project is configured)
const IS_DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== 'false' || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

class StadiumRepository {
  private memoryDb: SeedDatabase;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor() {
    // Deep clone seed data for in-memory mutation
    this.memoryDb = JSON.parse(JSON.stringify(SEED_DATA));
  }

  // --- Real-Time Listener Simulation ---
  public subscribe<T>(collectionName: keyof SeedDatabase, callback: (data: T[]) => void): () => void {
    if (!this.listeners.has(collectionName)) {
      this.listeners.set(collectionName, new Set());
    }
    this.listeners.get(collectionName)!.add(callback);
    
    // Immediately fire with current state
    callback(this.memoryDb[collectionName] as unknown as T[]);

    return () => {
      this.listeners.get(collectionName)?.delete(callback);
    };
  }

  private notifyListeners(collectionName: keyof SeedDatabase) {
    const callbacks = this.listeners.get(collectionName);
    if (callbacks) {
      const currentData = this.memoryDb[collectionName];
      callbacks.forEach((cb) => cb(currentData));
    }
  }

  // --- Users & Roles ---
  public async getUserProfile(uid: string): Promise<UserProfile | null> {
    const user = this.memoryDb.users.find((u) => u.uid === uid);
    return user || null;
  }

  public async getRolePermissions(role: UserRole): Promise<RolePermission | null> {
    const rolePerm = this.memoryDb.roles.find((r) => r.roleId === role);
    return rolePerm || null;
  }

  public async getAllUsers(): Promise<UserProfile[]> {
    return [...this.memoryDb.users];
  }

  // --- Stadium & Infrastructure ---
  public async getStadium(stadiumId: string = 'metlife-ny-nj'): Promise<Stadium | null> {
    const stadium = this.memoryDb.stadiums.find((s) => s.stadiumId === stadiumId);
    return stadium || null;
  }

  public async getGates(stadiumId: string = 'metlife-ny-nj'): Promise<Gate[]> {
    return this.memoryDb.gates.filter((g) => g.stadiumId === stadiumId);
  }

  public async updateGateStatus(gateId: string, status: Gate['status'], waitMinutes: number): Promise<Gate | null> {
    const gateIndex = this.memoryDb.gates.findIndex((g) => g.gateId === gateId);
    if (gateIndex === -1) return null;
    
    this.memoryDb.gates[gateIndex].status = status;
    this.memoryDb.gates[gateIndex].currentWaitMinutes = waitMinutes;
    this.notifyListeners('gates');
    return this.memoryDb.gates[gateIndex];
  }

  public async getFoodVendors(stadiumId: string = 'metlife-ny-nj'): Promise<FoodVendor[]> {
    return this.memoryDb.foodVendors.filter((v) => v.stadiumId === stadiumId);
  }

  public async getRestrooms(stadiumId: string = 'metlife-ny-nj'): Promise<Restroom[]> {
    return this.memoryDb.restrooms.filter((r) => r.stadiumId === stadiumId);
  }

  public async getParking(stadiumId: string = 'metlife-ny-nj'): Promise<Parking[]> {
    return this.memoryDb.parking.filter((p) => p.stadiumId === stadiumId);
  }

  public async getRoutes(stadiumId: string = 'metlife-ny-nj'): Promise<Route[]> {
    return this.memoryDb.routes.filter((r) => r.stadiumId === stadiumId);
  }

  public async getAccessibilityRoutes(stadiumId: string = 'metlife-ny-nj'): Promise<AccessibilityRoute[]> {
    return this.memoryDb.accessibilityRoutes.filter((r) => r.stadiumId === stadiumId);
  }

  // --- Incidents & Telemetry ---
  public async getIncidents(stadiumId: string = 'metlife-ny-nj'): Promise<Incident[]> {
    return this.memoryDb.incidents.filter((i) => i.stadiumId === stadiumId);
  }

  public async createIncident(incidentData: Omit<Incident, 'incidentId' | 'createdAt' | 'status' | 'severity'> & { severity?: number }): Promise<Incident> {
    const newIncident: Incident = {
      ...incidentData,
      incidentId: `inc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'REPORTED',
      severity: incidentData.severity || 5,
      createdAt: new Date().toISOString(),
    };
    this.memoryDb.incidents.unshift(newIncident);
    this.notifyListeners('incidents');
    return newIncident;
  }

  public async updateIncidentStatus(incidentId: string, status: Incident['status'], aiSummary?: string, assignedTeamId?: string): Promise<Incident | null> {
    const index = this.memoryDb.incidents.findIndex((i) => i.incidentId === incidentId);
    if (index === -1) return null;
    
    this.memoryDb.incidents[index].status = status;
    if (aiSummary) this.memoryDb.incidents[index].aiSummary = aiSummary;
    if (assignedTeamId) this.memoryDb.incidents[index].assignedTeamId = assignedTeamId;
    if (status === 'RESOLVED') this.memoryDb.incidents[index].resolvedAt = new Date().toISOString();
    
    this.notifyListeners('incidents');
    return this.memoryDb.incidents[index];
  }

  public async getCrowdMetrics(stadiumId: string = 'metlife-ny-nj'): Promise<CrowdMetric[]> {
    return this.memoryDb.crowdMetrics.filter((m) => m.stadiumId === stadiumId);
  }

  public async updateCrowdMetric(zoneId: string, densityPct: number, riskLevel: CrowdMetric['riskLevel'], forecast?: string): Promise<CrowdMetric | null> {
    const index = this.memoryDb.crowdMetrics.findIndex((m) => m.zoneId === zoneId || m.metricId.includes(zoneId));
    if (index === -1) return null;
    
    this.memoryDb.crowdMetrics[index].currentDensityPct = densityPct;
    this.memoryDb.crowdMetrics[index].riskLevel = riskLevel;
    this.memoryDb.crowdMetrics[index].timestamp = new Date().toISOString();
    if (forecast) this.memoryDb.crowdMetrics[index].aiCongestionForecast = forecast;
    
    this.notifyListeners('crowdMetrics');
    return this.memoryDb.crowdMetrics[index];
  }

  // --- Volunteers & Tasks ---
  public async getVolunteers(stadiumId: string = 'metlife-ny-nj'): Promise<Volunteer[]> {
    return this.memoryDb.volunteers.filter((v) => v.stadiumId === stadiumId);
  }

  public async getTasks(stadiumId: string = 'metlife-ny-nj', volunteerId?: string): Promise<Task[]> {
    return this.memoryDb.tasks.filter((t) => t.stadiumId === stadiumId && (!volunteerId || t.assignedToVolunteerId === volunteerId));
  }

  public async createTask(taskData: Omit<Task, 'taskId' | 'createdAt' | 'status'>): Promise<Task> {
    const newTask: Task = {
      ...taskData,
      taskId: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'ASSIGNED',
      createdAt: new Date().toISOString(),
    };
    this.memoryDb.tasks.unshift(newTask);
    this.notifyListeners('tasks');
    return newTask;
  }

  public async updateTaskStatus(taskId: string, status: Task['status'], checklist?: Task['checklist']): Promise<Task | null> {
    const index = this.memoryDb.tasks.findIndex((t) => t.taskId === taskId);
    if (index === -1) return null;
    
    this.memoryDb.tasks[index].status = status;
    if (checklist) this.memoryDb.tasks[index].checklist = checklist;
    
    this.notifyListeners('tasks');
    return this.memoryDb.tasks[index];
  }

  // --- Announcements & Notifications ---
  public async getAnnouncements(stadiumId: string = 'metlife-ny-nj'): Promise<Announcement[]> {
    return this.memoryDb.announcements.filter((a) => a.stadiumId === stadiumId);
  }

  public async createAnnouncement(announcementData: Omit<Announcement, 'announcementId' | 'broadcastedAt' | 'status'>): Promise<Announcement> {
    const newAnnouncement: Announcement = {
      ...announcementData,
      announcementId: `anc-${Date.now()}`,
      status: 'BROADCASTED',
      broadcastedAt: new Date().toISOString(),
    };
    this.memoryDb.announcements.unshift(newAnnouncement);
    this.notifyListeners('announcements');
    return newAnnouncement;
  }

  public async getNotifications(uid: string): Promise<Notification[]> {
    return this.memoryDb.notifications.filter((n) => n.recipientUid === uid);
  }

  // --- AI Sessions & Analytics ---
  public async getAISessions(uid?: string): Promise<AISession[]> {
    return this.memoryDb.aiSessions.filter((s) => !uid || s.uid === uid);
  }

  public async saveAISessionTurn(sessionId: string, uid: string, copilotType: AISession['copilotType'], modelUsed: string, userMsg: string, modelMsg: string): Promise<AISession> {
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
    return session;
  }

  public async getAnalytics(stadiumId: string = 'metlife-ny-nj'): Promise<Analytics | null> {
    return this.memoryDb.analytics.find((a) => a.stadiumId === stadiumId) || null;
  }

  public async getAuditLogs(stadiumId: string = 'metlife-ny-nj'): Promise<AuditLog[]> {
    return this.memoryDb.auditLogs.filter((l) => l.stadiumId === stadiumId);
  }

  public async logAudit(actorUid: string, actionType: string, targetResource: string, details: string): Promise<AuditLog> {
    const newLog: AuditLog = {
      auditId: `audit-${Date.now()}`,
      stadiumId: 'metlife-ny-nj',
      actorUid,
      actionType,
      targetResource,
      details,
      ipAddress: '127.0.0.1 (Demo Engine)',
      timestamp: new Date().toISOString(),
    };
    this.memoryDb.auditLogs.unshift(newLog);
    this.notifyListeners('auditLogs');
    return newLog;
  }

  // --- Reset for Demo Storyline ---
  public resetToSeedState(): void {
    this.memoryDb = JSON.parse(JSON.stringify(SEED_DATA));
    // Notify all listeners of reset
    this.listeners.forEach((_, collectionName) => {
      this.notifyListeners(collectionName as keyof SeedDatabase);
    });
  }
}

// Export singleton repository instance
export const repository = new StadiumRepository();
