# 11 - Security & Zero-Trust Architecture
**Project Title**: FIFA Smart Stadium Copilot – AI-Powered Stadium Operations Platform  
**Document Version**: 2.0 (Production-Grade Specification)  

---

## 1. Zero-Trust Security Framework
In a high-profile global sporting event like the FIFA World Cup 2026, security architecture cannot be an afterthought. We implement a **Zero-Trust Security Framework** across all layers:
1. **Identity & Access Management (IAM)**: Every user, volunteer, and command center operator must authenticate via **Firebase Authentication**. Role-Based Access Control (RBAC) is enforced at both the UI routing layer (`RoleGuard`) and the database persistence layer (`firestore.rules`).
2. **Network Security & DDoS Mitigation**: All public API endpoints are protected by **Google Cloud Armor**, enforcing strict rate-limiting (max 100 requests / min / IP for chat endpoints) and geo-fencing against DDoS attacks.
3. **Data Encryption**: All data is encrypted in transit via **TLS 1.3** and at rest in Google Cloud Firestore and Cloud Storage using Google-managed AES-256 encryption keys.

---

## 2. Role-Based Access Control (RBAC) Matrix
Our platform defines 6 distinct roles, enforced via Firebase Auth Custom Claims:

| Role | Allowed Dashboards & Actions | Read Scope | Write Scope |
| :--- | :--- | :--- | :--- |
| **`FAN`** | Fan Copilot Chat, Vector Map, Wait Times | Public Gates, Menus, Restrooms | User Chat Sessions |
| **`VOLUNTEER`** | Volunteer Checklist, Incident Reporter, Fan UI | Assigned Tasks, Public Data | Create Incidents, Update Task Checklists |
| **`OPERATIONS`** | Operations Command Center, What-If Sandbox, All UIs | All 18 Collections | Update Gates, Metrics, Incidents, Tasks |
| **`SECURITY`** | Security Alert Feed, **Deterministic Gate Overrides** | Security Incidents, Gates | Update Gate Lock Status, PA Broadcasts |
| **`MEDICAL`** | Medical Triage Queue, Step-Free Stretcher Routing | Medical Incidents, Routes | Update Triage Status, Assign Medical Teams |
| **`ADMIN`** | System Admin Portal, BigQuery Observability, All UIs | Full Root Access | Full Root Access, RBAC Management |

---

## 3. CRITICAL SAFETY: Deterministic Evacuation Overrides
A core engineering requirement of our platform is **Strict AI Guardrails & Deterministic Safety Overrides**:
> [!CAUTION]
> **LIFE-CRITICAL SAFETY PROTOCOL**: During stadium fire alarms, stampede hazards, or emergency evacuations, **generative AI models (LLMs) must NEVER be relied upon to execute gate unlock commands or evacuation alarms**.

Why? Because LLMs carry inherent latency and non-zero hallucination risks. In our platform, when Sarah Jenkins (Security Lead) clicks **"TRIGGER OVERRIDE"** on Gate C:
1. The UI invokes `/api/simulation/trigger` or directly calls `EmergencyCopilotService.triggerDeterministicEvacuationOverride(gateId)`.
2. This method **completely bypasses Vertex AI Gemini generation**, executing hardcoded, deterministic database transactions that lock gates open in `EMERGENCY_EXIT_ONLY` mode instantly (< 50 ms).
3. An immutable audit log is generated in Firestore for FIFA security compliance.
