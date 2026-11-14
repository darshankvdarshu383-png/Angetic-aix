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

export interface UserProfile {
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
  hitl_risk_threshold: number;
  hitl_usd_threshold: number;
  mandatory_hitl_domains: string[];
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
  raw_payload: Record<string, any>;
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
  execution_payload: Record<string, any>;
  rollback_plan: Record<string, any>;
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
  risk_score: number;
  estimated_financial_impact_usd: number;
  status: IncidentStatus;
  root_cause_synthesis: string;
  correlated_record_ids: string[];
  mitigations?: MitigationWorkflow[];
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

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
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
  details: Record<string, any>;
  risk_level: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface DashboardStats {
  kpis: {
    totalFinancialExposureUsd: number;
    activeIncidentsCount: number;
    pendingApprovalsCount: number;
    autonomousMitigationRate: number;
  };
  domainBreakdown: Array<{
    domain: string;
    count: number;
    exposureUsd: number;
    maxRisk: number;
  }>;
  urgentQueue: Array<MitigationWorkflow & { incidentTitle: string; incidentSeverity: string }>;
  auditStream: AuditLog[];
  siloStats: Record<string, { total: number; anomalies: number; totalUsd: number }>;
  systemStatus: {
    geminiEngine: string;
    geminiModel: string;
    databaseMode: string;
    hitlPolicy: {
      riskThreshold: number;
      usdThreshold: number;
      autoExecutionEnabled: boolean;
    };
  };
}

export interface FinanceAnalysis {
  executive_summary: string;
  total_cash_at_risk_usd: number;
  estimated_mitigation_savings_usd: number;
  mitigation_roi_percentage: number;
  recommended_actions: Array<{
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    action: string;
    owner: string;
    potential_savings_usd: number;
    implementation_complexity: string;
    timeline: string;
  }>;
  forecast_time_series: Array<{
    period: string;
    unmitigated_exposure_usd: number;
    mitigated_residual_risk_usd: number;
    cumulative_prevented_loss_usd: number;
  }>;
}
