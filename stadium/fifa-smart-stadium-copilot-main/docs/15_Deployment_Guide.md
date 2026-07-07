# 15 - Cloud Run & Firebase Deployment Guide
**Project Title**: FIFA Smart Stadium Copilot – AI-Powered Stadium Operations Platform  
**Document Version**: 2.0 (Production-Grade Specification)  

---

## 1. Overview & Serverless Strategy
Our platform deploys as a containerized serverless application on **Google Cloud Run**, paired with **Firebase Hosting** and **Google Cloud Firestore**. This architecture guarantees zero server maintenance, automatic scaling from 0 to 1,000 pods during match-day ingress surges, and minimal financial cost ($100–$150/stadium/month).

---

## 2. Step-by-Step Deployment Instructions

### Step 1: Google Cloud Project Setup
```bash
# Authenticate with Google Cloud CLI
gcloud auth login
gcloud config set project [YOUR_GCP_PROJECT_ID]

# Enable required GCP APIs
gcloud services enable \
  run.googleapis.com \
  aiplatform.googleapis.com \
  firestore.googleapis.com \
  pubsub.googleapis.com \
  eventarc.googleapis.com \
  redis.googleapis.com
```

### Step 2: Configure Environment Variables
Create a `.env.local` or `.env.production` file:
```env
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-gcp-project-id
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
GCP_VERTEX_AI_LOCATION=us-central1
GCP_REDIS_HOST=10.0.0.5
```

### Step 3: Build & Deploy to Google Cloud Run
```bash
# Build Docker container image and push to Artifact Registry
gcloud builds submit --tag gcr.io/[YOUR_GCP_PROJECT_ID]/fifa-copilot:v2.0

# Deploy container to Cloud Run with auto-scaling configured
gcloud run deploy fifa-smart-stadium-copilot \
  --image gcr.io/[YOUR_GCP_PROJECT_ID]/fifa-copilot:v2.0 \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 1000 \
  --memory 2Gi \
  --cpu 2 \
  --set-env-vars NEXT_PUBLIC_DEMO_MODE=false
```

### Step 4: Deploy Firestore Rules & Indexes
```bash
# Deploy security rules and composite indexes via Firebase CLI
firebase deploy --only firestore:rules,firestore:indexes
```

---

## 3. Demo Mode Fallback for Judge Evaluation
To ensure that Prompt Wars competition judges can evaluate the application instantly without setting up Google Cloud IAM credentials or billing accounts, set:
```env
NEXT_PUBLIC_DEMO_MODE=true
```
When enabled, `repository.ts` and `gemini-client.ts` automatically switch to our high-speed, in-memory simulation engines!
