# 05 - Database Design
**Project Title**: FIFA Smart Stadium Copilot – AI-Powered Stadium Operations Platform  
**Document Version**: 2.0 (Production-Grade Specification)  

---

## 1. Overview & NoSQL Strategy
The **FIFA Smart Stadium Copilot** utilizes **Google Cloud Firestore** as its primary real-time operational database. Firestore was selected over traditional SQL relational databases because stadium operations during the FIFA World Cup 2026 require high-frequency real-time telemetry (e.g., turnstile velocity, crowd heatmaps) and instantaneous WebSocket synchronization across thousands of command center and mobile dashboards.

To support all six role dashboards and our four Vertex AI Gemini Copilots, the database is architected across **19 core collections**.

---

## 2. Collection Schemas & Field Definitions

### 1. `users`
Stores user profile information, authentication metadata, and role assignments.
```json
{
  "uid": "usr_99283a",
  "email": "carlos.fan@example.com",
  "displayName": "Carlos Rodriguez",
  "role": "FAN", // 'FAN' | 'VOLUNTEER' | 'OPERATIONS' | 'SECURITY' | 'MEDICAL' | 'ADMIN'
  "stadiumId": "metlife-ny-nj",
  "preferredLanguage": "es", // 'en' | 'es' | 'fr' | 'pt' | 'ar' | 'ja' | 'hi' | 'de'
  "accessibilityNeeds": ["STEP_FREE_PATHWAY", "SCREEN_READER"],
  "createdAt": "2026-07-06T10:00:00Z",
  "updatedAt": "2026-07-06T10:00:00Z"
}
```

### 2. `roles`
Defines granular Role-Based Access Control (RBAC) permissions and tool authorizations.
```json
{
  "roleId": "VOLUNTEER",
  "displayName": "Stadium Volunteer",
  "permissions": ["READ_MAP", "CREATE_INCIDENT", "READ_TASKS", "UPDATE_TASK", "USE_VOLUNTEER_COPILOT"],
  "allowedDashboards": ["/volunteer"],
  "description": "Ground staff responsible for fan guidance and incident reporting."
}
```

### 3. `stadiums`
Stores top-level venue metadata, geolocation coordinates, and capacity boundaries.
```json
{
  "stadiumId": "metlife-ny-nj",
  "name": "MetLife Stadium (New York / New Jersey)",
  "city": "East Rutherford, NJ",
  "capacity": 82500,
  "centerCoordinates": { "lat": 40.8135, "lng": -74.0745 },
  "activeTournament": "FIFA World Cup 2026",
  "emergencyLockdownActive": false,
  "concourseLevels": ["Lower Bowl", "Mezzanine", "Upper Bowl"]
}
```

### 4. `gates`
Tracks real-time turnstile telemetry, wait times, and congestion status.
```json
{
  "gateId": "gate-c",
  "stadiumId": "metlife-ny-nj",
  "name": "Gate C (Commuter Rail Entrance)",
  "location": { "lat": 40.8140, "lng": -74.0750 },
  "status": "CONGESTED", // 'OPEN' | 'CONGESTED' | 'CLOSED' | 'EMERGENCY_EXIT_ONLY'
  "currentWaitMinutes": 42,
  "turnstileVelocityPerMin": 310,
  "maxCapacityPerMin": 350,
  "assignedSectors": ["101", "102", "103", "104", "105"]
}
```

### 5. `seats`
Maps seating inventory to sectors, concourses, and nearest entrance gates.
```json
{
  "seatId": "sec-112-row-14-seat-5",
  "stadiumId": "metlife-ny-nj",
  "sector": "112",
  "row": "14",
  "seatNumber": "5",
  "concourseLevel": "Lower Bowl",
  "nearestGateId": "gate-d",
  "nearestRestroomId": "restroom-110",
  "nearestFoodVendorId": "food-taco-fiesta",
  "isAccessible": true
}
```

### 6. `routes`
Stores standard navigation polylines and distance metrics between stadium waypoints.
```json
{
  "routeId": "gate-c-to-sec-112",
  "stadiumId": "metlife-ny-nj",
  "originId": "gate-c",
  "destinationId": "sec-112",
  "distanceMeters": 450,
  "estimatedWalkMinutes": 6,
  "polyline": "40.8140,-74.0750|40.8138,-74.0748|40.8135,-74.0746",
  "isStepFree": false
}
```

### 7. `parking`
Tracks parking lot occupancy, EV charging availability, and shuttle connections.
```json
{
  "lotId": "lot-4-general",
  "stadiumId": "metlife-ny-nj",
  "name": "Lot 4 (General Fan Parking)",
  "totalSpaces": 5000,
  "occupiedSpaces": 4850,
  "status": "NEAR_CAPACITY", // 'OPEN' | 'NEAR_CAPACITY' | 'FULL' | 'CLOSED'
  "shuttleConnectionToGate": "gate-a",
  "evChargingAvailable": true
}
```

### 8. `foodVendors`
Stores concession stand menus, dietary tags, queue wait times, and location data.
```json
{
  "vendorId": "food-taco-fiesta",
  "stadiumId": "metlife-ny-nj",
  "name": "Taco Fiesta & Cantina",
  "sector": "110",
  "concourseLevel": "Lower Bowl",
  "cuisineType": "Mexican",
  "dietaryOptions": ["VEGETARIAN", "VEGAN", "GLUTEN_FREE", "HALAL"],
  "currentQueueMinutes": 12,
  "status": "OPEN"
}
```

### 9. `restrooms`
Tracks restroom locations, accessibility stalls, and real-time cleanliness/queue status.
```json
{
  "restroomId": "restroom-110",
  "stadiumId": "metlife-ny-nj",
  "sector": "110",
  "concourseLevel": "Lower Bowl",
  "type": "ALL_GENDER", // 'MALE' | 'FEMALE' | 'ALL_GENDER' | 'FAMILY_ACCESSIBLE'
  "accessibleStalls": 4,
  "currentQueueMinutes": 5,
  "needsJanitorialService": false
}
```

### 10. `accessibilityRoutes`
Dedicated WCAG-compliant step-free pathways avoiding stairs and high-gradient ramps.
```json
{
  "routeId": "access-gate-a-to-sec-112",
  "stadiumId": "metlife-ny-nj",
  "originId": "gate-a",
  "destinationId": "sec-112",
  "distanceMeters": 520,
  "estimatedWalkMinutes": 8,
  "polyline": "40.8142,-74.0752|40.8139,-74.0749|40.8135,-74.0746",
  "features": ["ELEVATOR_WEST_2", "WIDE_CORRIDOR", "RAMP_MAX_5_DEG"]
}
```

### 11. `incidents`
Real-time operational, security, and medical incident logs reported by staff or AI.
```json
{
  "incidentId": "inc-20260706-001",
  "stadiumId": "metlife-ny-nj",
  "reportedByUid": "usr_vol_881",
  "incidentType": "MEDICAL", // 'MEDICAL' | 'SECURITY' | 'MAINTENANCE' | 'CROWD_CONGESTION'
  "location": { "sector": "112", "concourseLevel": "Lower Bowl", "lat": 40.8135, "lng": -74.0745 },
  "severity": 8, // Scale 1 (Minor) to 10 (Critical Life-Threatening)
  "status": "ACTIVE_TRIAGE", // 'REPORTED' | 'CLASSIFIED' | 'ACTIVE_TRIAGE' | 'RESOLVED'
  "description": "Spectator experiencing severe heat exhaustion and dizziness in Sector 112 row 14.",
  "photoUrl": "https://storage.googleapis.com/fifa-stadium-media/incidents/inc-001.jpg",
  "assignedTeamId": "med-team-beta",
  "aiSummary": "Priority 2 Medical: Heat exhaustion in Sec 112. Triage Team Beta dispatched via Route D.",
  "createdAt": "2026-07-06T12:15:00Z",
  "resolvedAt": null
}
```

### 12. `crowdMetrics`
Aggregated crowd density telemetry used for AI risk prediction and heatmaps.
```json
{
  "metricId": "metric-gate-c-1215",
  "stadiumId": "metlife-ny-nj",
  "zoneId": "gate-c-concourse",
  "timestamp": "2026-07-06T12:15:00Z",
  "currentDensityPct": 88, // 0-100% capacity
  "riskLevel": "RED", // 'GREEN' | 'YELLOW' | 'RED' | 'CRITICAL'
  "predictedWaitMinutes": 42,
  "aiCongestionForecast": "Gridlock expected within 15 minutes due to rail arrival surge. Recommend opening Gate D auxiliary turnstiles."
}
```

### 13. `volunteers`
Tracks volunteer shift status, GPS coordinates, and skill certifications.
```json
{
  "volunteerId": "vol-881",
  "uid": "usr_vol_881",
  "stadiumId": "metlife-ny-nj",
  "name": "Elena Rostova",
  "assignedZone": "Concourse B (Sectors 108-115)",
  "currentLocation": { "lat": 40.8136, "lng": -74.0746 },
  "status": "ON_TASK", // 'AVAILABLE' | 'ON_TASK' | 'ON_BREAK' | 'OFF_SHIFT'
  "certifications": ["FIRST_AID", "MULTILINGUAL_ES_FR", "CROWD_CONTROL"],
  "activeTaskId": "task-902"
}
```

### 14. `tasks`
Dynamic shift assignments and checklists dispatched by command center or AI.
```json
{
  "taskId": "task-902",
  "stadiumId": "metlife-ny-nj",
  "assignedToVolunteerId": "vol-881",
  "title": "Assist Crowd Rerouting at Gate C",
  "description": "Direct spectators with lower bowl tickets from Gate C to Gate D auxiliary entrance.",
  "priority": "HIGH", // 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  "status": "IN_PROGRESS", // 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED'
  "checklist": [
    { "item": "Pick up digital signage wand from Concourse B locker", "completed": true },
    { "item": "Position at Gate C concourse fork", "completed": true },
    { "item": "Redirect sector 101-115 ticket holders to Gate D", "completed": false }
  ],
  "createdAt": "2026-07-06T12:16:00Z"
}
```

### 15. `announcements`
Multilingual public address broadcasts and push notifications generated by AI.
```json
{
  "announcementId": "anc-20260706-004",
  "stadiumId": "metlife-ny-nj",
  "targetAudience": ["FAN_SECTORS_101_115"],
  "priority": "HIGH",
  "status": "BROADCASTED",
  "translations": {
    "en": "To avoid delays at Gate C, please proceed to Gate D (3-minute walk right).",
    "es": "Para evitar retrasos en la Puerta C, diríjase a la Puerta D (3 minutos a la derecha).",
    "fr": "Pour éviter les retards à la porte C, veuillez vous rendre à la porte D.",
    "pt": "Para evitar atrasos no Portão C, dirija-se ao Portão D.",
    "ar": "لتجنب التأخير في البوابة C، يرجى التوجه إلى البوابة D.",
    "ja": "ゲートCでの混雑を避けるため、右隣のゲートDへお進みください。",
    "hi": "गेट C पर देरी से बचने के लिए, कृपया गेट D पर जाएं।",
    "de": "Um Verzögerungen an Tor C zu vermeiden, gehen Sie bitte zu Tor D."
  },
  "broadcastedAt": "2026-07-06T12:17:00Z"
}
```

### 16. `notifications`
Individual user push alerts and copilot proactive nudges.
```json
{
  "notificationId": "notif-7721",
  "recipientUid": "usr_99283a",
  "title": "Faster Entrance Available",
  "message": "Gate C is experiencing heavy congestion (42 min wait). Gate D has only a 5-minute wait!",
  "actionUrl": "/fan?route=gate-d",
  "read": false,
  "createdAt": "2026-07-06T12:17:05Z"
}
```

### 17. `aiSessions`
Conversation logs and reasoning audits for Vertex AI Gemini Copilots.
```json
{
  "sessionId": "sess-ai-3392",
  "uid": "usr_99283a",
  "copilotType": "FAN", // 'FAN' | 'VOLUNTEER' | 'OPERATIONS' | 'EMERGENCY'
  "modelUsed": "gemini-2.5-flash",
  "turnCount": 4,
  "history": [
    { "role": "user", "content": "Where can I get vegetarian tacos near sector 112?", "timestamp": "2026-07-06T12:10:00Z" },
    { "role": "model", "content": "Taco Fiesta & Cantina is located right in Sector 110 (Lower Bowl), just a 2-minute walk from your seat. They offer vegetarian and vegan tacos with a current queue wait time of only 12 minutes!", "timestamp": "2026-07-06T12:10:01Z" }
  ],
  "createdAt": "2026-07-06T12:10:00Z"
}
```

### 18. `analytics`
Aggregated system performance metrics and KPIs for Admin dashboards.
```json
{
  "analyticsId": "stat-20260706-match1",
  "stadiumId": "metlife-ny-nj",
  "totalSpectatorsIngress": 70000,
  "avgNavigationTimeMinutes": 16.8,
  "avgCongestionResponseMinutes": 8.5,
  "totalAiQueriesProcessed": 45200,
  "multilingualBroadcastsGenerated": 14,
  "avgAiResponseLatencyMs": 1150,
  "recordedAt": "2026-07-06T13:00:00Z"
}
```

### 19. `auditLogs`
Immutable security and administrative override records.
```json
{
  "auditId": "audit-5592",
  "stadiumId": "metlife-ny-nj",
  "actorUid": "usr_ops_lead_1",
  "actionType": "WHAT_IF_SIMULATION_APPLIED",
  "targetResource": "Gate C / Gate D Turnstile Re-routing",
  "details": "Operator applied AI recommendation to redirect Sectors 101-115 from Gate C to Gate D.",
  "ipAddress": "192.0.2.45",
  "timestamp": "2026-07-06T12:18:00Z"
}
```

---

## 3. Indexing Strategy (`firestore.indexes.json`)
To ensure sub-10ms query performance across our dashboards without full-collection scans, we implement composite indexes:
1. **`incidents`**: Indexed on `stadiumId` (ASC), `status` (ASC), and `severity` (DESC) — enables instant high-priority emergency filtering on Medical/Security dashboards.
2. **`crowdMetrics`**: Indexed on `stadiumId` (ASC), `riskLevel` (ASC), and `timestamp` (DESC) — powers the live stadium heatmap and congestion alerts.
3. **`tasks`**: Indexed on `assignedToVolunteerId` (ASC), `status` (ASC), and `priority` (DESC) — sorts volunteer checklists by urgency.
4. **`announcements`**: Indexed on `stadiumId` (ASC) and `broadcastedAt` (DESC) — fetches latest multilingual public address feeds.

---

## 4. Firestore Security Rules Design (`firestore.rules`)
Security rules enforce strict Role-Based Access Control (RBAC) via Firebase Authentication custom JWT claims:
- **Public / Fans (`role == 'FAN'`)**: Can read `stadiums`, `gates`, `foodVendors`, `restrooms`, `routes`, `announcements`, and create/read their own `aiSessions` and `notifications`. Cannot read or write operational `incidents` or `volunteers`.
- **Volunteers (`role == 'VOLUNTEER'`)**: Can read/write assigned `tasks`, update their own `volunteers` location, and create new `incidents`.
- **Operations Staff (`role == 'OPERATIONS'`)**: Read/write access across all stadium telemetry, `gates`, `crowdMetrics`, `incidents`, and `tasks`. Can execute What-If simulations.
- **Security & Medical (`role == 'SECURITY' || role == 'MEDICAL'`)**: Read/write access to `incidents`, `accessibilityRoutes`, and emergency broadcast triggers.
- **System Admins (`role == 'ADMIN'`)**: Full read/write access across all 19 collections, including immutable read-only access to `auditLogs`.
