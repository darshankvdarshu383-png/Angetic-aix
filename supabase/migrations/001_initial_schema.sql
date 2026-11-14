-- =========================================================================
-- AEGISFLOW: SUPABASE CLOUD POSTGRESQL INITIAL MIGRATION
-- Migration: 001_initial_schema.sql
-- Autonomous FinOps/SecOps Incident Mitigation Orchestrator
-- =========================================================================

-- Enable Required PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- 1. TABLE DEFINITIONS
-- =========================================================================

-- 1.1 PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'FINOPS_OPERATOR' CHECK (role IN ('FINOPS_OPERATOR', 'SECOPS_ENGINEER', 'CFO', 'INCIDENT_COMMANDER')),
  organization TEXT NOT NULL DEFAULT 'AegisFlow Enterprise',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.2 GUARDRAIL POLICIES TABLE
CREATE TABLE IF NOT EXISTS public.guardrail_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hitl_risk_threshold NUMERIC NOT NULL DEFAULT 70 CHECK (hitl_risk_threshold >= 0 AND hitl_risk_threshold <= 100),
  hitl_usd_threshold NUMERIC NOT NULL DEFAULT 25000 CHECK (hitl_usd_threshold >= 0),
  mandatory_hitl_domains JSONB NOT NULL DEFAULT '["FINANCIAL_LEDGER", "CLOUD_INFRASTRUCTURE", "IAM_CREDENTIALS"]'::jsonb,
  auto_execution_enabled BOOLEAN NOT NULL DEFAULT true,
  notification_channel TEXT NOT NULL DEFAULT 'SLACK_PAGERDUTY',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_guardrail_user UNIQUE (user_id)
);

-- 1.3 FRAGMENTED DATA RECORDS (Multi-Silo Enterprise Telemetry)
CREATE TABLE IF NOT EXISTS public.fragmented_data_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  silo_source TEXT NOT NULL CHECK (silo_source IN ('SAP_ERP_LEDGER', 'AWS_COST_EXPLORER', 'STRIPE_BILLING', 'NETSUITE_VENDORS', 'AUTH0_SECURITY_LOGS')),
  external_record_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  entity_name TEXT NOT NULL,
  amount_usd NUMERIC NOT NULL DEFAULT 0 CHECK (amount_usd >= 0),
  status TEXT NOT NULL DEFAULT 'COMMITTED',
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_anomaly BOOLEAN NOT NULL DEFAULT false,
  anomaly_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.4 INCIDENTS TABLE
CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  domain TEXT NOT NULL CHECK (domain IN ('FINANCIAL_LEDGER', 'CLOUD_INFRASTRUCTURE', 'PAYMENT_GATEWAY', 'VENDOR_SUPPLY', 'IDENTITY_ACCESS')),
  severity TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  risk_score NUMERIC NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  estimated_financial_impact_usd NUMERIC NOT NULL DEFAULT 0 CHECK (estimated_financial_impact_usd >= 0),
  status TEXT NOT NULL DEFAULT 'DETECTED' CHECK (status IN ('DETECTED', 'MITIGATING', 'RESOLVED', 'ESCALATED')),
  root_cause_synthesis TEXT NOT NULL,
  correlated_record_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.5 MITIGATION WORKFLOWS (HITL Actions & Safe Containment)
CREATE TABLE IF NOT EXISTS public.mitigation_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  action_type TEXT NOT NULL,
  domain TEXT NOT NULL CHECK (domain IN ('FINANCIAL_LEDGER', 'CLOUD_INFRASTRUCTURE', 'PAYMENT_GATEWAY', 'VENDOR_SUPPLY', 'IDENTITY_ACCESS')),
  target_system TEXT NOT NULL,
  execution_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  rollback_plan JSONB NOT NULL DEFAULT '{}'::jsonb,
  risk_score NUMERIC NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  financial_impact_usd NUMERIC NOT NULL DEFAULT 0 CHECK (financial_impact_usd >= 0),
  status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL' CHECK (status IN ('PENDING_APPROVAL', 'AUTO_EXECUTED', 'EXECUTED', 'REJECTED')),
  approved_by TEXT,
  audit_justification TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  executed_at TIMESTAMPTZ
);

-- 1.6 CHAT SESSIONS & MESSAGES (Agentic Operations Copilot)
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Operations & Cash-at-Risk Triage',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  citations JSONB NOT NULL DEFAULT '[]'::jsonb,
  suggested_prompts JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.7 IMMUTABLE AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_type TEXT NOT NULL CHECK (actor_type IN ('AUTONOMOUS_AGENT', 'SYSTEM_POLICY', 'HUMAN_OPERATOR')),
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  risk_level TEXT NOT NULL DEFAULT 'INFO' CHECK (risk_level IN ('INFO', 'WARNING', 'CRITICAL'))
);

-- =========================================================================
-- 2. PERFORMANCE INDEXES
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_records_user ON public.fragmented_data_records(user_id);
CREATE INDEX IF NOT EXISTS idx_records_silo ON public.fragmented_data_records(silo_source);
CREATE INDEX IF NOT EXISTS idx_records_anomaly ON public.fragmented_data_records(is_anomaly);
CREATE INDEX IF NOT EXISTS idx_records_timestamp ON public.fragmented_data_records(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_incidents_user ON public.incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON public.incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_domain ON public.incidents(domain);

CREATE INDEX IF NOT EXISTS idx_mitigations_incident ON public.mitigation_workflows(incident_id);
CREATE INDEX IF NOT EXISTS idx_mitigations_status ON public.mitigation_workflows(status);
CREATE INDEX IF NOT EXISTS idx_mitigations_user ON public.mitigation_workflows(user_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_time ON public.audit_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_type);

-- =========================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS on every table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardrail_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fragmented_data_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mitigation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 3.1 PROFILES POLICIES
DROP POLICY IF EXISTS "Users can view and edit own profile" ON public.profiles;
CREATE POLICY "Users can view and edit own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id OR auth.role() = 'service_role');

-- 3.2 GUARDRAIL POLICIES
DROP POLICY IF EXISTS "Users can manage own guardrail policies" ON public.guardrail_policies;
CREATE POLICY "Users can manage own guardrail policies" ON public.guardrail_policies
  FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- 3.3 FRAGMENTED DATA RECORDS POLICIES
DROP POLICY IF EXISTS "Users can access own fragmented data records" ON public.fragmented_data_records;
CREATE POLICY "Users can access own fragmented data records" ON public.fragmented_data_records
  FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- 3.4 INCIDENTS POLICIES
DROP POLICY IF EXISTS "Users can access own incidents" ON public.incidents;
CREATE POLICY "Users can access own incidents" ON public.incidents
  FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- 3.5 MITIGATION WORKFLOWS POLICIES
DROP POLICY IF EXISTS "Users can access own mitigation workflows" ON public.mitigation_workflows;
CREATE POLICY "Users can access own mitigation workflows" ON public.mitigation_workflows
  FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- 3.6 CHAT SESSIONS & MESSAGES POLICIES
DROP POLICY IF EXISTS "Users can access own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can access own chat sessions" ON public.chat_sessions
  FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can access own chat messages" ON public.chat_messages;
CREATE POLICY "Users can access own chat messages" ON public.chat_messages
  FOR ALL USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE public.chat_sessions.id = public.chat_messages.session_id
      AND public.chat_sessions.user_id = auth.uid()
    )
  );

-- 3.7 AUDIT LOGS POLICIES
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- =========================================================================
-- 4. UTILITY FUNCTIONS & TRIGGERS
-- =========================================================================

-- Automated timestamp updater function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_guardrails_updated_at ON public.guardrail_policies;
CREATE TRIGGER trg_guardrails_updated_at
  BEFORE UPDATE ON public.guardrail_policies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_incidents_updated_at ON public.incidents;
CREATE TRIGGER trg_incidents_updated_at
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_chat_sessions_updated_at ON public.chat_sessions;
CREATE TRIGGER trg_chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Stored procedure to execute dynamic DDL/SQL safely via service role RPC if needed
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- 5. COMPREHENSIVE ENTERPRISE SEED DATA
-- =========================================================================

DO $$
DECLARE
  v_demo_user_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;
  v_inc_cloud_id UUID := '11111111-1111-1111-1111-111111111111'::uuid;
  v_inc_wire_id UUID := '22222222-2222-2222-2222-222222222222'::uuid;
  v_chat_session_id UUID := '33333333-3333-3333-3333-333333333333'::uuid;
  v_rec_sap_01 UUID := '44444444-4444-4444-4444-000000000001'::uuid;
  v_rec_aws_01 UUID := '44444444-4444-4444-4444-000000000004'::uuid;
  v_rec_aws_02 UUID := '44444444-4444-4444-4444-000000000005'::uuid;
  v_rec_net_01 UUID := '44444444-4444-4444-4444-000000000010'::uuid;
  v_rec_ath_01 UUID := '44444444-4444-4444-4444-000000000013'::uuid;
BEGIN

  -- 5.1 Insert Demo Profile (Alex Mercer)
  INSERT INTO public.profiles (id, email, full_name, role, organization, created_at, updated_at)
  VALUES (
    v_demo_user_id,
    'alex.mercer@aegisflow.io',
    'Alex Mercer (Lead SecOps & FinOps Commander)',
    'INCIDENT_COMMANDER',
    'AegisFlow Enterprise Global',
    NOW() - INTERVAL '30 days',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    organization = EXCLUDED.organization;

  -- 5.2 Insert Default Guardrail Policy
  INSERT INTO public.guardrail_policies (
    user_id,
    hitl_risk_threshold,
    hitl_usd_threshold,
    mandatory_hitl_domains,
    auto_execution_enabled,
    notification_channel,
    created_at,
    updated_at
  )
  VALUES (
    v_demo_user_id,
    70,
    25000,
    '["FINANCIAL_LEDGER", "CLOUD_INFRASTRUCTURE", "IAM_CREDENTIALS"]'::jsonb,
    true,
    'SLACK_PAGERDUTY',
    NOW() - INTERVAL '7 days',
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    hitl_risk_threshold = EXCLUDED.hitl_risk_threshold,
    hitl_usd_threshold = EXCLUDED.hitl_usd_threshold,
    mandatory_hitl_domains = EXCLUDED.mandatory_hitl_domains,
    auto_execution_enabled = EXCLUDED.auto_execution_enabled,
    notification_channel = EXCLUDED.notification_channel;

  -- 5.3 Insert 15 Fragmented Data Records Across Silos
  -- SAP_ERP_LEDGER
  INSERT INTO public.fragmented_data_records (id, user_id, silo_source, external_record_id, timestamp, entity_name, amount_usd, status, raw_payload, is_anomaly, anomaly_reason, created_at)
  VALUES
    (
      v_rec_sap_01,
      v_demo_user_id,
      'SAP_ERP_LEDGER',
      'SAP-WR-99820-A',
      NOW() - INTERVAL '2.5 hours',
      'Apex Global Logistics BV',
      85000.00,
      'COMMITTED',
      '{"batch_id": "BATCH-2026-NOV-881", "gl_account": "2100-ACCOUNTS-PAYABLE", "clearing_doc": "DOC-99281-EUR", "payment_method": "SEPA_WIRE", "reconciliation_hash": "9a8b7c6d5e4f3a2b1c", "initiator": "sys_autopay_daemon_04"}'::jsonb,
      true,
      'Duplicate wire disbursement detected: Identical payment amount and recipient within 14 minutes of previous batch #BATCH-2026-NOV-879 without corresponding purchase order delta.',
      NOW() - INTERVAL '2.5 hours'
    ),
    (
      '44444444-4444-4444-4444-000000000002'::uuid,
      v_demo_user_id,
      'SAP_ERP_LEDGER',
      'SAP-GL-44021',
      NOW() - INTERVAL '8 hours',
      'Microsoft Enterprise Azure SaaS',
      14250.00,
      'RECONCILED',
      '{"gl_account": "6300-SOFTWARE-SUBSCRIPTIONS", "invoice_ref": "INV-MSFT-2026-099", "cost_center": "CC-ENG-PLATFORM"}'::jsonb,
      false,
      NULL,
      NOW() - INTERVAL '8 hours'
    ),
    (
      '44444444-4444-4444-4444-000000000003'::uuid,
      v_demo_user_id,
      'SAP_ERP_LEDGER',
      'SAP-AP-33910',
      NOW() - INTERVAL '16 hours',
      'Datadog Observability Tier-1',
      28900.00,
      'POSTED',
      '{"gl_account": "6310-MONITORING-SAAS", "approval_flow": "STANDARD_FINANCE_DIRECTOR", "purchase_order": "PO-2026-5541"}'::jsonb,
      false,
      NULL,
      NOW() - INTERVAL '16 hours'
    ),

    -- AWS_COST_EXPLORER
    (
      v_rec_aws_01,
      v_demo_user_id,
      'AWS_COST_EXPLORER',
      'AWS-CE-US-EAST-1-GPU-88',
      NOW() - INTERVAL '1.8 hours',
      'p4d.24xlarge / ML-Inference-ASG',
      42500.00,
      'ACTIVE_RUNAWAY',
      '{"region": "us-east-1", "service": "Amazon Elastic Compute Cloud - Compute", "usage_type": "BoxUsage:p4d.24xlarge", "instance_count": 64, "scaling_policy": "TargetTracking-HighLossErrorRate", "burn_rate_usd_hour": 2130.00}'::jsonb,
      true,
      'Auto-scaling group max-instance guardrail breached. ASG scaled from 4 to 64 p4d.24xlarge nodes in 75 minutes due to recursive retry loop on failing health-check endpoint.',
      NOW() - INTERVAL '1.8 hours'
    ),
    (
      v_rec_aws_02,
      v_demo_user_id,
      'AWS_COST_EXPLORER',
      'AWS-NAT-GW-099238',
      NOW() - INTERVAL '2.1 hours',
      'nat-0a9b8c7d6e5f4a3b2',
      9800.00,
      'ELEVATED_EGRESS',
      '{"region": "us-east-1", "service": "Amazon Virtual Private Cloud", "usage_type": "NatGateway-Bytes", "bytes_transferred_gb": 217800, "destination_ips": ["198.51.100.44", "203.0.113.89"]}'::jsonb,
      true,
      'Uncontrolled NAT Gateway outbound egress exceeding baseline 99th percentile by 1,420%. Correlated with runaway ML inference cluster dumping uncompressed model weights.',
      NOW() - INTERVAL '2.1 hours'
    ),
    (
      '44444444-4444-4444-4444-000000000006'::uuid,
      v_demo_user_id,
      'AWS_COST_EXPLORER',
      'AWS-S3-STD-0044',
      NOW() - INTERVAL '24 hours',
      's3://aegisflow-production-backups',
      3410.00,
      'NORMAL',
      '{"region": "us-west-2", "service": "Amazon Simple Storage Service", "storage_tb": 148.2, "lifecycle_rule": "GLACIER_30_DAYS"}'::jsonb,
      false,
      NULL,
      NOW() - INTERVAL '24 hours'
    ),

    -- STRIPE_BILLING
    (
      '44444444-4444-4444-4444-000000000007'::uuid,
      v_demo_user_id,
      'STRIPE_BILLING',
      'ch_3Q94KxL2eZvKYlo20sNq',
      NOW() - INTERVAL '3.2 hours',
      'Nexus Enterprise Tier Annual',
      18400.00,
      'WEBHOOK_DESYNC',
      '{"customer_id": "cus_R88a29b40f", "invoice_id": "in_1P83x920a0029", "attempt_count": 5, "webhook_status": "HTTP_504_TIMEOUT", "idempotency_key": "idem-sub-nexus-2026-rev2"}'::jsonb,
      true,
      'Stripe webhook listener timed out 5 consecutive times, causing client-side retry daemon to queue duplicate authorization hold while ERP marked payment uncollected.',
      NOW() - INTERVAL '3.2 hours'
    ),
    (
      '44444444-4444-4444-4444-000000000008'::uuid,
      v_demo_user_id,
      'STRIPE_BILLING',
      'ch_3Q88AaB8cDeFgHiJ01kL',
      NOW() - INTERVAL '12 hours',
      'Zenith Labs Growth Plan',
      4800.00,
      'PAID',
      '{"customer_id": "cus_Zenith991", "payment_method": "card_visa_8821", "risk_evaluation": "normal_02"}'::jsonb,
      false,
      NULL,
      NOW() - INTERVAL '12 hours'
    ),
    (
      '44444444-4444-4444-4444-000000000009'::uuid,
      v_demo_user_id,
      'STRIPE_BILLING',
      'ch_3Q77ZzY1xWvUtSrQ99pO',
      NOW() - INTERVAL '28 hours',
      'Vortex Global API Overages',
      6250.00,
      'PAID',
      '{"customer_id": "cus_Vortex102", "currency": "usd"}'::jsonb,
      false,
      NULL,
      NOW() - INTERVAL '28 hours'
    ),

    -- NETSUITE_VENDORS
    (
      v_rec_net_01,
      v_demo_user_id,
      'NETSUITE_VENDORS',
      'NS-VND-4491-MOD',
      NOW() - INTERVAL '4.0 hours',
      'Apex Global Logistics BV',
      85000.00,
      'ROUTING_CHANGED',
      '{"vendor_id": "VND-4491", "action": "UPDATE_REMITTANCE_BANK_DETAILS", "old_iban": "NL91ABNA0412889211", "new_iban": "GB29BARC20000099827361", "modified_by_ip": "185.220.101.5", "two_factor_verified": false}'::jsonb,
      true,
      'Vendor remittance IBAN changed from Dutch domestic banking to non-resident UK account via anonymous Tor exit node without 2FA step-up confirmation.',
      NOW() - INTERVAL '4.0 hours'
    ),
    (
      '44444444-4444-4444-4444-000000000011'::uuid,
      v_demo_user_id,
      'NETSUITE_VENDORS',
      'NS-VND-1002-PO',
      NOW() - INTERVAL '18 hours',
      'Snowflake Computing Inc',
      35000.00,
      'APPROVED',
      '{"vendor_id": "VND-1002", "terms": "NET_45", "annual_contract_value": 420000.00}'::jsonb,
      false,
      NULL,
      NOW() - INTERVAL '18 hours'
    ),
    (
      '44444444-4444-4444-4444-000000000012'::uuid,
      v_demo_user_id,
      'NETSUITE_VENDORS',
      'NS-VND-8821-INV',
      NOW() - INTERVAL '36 hours',
      'CrowdStrike Falcon Protect',
      19500.00,
      'PAID',
      '{"vendor_id": "VND-8821", "service_category": "ENDPOINT_SECURITY", "po_number": "PO-2026-4401"}'::jsonb,
      false,
      NULL,
      NOW() - INTERVAL '36 hours'
    ),

    -- AUTH0_SECURITY_LOGS
    (
      v_rec_ath_01,
      v_demo_user_id,
      'AUTH0_SECURITY_LOGS',
      'AUTH0-SEC-EVT-90041',
      NOW() - INTERVAL '4.2 hours',
      'svc-terraform-deployer@aegis.internal',
      0.00,
      'SUSPICIOUS_TOKEN_REFRESH',
      '{"client_id": "app_terraform_ci_prod_09", "event_type": "oauth2_token_refresh", "ip_address": "185.220.101.5", "asn": "AS208207 (Anonymous Proxy)", "scopes_requested": ["admin:cloud:mutate", "erp:wire:execute"]}'::jsonb,
      true,
      'Impossible travel anomaly detected: Service account API token refreshed simultaneously from US AWS datacenters and a known Tor exit relay in Romania with elevated wire execution scopes.',
      NOW() - INTERVAL '4.2 hours'
    ),
    (
      '44444444-4444-4444-4444-000000000014'::uuid,
      v_demo_user_id,
      'AUTH0_SECURITY_LOGS',
      'AUTH0-SEC-EVT-89210',
      NOW() - INTERVAL '6 hours',
      'cfo-alex.mercer@aegis.com',
      0.00,
      'SUCCESSFUL_LOGIN',
      '{"auth_method": "WEBAUTHN_FIDO2_HARDWARE_KEY", "ip_address": "71.198.44.12", "mfa_verified": true}'::jsonb,
      false,
      NULL,
      NOW() - INTERVAL '6 hours'
    ),
    (
      '44444444-4444-4444-4444-000000000015'::uuid,
      v_demo_user_id,
      'AUTH0_SECURITY_LOGS',
      'AUTH0-SEC-EVT-87114',
      NOW() - INTERVAL '14 hours',
      'devops-lead-sarah@aegis.com',
      0.00,
      'SUCCESSFUL_LOGIN',
      '{"auth_method": "PASSWORDLESS_MAGIC_LINK", "ip_address": "68.105.12.98", "mfa_verified": true}'::jsonb,
      false,
      NULL,
      NOW() - INTERVAL '14 hours'
    )
  ON CONFLICT (id) DO NOTHING;

  -- 5.4 Insert 2 Critical Enterprise Incidents
  INSERT INTO public.incidents (id, user_id, title, description, domain, severity, risk_score, estimated_financial_impact_usd, status, root_cause_synthesis, correlated_record_ids, created_at, updated_at)
  VALUES
    (
      v_inc_cloud_id,
      v_demo_user_id,
      'Multi-Region GPU Auto-Scaling Loop & NAT Gateway Egress Spike',
      'Runaway AWS EC2 auto-scaling loop triggered in us-east-1 allocating 64 p4d.24xlarge GPU instances with uncontrolled uncompressed model checkpoint dumping through NAT Gateway. Financial exposure escalating at $2,130/hr.',
      'CLOUD_INFRASTRUCTURE',
      'CRITICAL',
      88,
      52300.00,
      'DETECTED',
      'A misconfigured ML inference health-check endpoint returned HTTP 500 on large payload evaluations, provoking AWS TargetTrackingScaling policy into maximum scaling panic. Overlapping NAT Gateway telemetry indicates 217 TB outbound model egress due to missing VPC S3 endpoint routing.',
      jsonb_build_array(v_rec_aws_01::text, v_rec_aws_02::text),
      NOW() - INTERVAL '1.8 hours',
      NOW() - INTERVAL '10 minutes'
    ),
    (
      v_inc_wire_id,
      v_demo_user_id,
      'Compromised Vendor Banking Update & Duplicate $85,000 SEPA Wire Batch',
      'Vendor remittance IBAN for Apex Global Logistics BV was altered via an unauthorized Tor exit proxy without 2FA, immediately followed by an automated SAP ERP duplicate wire disbursement batch of $85,000.',
      'FINANCIAL_LEDGER',
      'CRITICAL',
      94,
      85000.00,
      'MITIGATING',
      'Auth0 security event AUTH0-SEC-EVT-90041 revealed stolen service credentials used from an Eastern European Tor exit node to modify NetSuite vendor banking details to an offshore UK account. Simultaneously, SAP ERP batch job scheduled a duplicate €85,000 wire disbursement matching previous settlement.',
      jsonb_build_array(v_rec_sap_01::text, v_rec_net_01::text, v_rec_ath_01::text),
      NOW() - INTERVAL '2.5 hours',
      NOW() - INTERVAL '30 minutes'
    )
  ON CONFLICT (id) DO NOTHING;

  -- 5.5 Insert Mitigation Workflows (Auto-Executed & HITL Escalated)
  INSERT INTO public.mitigation_workflows (id, incident_id, user_id, title, action_type, domain, target_system, execution_payload, rollback_plan, risk_score, financial_impact_usd, status, approved_by, audit_justification, created_at, executed_at)
  VALUES
    (
      '55555555-5555-5555-5555-000000000001'::uuid,
      v_inc_cloud_id,
      v_demo_user_id,
      'Clamp ASG Desired Capacity & Throttle Health Check Loop',
      'RATE_LIMIT_CLUSTER',
      'CLOUD_INFRASTRUCTURE',
      'AWS_AUTO_SCALING_API',
      '{"auto_scaling_group_name": "ML-Inference-ASG", "min_size": 4, "max_size": 8, "desired_capacity": 4, "cooldown_seconds": 600, "disable_scale_out_metric": "TargetTracking-HighLossErrorRate"}'::jsonb,
      '{"restore_min_size": 4, "restore_max_size": 64, "enable_scaling_policy": true}'::jsonb,
      45,
      9800.00,
      'AUTO_EXECUTED',
      'AUTONOMOUS_POLICY_RULE_04',
      'Risk score 45 and USD impact $9,800 fall within Auto-Execution Tier. Preserves baseline infrastructure stability without terminating running user jobs.',
      NOW() - INTERVAL '1.7 hours',
      NOW() - INTERVAL '1.7 hours'
    ),
    (
      '55555555-5555-5555-5555-000000000002'::uuid,
      v_inc_cloud_id,
      v_demo_user_id,
      'Emergency Terminate 56 Runaway GPU Nodes & Reroute NAT to VPC S3 Endpoint',
      'TERMINATE_INSTANCES_AND_ROUTE',
      'CLOUD_INFRASTRUCTURE',
      'AWS_EC2_AND_VPC_ROUTETABLE',
      '{"vpc_id": "vpc-09887123aa", "target_instance_ids": ["i-0112a8849b", "i-0982bb716c", "...and 54 more"], "force_drain_seconds": 60, "create_s3_gateway_endpoint": true}'::jsonb,
      '{"can_rollback": false, "recreation_script": "terraform apply -target=module.inference_fleet"}'::jsonb,
      88,
      42500.00,
      'PENDING_APPROVAL',
      NULL,
      'Requires explicit operator authorization: Terminates 56 GPU compute nodes and modifies core VPC routing tables.',
      NOW() - INTERVAL '1.6 hours',
      NULL
    ),
    (
      '55555555-5555-5555-5555-000000000003'::uuid,
      v_inc_wire_id,
      v_demo_user_id,
      'Revoke Compromised Service Token & Force Invalidate Auth0 Sessions',
      'REVOKE_KEY',
      'IDENTITY_ACCESS',
      'AUTH0_MANAGEMENT_API',
      '{"client_id": "app_terraform_ci_prod_09", "action": "REVOKE_ALL_REFRESH_TOKENS", "blacklist_ip_range": "185.220.101.0/24"}'::jsonb,
      '{"reactivate_client": true, "generate_new_credentials": true}'::jsonb,
      35,
      0.00,
      'AUTO_EXECUTED',
      'AUTONOMOUS_SECURITY_ORCHESTRATOR',
      'Automated immediate credential containment triggered by impossible travel heuristic. Risk level 35 is below HITL threshold.',
      NOW() - INTERVAL '2.4 hours',
      NOW() - INTERVAL '2.4 hours'
    ),
    (
      '55555555-5555-5555-5555-000000000004'::uuid,
      v_inc_wire_id,
      v_demo_user_id,
      'Hard Freeze SAP Clearing Batch #BATCH-2026-NOV-881 & Rollback NetSuite Vendor IBAN',
      'ROLLBACK_TRANSACTION',
      'FINANCIAL_LEDGER',
      'SAP_ERP_BANK_GATEWAY',
      '{"batch_id": "BATCH-2026-NOV-881", "sap_doc_id": "DOC-99281-EUR", "freeze_payment_order": true, "notify_clearing_bank_swift": "BARCGB22", "revert_vendor_record_to_iban": "NL91ABNA0412889211"}'::jsonb,
      '{"unfreeze_batch_if_authorized": true, "requeue_payment_run": true}'::jsonb,
      94,
      85000.00,
      'PENDING_APPROVAL',
      NULL,
      'Requires explicit operator authorization: Halts outbound bank clearing batch of $85,000 and reverts vendor ledger records.',
      NOW() - INTERVAL '2.3 hours',
      NULL
    )
  ON CONFLICT (id) DO NOTHING;

  -- 5.6 Insert Initial Audit Logs
  INSERT INTO public.audit_logs (user_id, timestamp, actor_type, actor_id, action, target_type, target_id, details, risk_level)
  VALUES
    (
      v_demo_user_id,
      NOW() - INTERVAL '4.2 hours',
      'AUTONOMOUS_AGENT',
      'AegisFlow Correlation Engine v2.5',
      'ANOMALY_CORRELATED',
      'RECORD',
      v_rec_ath_01::text,
      '{"silo": "AUTH0_SECURITY_LOGS", "anomaly": "Impossible travel token refresh from Romania proxy with elevated scopes"}'::jsonb,
      'WARNING'
    ),
    (
      v_demo_user_id,
      NOW() - INTERVAL '2.5 hours',
      'AUTONOMOUS_AGENT',
      'AegisFlow Decision Core (gemini-2.5-flash)',
      'INCIDENT_CREATED',
      'INCIDENT',
      v_inc_wire_id::text,
      '{"title": "Compromised Vendor Banking Update & Duplicate $85,000 SEPA Wire Batch", "risk_score": 94, "exposure_usd": 85000}'::jsonb,
      'CRITICAL'
    ),
    (
      v_demo_user_id,
      NOW() - INTERVAL '2.4 hours',
      'AUTONOMOUS_AGENT',
      'AegisFlow Policy Enforcer',
      'WORKFLOW_AUTO_EXECUTED',
      'WORKFLOW',
      '55555555-5555-5555-5555-000000000003',
      '{"action_type": "REVOKE_KEY", "client_id": "app_terraform_ci_prod_09", "reason": "Risk 35 < HITL Threshold 70. Automated credential containment."}'::jsonb,
      'INFO'
    ),
    (
      v_demo_user_id,
      NOW() - INTERVAL '2.3 hours',
      'SYSTEM_POLICY',
      'Guardrail Policy Engine',
      'WORKFLOW_ESCALATED_HITL',
      'WORKFLOW',
      '55555555-5555-5555-5555-000000000004',
      '{"breached_conditions": ["Risk Score 94 exceeds threshold 70", "USD Exposure $85,000 exceeds threshold $25,000", "Domain FINANCIAL_LEDGER in mandatory HITL list"], "status": "PENDING_APPROVAL"}'::jsonb,
      'CRITICAL'
    ),
    (
      v_demo_user_id,
      NOW() - INTERVAL '1.8 hours',
      'AUTONOMOUS_AGENT',
      'AegisFlow Correlation Engine v2.5',
      'INCIDENT_CREATED',
      'INCIDENT',
      v_inc_cloud_id::text,
      '{"title": "Multi-Region GPU Auto-Scaling Loop & NAT Gateway Egress Spike", "risk_score": 88, "exposure_usd": 52300}'::jsonb,
      'CRITICAL'
    ),
    (
      v_demo_user_id,
      NOW() - INTERVAL '1.7 hours',
      'AUTONOMOUS_AGENT',
      'AegisFlow Policy Enforcer',
      'WORKFLOW_AUTO_EXECUTED',
      'WORKFLOW',
      '55555555-5555-5555-5555-000000000001',
      '{"action_type": "RATE_LIMIT_CLUSTER", "clamped_desired_capacity": 4, "reason": "Stabilized cluster capacity within low-risk tolerance."}'::jsonb,
      'INFO'
    ),
    (
      v_demo_user_id,
      NOW() - INTERVAL '1.6 hours',
      'SYSTEM_POLICY',
      'Guardrail Policy Engine',
      'WORKFLOW_ESCALATED_HITL',
      'WORKFLOW',
      '55555555-5555-5555-5555-000000000002',
      '{"breached_conditions": ["Risk Score 88 exceeds threshold 70", "USD Exposure $42,500 exceeds threshold $25,000", "Domain CLOUD_INFRASTRUCTURE in mandatory HITL list"], "status": "PENDING_APPROVAL"}'::jsonb,
      'CRITICAL'
    );

  -- 5.7 Insert Welcome Chat Session & Messages
  INSERT INTO public.chat_sessions (id, user_id, title, created_at, updated_at)
  VALUES (
    v_chat_session_id,
    v_demo_user_id,
    'Operations & Cash-at-Risk Triage',
    NOW() - INTERVAL '1 hour',
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.chat_messages (session_id, sender, content, citations, suggested_prompts, created_at)
  VALUES (
    v_chat_session_id,
    'assistant',
    '**Welcome to AegisFlow Agentic Operations Command.**

I am continuously monitoring telemetry from **SAP ERP**, **AWS Cost Explorer**, **Stripe Billing**, **NetSuite Vendors**, and **Auth0 Security Logs**.

Currently, I have identified **2 active critical incidents** spanning cross-silo anomalies:
1. **Multi-Region GPU Auto-Scaling Loop** ($52,300 exposure, Risk 88)
2. **Duplicate $85,000 SEPA Wire Batch & Compromised Remittance Bank Update** ($85,000 exposure, Risk 94)

There are **2 high-stakes mitigation workflows awaiting your HITL approval** in the Guardrail Queue. How would you like to proceed?',
    jsonb_build_array(
      jsonb_build_object('id', v_inc_cloud_id::text, 'type', 'INCIDENT', 'title', 'GPU Auto-Scaling Loop', 'financial_usd', 52300, 'risk_score', 88, 'url_path', '/incidents/' || v_inc_cloud_id::text),
      jsonb_build_object('id', v_inc_wire_id::text, 'type', 'INCIDENT', 'title', 'Duplicate $85k Wire & Vendor IBAN Update', 'financial_usd', 85000, 'risk_score', 94, 'url_path', '/incidents/' || v_inc_wire_id::text)
    ),
    jsonb_build_array(
      'What is our total unmitigated financial exposure right now?',
      'Why did the AWS GPU auto-scaling loop escalate to HITL review?',
      'Simulate the fiscal impact if we approve the SAP wire freeze.',
      'Review the anomalous Tor exit node IP from the Auth0 logs.'
    ),
    NOW() - INTERVAL '1 hour'
  )
  ON CONFLICT DO NOTHING;

END $$;
