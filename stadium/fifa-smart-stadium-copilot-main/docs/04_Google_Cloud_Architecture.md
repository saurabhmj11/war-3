# 04 - Google Cloud Architecture
**Project Title**: FIFA Smart Stadium Copilot – AI-Powered Stadium Operations Platform  
**Document Version**: 2.0 (Production-Grade Specification)  

---

## 1. Overview & Cloud-Native Principles
The **FIFA Smart Stadium Copilot** is built natively on **Google Cloud Platform (GCP)** to achieve serverless horizontal scalability, sub-second event processing, military-grade security, and seamless integration with **Vertex AI Gemini**.

Our cloud architecture is designed around four enterprise pillars:
1. **Serverless & Event-Driven**: Zero infrastructure provisioning or VM maintenance. Compute services scale automatically from zero during non-match days to thousands of containers during World Cup matches.
2. **AI-First & Multimodal**: Direct high-speed fiber interconnects between Cloud Run microservices and Vertex AI Gemini endpoints ensure sub-1,500ms time-to-first-token (TTFT) for live chat and multimodal vision classification.
3. **Defense-in-Depth Security**: Every edge request is screened by Google Cloud Armor WAF and Identity-Aware Proxy (IAP), while data at rest and in transit is safeguarded by AES-256 and TLS 1.3 encryption.
4. **Cost-Optimized & Observable**: Strict model tiering, Cloud Memorystore caching, and scale-to-zero policies keep monthly operational costs low ($\approx \$100-\$150/\text{stadium}$), while Cloud Logging and Cloud Trace provide full end-to-end telemetry.

---

## 2. Google Cloud Service Mapping & Justification

| GCP Service | Architectural Role | Why It Was Chosen / Enterprise Justification |
| :--- | :--- | :--- |
| **Vertex AI (Gemini 2.5 Pro & Flash)** | Core AI Reasoning & Multimodal Engine | Enterprise data privacy (zero training on FIFA operational data), native multimodal understanding (photo/audio analysis), and massive context windows for complex What-If simulations. |
| **Google Cloud Run** | Full-Stack Hosting & API Microservices | Fully managed serverless container runtime supporting HTTP/2, WebSockets, and gRPC. Scales instantly from 0 to 1,000+ instances during fan ingress surges. |
| **Google Cloud Firestore** | Real-Time Operational Database | NoSQL document database storing 18 live stadium collections. Provides sub-10ms queries, real-time WebSocket client sync, and native Firebase Auth integration. |
| **Firebase Authentication** | Identity & Role-Based Access Control | Secure identity management with custom JWT role claims (`FAN`, `VOLUNTEER`, `OPERATIONS`, `SECURITY`, `MEDICAL`, `ADMIN`) and MFA support. |
| **Cloud Memorystore (Redis)** | High-Speed Cache & Session Store | Sub-millisecond in-memory caching for static stadium maps, food menus, wait times, and frequent AI queries. Reduces Firestore reads by **≥ 40%**. |
| **Google Cloud Pub/Sub & Eventarc** | Asynchronous Event Bus & Routing | Decouples high-volume fan telemetry and volunteer incident reporting from LLM inference pipelines, guaranteeing at-least-once event delivery without API timeouts. |
| **Cloud Scheduler** | Automated Polling & Cron Triggers | Triggers periodic crowd congestion evaluations, queue depth regression modeling, and shift analytics sync every 60 seconds. |
| **Google Cloud BigQuery** | Data Warehouse & Historical Analytics | Petabyte-scale SQL analytics engine aggregating crowd ingress trends, volunteer response times, and AI usage metrics for FIFA executive reporting. |
| **Cloud Storage** | Media & Asset Blob Store | Secure bucket storage for stadium vector maps, architectural schematics, and multimodal photo uploads from volunteer incident reports. |
| **Secret Manager** | Credential & API Key Vault | Centralized, encrypted storage for third-party API keys, webhook secrets, and Firebase service accounts with IAM least-privilege access. |
| **Cloud Armor & IAP** | WAF, DDoS Protection & Admin Guard | Enterprise web application firewall shielding against OWASP Top 10 attacks and DDoS surges. IAP protects administrative and command center portals. |
| **Cloud Logging, Monitoring & Trace** | End-to-End Observability Suite | Distributed tracing across Next.js API routes, Pub/Sub workers, and Gemini LLM calls. Provides real-time alerting on API latency and error spikes. |
| **Google Maps Platform** | Stadium Mapping & Heatmap Engine | Vector map tiles, Directions API, and Heatmap Layer visualizing real-time crowd congestion across stadium gates and concourses. |
| **Translation API & Speech APIs** | Localization & Multimodal Audio | Real-time translation across 8 core World Cup languages and Speech-to-Text / Text-to-Speech for voice-activated Fan and Volunteer Copilots. |

---

## 3. Cost Awareness & Financial Optimization

### Monthly Production Cost Estimation (Per Stadium)
By utilizing serverless scale-to-zero capabilities and intelligent caching, the platform achieves exceptional cost efficiency:

| Cost Category | Monthly Volume / Usage | Estimated Cost (USD / Month) |
| :--- | :--- | :--- |
| **Google Cloud Run** | ~50,000 req/hr during 8 match days; scaled to zero on non-match days. | **$15.00** |
| **Google Cloud Firestore** | ~15,000,000 document reads, ~3,000,000 writes per month. | **$28.50** |
| **Vertex AI Gemini** | ~600,000 multimodal inference calls/month (80% Flash, 20% Pro). | **$65.00** |
| **Cloud Memorystore (Redis)**| Basic Tier 1GB instance for caching and session state. | **$35.00** |
| **BigQuery & Pub/Sub** | ~50GB analytical storage and 10,000,000 event messages. | **$8.50** |
| **Cloud Storage & Network** | ~100GB media storage and outbound egress bandwidth. | **$12.00** |
| **Total Estimated Monthly Cost** | **Fully Operational World Cup 2026 Venue Command Center** | **$\approx \$164.00 / \text{month}$** |

### Cost Optimization Strategies
1. **Intelligent Model Tiering**: Routine fan FAQ queries, wait-time lookups, and volunteer checklists are routed exclusively to **Gemini 2.5 Flash** (1/10th the cost of Pro). **Gemini 2.5 Pro** is reserved strictly for complex Operations What-If simulations and executive multi-incident summaries.
2. **Redis Caching Layer**: All static stadium boundaries, gate coordinates, vendor menus, and localized FAQ translations are cached in Cloud Memorystore Redis for 60 to 300 seconds. This cuts Firestore read operations and LLM token generation costs by over **40%**.
3. **Aggressive Scale-to-Zero**: Cloud Run services and Cloud Functions are configured with minimum instances set to `0` during non-tournament hours, eliminating idle compute costs.

---

## 4. Security & IAM Least-Privilege Architecture
We implement strict IAM separation of duties to protect tournament infrastructure:
- **Cloud Run Service Account**: Granted only `roles/datastore.user` (Firestore), `roles/pubsub.publisher`, and `roles/aiplatform.user` (Vertex AI). It has zero administrative or bucket deletion permissions.
- **Worker Service Account**: Granted `roles/pubsub.subscriber`, `roles/storage.objectViewer` (to read incident photos), and `roles/bigquery.dataEditor` (to log analytical metrics).
- **Firebase Auth Custom Claims**: Users authenticated via Firebase receive encrypted JWT claims (`role: 'OPERATIONS'`, `stadiumId: 'metlife-ny-nj'`). Cloud Run middleware and Firestore Security Rules validate these claims on every read/write attempt.
