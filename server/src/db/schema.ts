export type SiloSource = 
  | 'SAP_ERP_LEDGER'
  | 'AWS_COST_EXPLORER'
  | 'STRIPE_BILLING'
  | 'NETSUITE_VENDORS'
  | 'AUTH0_SECURITY_LOGS';

export type IncidentDomain = 
  | 'FINANCIAL_LEDGER'
  | 'CLOUD_INFRASTRUCTURE'
  | 'PAYMENT_GATEWAY'
  | 'VENDOR_SUPPLY'
  | 'IDENTITY_ACCESS';

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentStatus = 'DETECTED' | 'MITIGATING' | 'RESOLVED' | 'ESCALATED';

export type WorkflowStatus = 'PENDING_APPROVAL' | 'AUTO_EXECUTED' | 'EXECUTED' | 'REJECTED';

export type ActorType = 'AUTONOMOUS_AGENT' | 'SYSTEM_POLICY' | 'HUMAN_OPERATOR';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'FINOPS_OPERATOR' | 'SECOPS_ENGINEER' | 'CFO' | 'INCIDENT_COMMANDER';
  organization: string;
  created_at: string;
  updated_at: string;
}

export interface GuardrailPolicy {
  id: string;
  user_id: string;
  hitl_risk_threshold: number; // e.g. 70
  hitl_usd_threshold: number; // e.g. 25000
  mandatory_hitl_domains: string[]; // ['FINANCIAL_LEDGER', 'CLOUD_INFRASTRUCTURE', 'IAM_CREDENTIALS']
  auto_execution_enabled: boolean;
  notification_channel: string;
  created_at: string;
  updated_at: string;
}

export interface FragmentedDataRecord {
  id: string;
  user_id: string;
  silo_source: SiloSource;
  external_record_id: string;
  timestamp: string;
  entity_name: string;
  amount_usd: number;
  status: string;
  raw_payload: Record<string, unknown>;
  is_anomaly: boolean;
  anomaly_reason?: string;
  created_at: string;
}

export interface MitigationWorkflow {
  id: string;
  incident_id: string;
  user_id: string;
  title: string;
  action_type: string;
  domain: IncidentDomain;
  target_system: string;
  execution_payload: Record<string, unknown>;
  rollback_plan: Record<string, unknown>;
  risk_score: number;
  financial_impact_usd: number;
  status: WorkflowStatus;
  approved_by?: string;
  audit_justification?: string;
  created_at: string;
  executed_at?: string;
}

export interface Incident {
  id: string;
  user_id: string;
  title: string;
  description: string;
  domain: IncidentDomain;
  severity: SeverityLevel;
  risk_score: number; // 0 - 100
  estimated_financial_impact_usd: number;
  status: IncidentStatus;
  root_cause_synthesis: string;
  correlated_record_ids: string[];
  mitigations?: MitigationWorkflow[];
  created_at: string;
  updated_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface CitationEntity {
  id: string;
  type: 'INCIDENT' | 'RECORD' | 'WORKFLOW' | 'POLICY';
  title: string;
  silo_source?: string;
  financial_usd?: number;
  risk_score?: number;
  url_path?: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  citations: CitationEntity[];
  suggested_prompts: string[];
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  timestamp: string;
  actor_type: ActorType;
  actor_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  risk_level: 'INFO' | 'WARNING' | 'CRITICAL';
}
