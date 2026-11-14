# 🛡️ AegisFlow: Autonomous FinOps & SecOps Incident Mitigation Orchestrator

**AegisFlow** is an enterprise-grade Agentic AI Decision-Engine, Autonomous Incident Mitigation Orchestrator, AI Finance Assistant, and Contextual Operations Chatbot. Built to bridge fragmented enterprise database silos (`SAP_ERP_LEDGER`, `AWS_COST_EXPLORER`, `STRIPE_BILLING`, `NETSUITE_VENDORS`, `AUTH0_SECURITY_LOGS`), AegisFlow correlates cross-system anomalies in seconds, calculates exact financial exposure in USD, executes safe automated remediations immediately, and routes high-impact mutations through a deterministic Human-in-the-Loop (HITL) approval gate.

---

## 🌟 Key Architecture & Capabilities

### 1. Multi-Silo Enterprise Data Hub & Chaos Lab
- **Continuous Telemetry Monitoring:** Connects to fragmented ERP, Cloud Infrastructure, Payment Gateway, Procurement, and IAM data streams.
- **1-Click Live Chaos Injection:**
  - *Duplicate $85,000 Wire Batch & Unverified IBAN Swap* (SAP ERP + NetSuite + Auth0)
  - *Runaway GPU Cluster Loop & NAT Gateway Egress Surge* (AWS EC2 + VPC Route Tables)
  - *Stripe Webhook Desync & Double-Charge Cascade* (Stripe Billing + Accounts Receivable)
  - *Compromised Vendor API Token & Exfiltration Telemetry* (Auth0 + NetSuite)
  - *Custom Anomaly Telemetry Form* for custom operator simulations.

### 2. Autonomous Cross-DB Correlation & Risk Engine
- Powered by official `@google/genai` SDK (`gemini-2.5-flash`) with strict structured JSON output (`responseSchema`).
- Computes composite `risk_score` (0–100), severity tier, exact `estimated_financial_impact_usd`, and synthesizes comprehensive root causes.

### 3. Deterministic Human-in-the-Loop (HITL) Guardrails
- **Auto-Execution Tier:** Safely executes containment actions immediately if `risk_score < hitl_risk_threshold`, `financial_impact_usd < hitl_usd_threshold`, and domain is not restricted.
- **HITL Escalation Tier:** Automatically locks high-stakes actions in `PENDING_APPROVAL`, requiring explicit operator sign-off (`APPROVE` with optional payload parameter editing, or `REJECT`) along with mandatory audit justification notes.

### 4. AI Finance Assistant
- CFO-grade financial modeling workspace with interactive stress-testing multipliers (0.5x to 3.0x).
- Visualizes 6-period forecast time-series (`Current`, `T+1hr`, `T+6hr`, `T+24hr`, `T+7d`, `T+30d`) using Recharts Area charts comparing *Unmitigated Exposure* vs *Residual Risk* vs *Cumulative Prevented Loss*.
- Outputs prioritized CFO action directives with quantified recovery savings.

### 5. Persistent Agentic Operations Copilot
- Multi-session chat copilot grounded in real-time snapshots of live database incidents, pending workflows, and anomalous records.
- Returns Markdown responses with clickable entity citation pills (`[inc-cloud-001]`, `[rec-sap-01]`) and dynamic suggested follow-up chips.

### 6. Immutable Audit Trail
- Chronological telemetry log recording every mutation executed by `AUTONOMOUS_AGENT`, `SYSTEM_POLICY`, and `HUMAN_OPERATOR`.

---

## 🛠️ Technology Stack

- **Frontend:** React 18 (Vite, TypeScript), Tailwind CSS v3.4+, Lucide React, Recharts, `clsx`, `tailwind-merge`.
- **Backend:** Node.js 20+, Express.js, TypeScript (`tsx`), Helmet, CORS, Express-Rate-Limit, Zod.
- **AI SDK:** Official `@google/genai` (`import { GoogleGenAI, Type } from '@google/genai'`) targeting `gemini-2.5-flash`.
- **Database:** Supabase PostgreSQL 15+ with Row Level Security (RLS) policies, paired with an embedded high-performance local ACID persistence engine.

---

## 🚀 Quick Start Guide

### 1. Installation
Dependencies are already installed in this workspace. To reinstall if ever needed:
```bash
npm run install:all
```

### 2. Environment Configuration
Create or inspect `.env` in the root directory:
```env
PORT=5000
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
SUPABASE_URL=
SUPABASE_ANON_KEY=
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
```
*(Note: If `GEMINI_API_KEY` is not provided, AegisFlow runs in its deterministic autonomous decision core fallback mode so the app never crashes!)*

### 3. Launching AegisFlow Full-Stack
To run both backend server and frontend client concurrently:
```bash
npm run dev
```
Or start individually:
- **Server:** `npm run dev:server` (running on `http://localhost:5000`)
- **Client:** `npm run dev:client` (running on `http://localhost:5173`)

### 4. Exploring the Platform
1. Navigate to `http://localhost:5173/login`.
2. Click **"Launch Instant Demo Workspace"** for 1-click access as Lead Commander Alex Mercer.
3. Explore the **Executive Command Center**, inspect the **Decision Room** for active incidents, approve pending HITL workflows in the **Guardrails Queue**, stress-test exposure in the **AI Finance Assistant**, and test query citations in the **Operations Copilot**.
