-- =========================================================================
-- AEGISFLOW: ENTERPRISE POSTGRESQL & SUPABASE SCHEMA
-- Autonomous FinOps/SecOps Incident Mitigation Orchestrator
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'FINOPS_OPERATOR', -- 'FINOPS_OPERATOR', 'SECOPS_ENGINEER', 'CFO', 'INCIDENT_COMMANDER'
  organization TEXT DEFAULT 'AegisFlow Enterprise',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. GUARDRAIL POLICIES TABLE
CREATE TABLE IF NOT EXISTS guardrail_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  hitl_risk_threshold NUMERIC NOT NULL DEFAULT 70,
  hitl_usd_threshold NUMERIC NOT NULL DEFAULT 25000,
  mandatory_hitl_domains JSONB NOT NULL DEFAULT '["FINANCIAL_LEDGER", "CLOUD_INFRASTRUCTURE", "IAM_CREDENTIALS"]'::jsonb,
  auto_execution_enabled BOOLEAN NOT NULL DEFAULT true,
  notification_channel TEXT NOT NULL DEFAULT 'SLACK_PAGERDUTY',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_policy UNIQUE (user_id)
);

-- 3. FRAGMENTED DATA RECORDS (Multi-silo telemetry)
CREATE TABLE IF NOT EXISTS fragmented_data_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  silo_source TEXT NOT NULL, -- 'SAP_ERP_LEDGER', 'AWS_COST_EXPLORER', 'STRIPE_BILLING', 'NETSUITE_VENDORS', 'AUTH0_SECURITY_LOGS'
  external_record_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  entity_name TEXT NOT NULL,
  amount_usd NUMERIC DEFAULT 0,
  status TEXT NOT NULL,
  raw_payload JSONB NOT NULL,
  is_anomaly BOOLEAN NOT NULL DEFAULT false,
  anomaly_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INCIDENTS TABLE
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  domain TEXT NOT NULL, -- 'FINANCIAL_LEDGER', 'CLOUD_INFRASTRUCTURE', 'PAYMENT_GATEWAY', 'VENDOR_SUPPLY', 'IDENTITY_ACCESS'
  severity TEXT NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  risk_score NUMERIC NOT NULL, -- 0 to 100
  estimated_financial_impact_usd NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'DETECTED', -- 'DETECTED', 'MITIGATING', 'RESOLVED', 'ESCALATED'
  root_cause_synthesis TEXT NOT NULL,
  correlated_record_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. MITIGATION WORKFLOWS (HITL Actions)
CREATE TABLE IF NOT EXISTS mitigation_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'ROLLBACK_TRANSACTION', 'RATE_LIMIT_CLUSTER', 'QUARANTINE_TOKEN', 'REVOKE_KEY', 'DESYNC_RESYNC'
  domain TEXT NOT NULL,
  target_system TEXT NOT NULL,
  execution_payload JSONB NOT NULL,
  rollback_plan JSONB NOT NULL,
  risk_score NUMERIC NOT NULL,
  financial_impact_usd NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL', -- 'PENDING_APPROVAL', 'AUTO_EXECUTED', 'EXECUTED', 'REJECTED'
  approved_by TEXT,
  audit_justification TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  executed_at TIMESTAMPTZ
);

-- 6. CHAT SESSIONS & MESSAGES (Agentic Operations Copilot)
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  sender TEXT NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  citations JSONB DEFAULT '[]'::jsonb,
  suggested_prompts JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. IMMUTABLE AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  actor_type TEXT NOT NULL, -- 'AUTONOMOUS_AGENT', 'SYSTEM_POLICY', 'HUMAN_OPERATOR'
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  risk_level TEXT NOT NULL DEFAULT 'INFO' -- 'INFO', 'WARNING', 'CRITICAL'
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_records_silo ON fragmented_data_records(silo_source);
CREATE INDEX IF NOT EXISTS idx_records_anomaly ON fragmented_data_records(is_anomaly);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_mitigations_status ON mitigation_workflows(status);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardrail_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE fragmented_data_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitigation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage own guardrails" ON guardrail_policies
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own records" ON fragmented_data_records
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own incidents" ON incidents
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own mitigation workflows" ON mitigation_workflows
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own chat sessions" ON chat_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own chat messages" ON chat_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = chat_messages.session_id 
      AND chat_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR ALL USING (auth.uid() = user_id);
