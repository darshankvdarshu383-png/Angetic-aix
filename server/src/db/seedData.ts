import { FragmentedDataRecord, GuardrailPolicy, Incident, MitigationWorkflow, AuditLog } from './schema.js';

export const DEFAULT_USER_ID = 'demo-operator-uuid';

export const createDefaultGuardrailPolicy = (userId: string = DEFAULT_USER_ID): GuardrailPolicy => ({
  id: `policy-${userId}`,
  user_id: userId,
  hitl_risk_threshold: 70,
  hitl_usd_threshold: 25000,
  mandatory_hitl_domains: ['FINANCIAL_LEDGER', 'CLOUD_INFRASTRUCTURE', 'IAM_CREDENTIALS'],
  auto_execution_enabled: true,
  notification_channel: 'SLACK_PAGERDUTY',
  created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  updated_at: new Date().toISOString(),
});

export const createSeedRecords = (userId: string = DEFAULT_USER_ID): FragmentedDataRecord[] => {
  const now = Date.now();
  const h = (hoursAgo: number) => new Date(now - hoursAgo * 3600000).toISOString();

  return [
    // 1. SAP_ERP_LEDGER - Anomaly (Duplicate wire disbursement)
    {
      id: 'rec-sap-01',
      user_id: userId,
      silo_source: 'SAP_ERP_LEDGER',
      external_record_id: 'SAP-WR-99820-A',
      timestamp: h(2.5),
      entity_name: 'Apex Global Logistics BV',
      amount_usd: 85000.00,
      status: 'COMMITTED',
      raw_payload: {
        batch_id: 'BATCH-2026-NOV-881',
        gl_account: '2100-ACCOUNTS-PAYABLE',
        clearing_doc: 'DOC-99281-EUR',
        payment_method: 'SEPA_WIRE',
        reconciliation_hash: '9a8b7c6d5e4f3a2b1c',
        initiator: 'sys_autopay_daemon_04'
      },
      is_anomaly: true,
      anomaly_reason: 'Duplicate wire disbursement detected: Identical payment amount and recipient within 14 minutes of previous batch #BATCH-2026-NOV-879 without corresponding purchase order delta.',
      created_at: h(2.5)
    },
    // 2. SAP_ERP_LEDGER - Standard
    {
      id: 'rec-sap-02',
      user_id: userId,
      silo_source: 'SAP_ERP_LEDGER',
      external_record_id: 'SAP-GL-44021',
      timestamp: h(8),
      entity_name: 'Microsoft Enterprise Azure SaaS',
      amount_usd: 14250.00,
      status: 'RECONCILED',
      raw_payload: {
        gl_account: '6300-SOFTWARE-SUBSCRIPTIONS',
        invoice_ref: 'INV-MSFT-2026-099',
        cost_center: 'CC-ENG-PLATFORM',
        cleared_date: h(8)
      },
      is_anomaly: false,
      created_at: h(8)
    },
    // 3. SAP_ERP_LEDGER - Standard
    {
      id: 'rec-sap-03',
      user_id: userId,
      silo_source: 'SAP_ERP_LEDGER',
      external_record_id: 'SAP-AP-33910',
      timestamp: h(16),
      entity_name: 'Datadog Observability Tier-1',
      amount_usd: 28900.00,
      status: 'POSTED',
      raw_payload: {
        gl_account: '6310-MONITORING-SAAS',
        approval_flow: 'STANDARD_FINANCE_DIRECTOR',
        purchase_order: 'PO-2026-5541'
      },
      is_anomaly: false,
      created_at: h(16)
    },

    // 4. AWS_COST_EXPLORER - Anomaly (Runaway GPU Auto-Scaling Loop)
    {
      id: 'rec-aws-01',
      user_id: userId,
      silo_source: 'AWS_COST_EXPLORER',
      external_record_id: 'AWS-CE-US-EAST-1-GPU-88',
      timestamp: h(1.8),
      entity_name: 'p4d.24xlarge / ML-Inference-ASG',
      amount_usd: 42500.00,
      status: 'ACTIVE_RUNAWAY',
      raw_payload: {
        region: 'us-east-1',
        service: 'Amazon Elastic Compute Cloud - Compute',
        usage_type: 'BoxUsage:p4d.24xlarge',
        instance_count: 64,
        scaling_policy: 'TargetTracking-HighLossErrorRate',
        burn_rate_usd_hour: 2130.00,
        unblended_cost: 42500.00
      },
      is_anomaly: true,
      anomaly_reason: 'Auto-scaling group max-instance guardrail breached. ASG scaled from 4 to 64 p4d.24xlarge nodes in 75 minutes due to recursive retry loop on failing health-check endpoint.',
      created_at: h(1.8)
    },
    // 5. AWS_COST_EXPLORER - Anomaly (NAT Gateway Data Transfer Spike)
    {
      id: 'rec-aws-02',
      user_id: userId,
      silo_source: 'AWS_COST_EXPLORER',
      external_record_id: 'AWS-NAT-GW-099238',
      timestamp: h(2.1),
      entity_name: 'nat-0a9b8c7d6e5f4a3b2',
      amount_usd: 9800.00,
      status: 'ELEVATED_EGRESS',
      raw_payload: {
        region: 'us-east-1',
        service: 'Amazon Virtual Private Cloud',
        usage_type: 'NatGateway-Bytes',
        bytes_transferred_gb: 217800,
        destination_ips: ['198.51.100.44', '203.0.113.89']
      },
      is_anomaly: true,
      anomaly_reason: 'Uncontrolled NAT Gateway outbound egress exceeding baseline 99th percentile by 1,420%. Correlated with runaway ML inference cluster dumping uncompressed model weights.',
      created_at: h(2.1)
    },
    // 6. AWS_COST_EXPLORER - Standard
    {
      id: 'rec-aws-03',
      user_id: userId,
      silo_source: 'AWS_COST_EXPLORER',
      external_record_id: 'AWS-S3-STD-0044',
      timestamp: h(24),
      entity_name: 's3://aegisflow-production-backups',
      amount_usd: 3410.00,
      status: 'NORMAL',
      raw_payload: {
        region: 'us-west-2',
        service: 'Amazon Simple Storage Service',
        storage_tb: 148.2,
        lifecycle_rule: 'GLACIER_30_DAYS'
      },
      is_anomaly: false,
      created_at: h(24)
    },

    // 7. STRIPE_BILLING - Anomaly (Webhook Drop & Double-Charge Cycle)
    {
      id: 'rec-str-01',
      user_id: userId,
      silo_source: 'STRIPE_BILLING',
      external_record_id: 'ch_3Q94KxL2eZvKYlo20sNq',
      timestamp: h(3.2),
      entity_name: 'Nexus Enterprise Tier Annual',
      amount_usd: 18400.00,
      status: 'WEBHOOK_DESYNC',
      raw_payload: {
        customer_id: 'cus_R88a29b40f',
        invoice_id: 'in_1P83x920a0029',
        attempt_count: 5,
        webhook_status: 'HTTP_504_TIMEOUT',
        gateway_reconciliation_lag_minutes: 194,
        idempotency_key: 'idem-sub-nexus-2026-rev2'
      },
      is_anomaly: true,
      anomaly_reason: 'Stripe webhook listener timed out 5 consecutive times, causing client-side retry daemon to queue duplicate authorization hold while ERP marked payment uncollected.',
      created_at: h(3.2)
    },
    // 8. STRIPE_BILLING - Standard
    {
      id: 'rec-str-02',
      user_id: userId,
      silo_source: 'STRIPE_BILLING',
      external_record_id: 'ch_3Q88AaB8cDeFgHiJ01kL',
      timestamp: h(12),
      entity_name: 'Zenith Labs Growth Plan',
      amount_usd: 4800.00,
      status: 'PAID',
      raw_payload: {
        customer_id: 'cus_Zenith991',
        payment_method: 'card_visa_8821',
        risk_evaluation: 'normal_02'
      },
      is_anomaly: false,
      created_at: h(12)
    },
    // 9. STRIPE_BILLING - Standard
    {
      id: 'rec-str-03',
      user_id: userId,
      silo_source: 'STRIPE_BILLING',
      external_record_id: 'ch_3Q77ZzY1xWvUtSrQ99pO',
      timestamp: h(28),
      entity_name: 'Vortex Global API Overages',
      amount_usd: 6250.00,
      status: 'PAID',
      raw_payload: {
        customer_id: 'cus_Vortex102',
        currency: 'usd',
        dispute_status: null
      },
      is_anomaly: false,
      created_at: h(28)
    },

    // 10. NETSUITE_VENDORS - Anomaly (Compromised Vendor Banking Update)
    {
      id: 'rec-net-01',
      user_id: userId,
      silo_source: 'NETSUITE_VENDORS',
      external_record_id: 'NS-VND-4491-MOD',
      timestamp: h(4.0),
      entity_name: 'Apex Global Logistics BV',
      amount_usd: 85000.00,
      status: 'ROUTING_CHANGED',
      raw_payload: {
        vendor_id: 'VND-4491',
        action: 'UPDATE_REMITTANCE_BANK_DETAILS',
        old_iban: 'NL91ABNA0412889211',
        new_iban: 'GB29BARC20000099827361',
        modified_by_ip: '185.220.101.5',
        two_factor_verified: false,
        flag_audit: 'OFFSHORE_JURISDICTION_MISMATCH'
      },
      is_anomaly: true,
      anomaly_reason: 'Vendor remittance IBAN changed from Dutch domestic banking to non-resident UK account via anonymous Tor exit node without 2FA step-up confirmation.',
      created_at: h(4.0)
    },
    // 11. NETSUITE_VENDORS - Standard
    {
      id: 'rec-net-02',
      user_id: userId,
      silo_source: 'NETSUITE_VENDORS',
      external_record_id: 'NS-VND-1002-PO',
      timestamp: h(18),
      entity_name: 'Snowflake Computing Inc',
      amount_usd: 35000.00,
      status: 'APPROVED',
      raw_payload: {
        vendor_id: 'VND-1002',
        terms: 'NET_45',
        annual_contract_value: 420000.00,
        approval_tier: 'EXEC_FINANCE'
      },
      is_anomaly: false,
      created_at: h(18)
    },
    // 12. NETSUITE_VENDORS - Standard
    {
      id: 'rec-net-03',
      user_id: userId,
      silo_source: 'NETSUITE_VENDORS',
      external_record_id: 'NS-VND-8821-INV',
      timestamp: h(36),
      entity_name: 'CrowdStrike Falcon Protect',
      amount_usd: 19500.00,
      status: 'PAID',
      raw_payload: {
        vendor_id: 'VND-8821',
        service_category: 'ENDPOINT_SECURITY',
        po_number: 'PO-2026-4401'
      },
      is_anomaly: false,
      created_at: h(36)
    },

    // 13. AUTH0_SECURITY_LOGS - Anomaly (Compromised Service Account Token & Impossible Travel)
    {
      id: 'rec-ath-01',
      user_id: userId,
      silo_source: 'AUTH0_SECURITY_LOGS',
      external_record_id: 'AUTH0-SEC-EVT-90041',
      timestamp: h(4.2),
      entity_name: 'svc-terraform-deployer@aegis.internal',
      amount_usd: 0,
      status: 'SUSPICIOUS_TOKEN_REFRESH',
      raw_payload: {
        client_id: 'app_terraform_ci_prod_09',
        event_type: 'oauth2_token_refresh',
        ip_address: '185.220.101.5',
        asn: 'AS208207 (Anonymous Proxy)',
        geolocation: { country: 'RO', city: 'Bucharest' },
        simultaneous_active_session: {
          ip: '54.210.88.19',
          country: 'US',
          city: 'Ashburn'
        },
        scopes_requested: ['admin:cloud:mutate', 'erp:wire:execute', 'kms:decrypt']
      },
      is_anomaly: true,
      anomaly_reason: 'Impossible travel anomaly detected: Service account API token refreshed simultaneously from US AWS datacenters and a known Tor exit relay in Romania with elevated wire execution scopes.',
      created_at: h(4.2)
    },
    // 14. AUTH0_SECURITY_LOGS - Standard
    {
      id: 'rec-ath-02',
      user_id: userId,
      silo_source: 'AUTH0_SECURITY_LOGS',
      external_record_id: 'AUTH0-SEC-EVT-89210',
      timestamp: h(6),
      entity_name: 'cfo-alex.mercer@aegis.com',
      amount_usd: 0,
      status: 'SUCCESSFUL_LOGIN',
      raw_payload: {
        auth_method: 'WEBAUTHN_FIDO2_HARDWARE_KEY',
        ip_address: '71.198.44.12',
        geolocation: { country: 'US', city: 'San Francisco' },
        mfa_verified: true
      },
      is_anomaly: false,
      created_at: h(6)
    },
    // 15. AUTH0_SECURITY_LOGS - Standard
    {
      id: 'rec-ath-03',
      user_id: userId,
      silo_source: 'AUTH0_SECURITY_LOGS',
      external_record_id: 'AUTH0-SEC-EVT-87114',
      timestamp: h(14),
      entity_name: 'devops-lead-sarah@aegis.com',
      amount_usd: 0,
      status: 'SUCCESSFUL_LOGIN',
      raw_payload: {
        auth_method: 'PASSWORDLESS_MAGIC_LINK',
        ip_address: '68.105.12.98',
        geolocation: { country: 'US', city: 'Seattle' },
        mfa_verified: true
      },
      is_anomaly: false,
      created_at: h(14)
    }
  ];
};

export const createSeedIncidents = (userId: string = DEFAULT_USER_ID): { incidents: Incident[], mitigations: MitigationWorkflow[], auditLogs: AuditLog[] } => {
  const now = Date.now();
  const h = (hoursAgo: number) => new Date(now - hoursAgo * 3600000).toISOString();

  const incident1Id = 'inc-cloud-001';
  const incident2Id = 'inc-wire-002';

  const incidents: Incident[] = [
    {
      id: incident1Id,
      user_id: userId,
      title: 'Multi-Region GPU Auto-Scaling Loop & NAT Gateway Egress Spike',
      description: 'Runaway AWS EC2 auto-scaling loop triggered in us-east-1 allocating 64 p4d.24xlarge GPU instances with uncontrolled uncompressed model checkpoint dumping through NAT Gateway. Financial exposure escalating at $2,130/hr.',
      domain: 'CLOUD_INFRASTRUCTURE',
      severity: 'CRITICAL',
      risk_score: 88,
      estimated_financial_impact_usd: 52300,
      status: 'DETECTED',
      root_cause_synthesis: 'A misconfigured ML inference health-check endpoint returned HTTP 500 on large payload evaluations, provoking AWS TargetTrackingScaling policy into maximum scaling panic. Overlapping NAT Gateway telemetry indicates 217 TB outbound model egress due to missing VPC S3 endpoint routing.',
      correlated_record_ids: ['rec-aws-01', 'rec-aws-02'],
      created_at: h(1.8),
      updated_at: h(0.2)
    },
    {
      id: incident2Id,
      user_id: userId,
      title: 'Compromised Vendor Banking Update & Duplicate $85,000 SEPA Wire Batch',
      description: 'Vendor remittance IBAN for Apex Global Logistics BV was altered via an unauthorized Tor exit proxy without 2FA, immediately followed by an automated SAP ERP duplicate wire disbursement batch of $85,000.',
      domain: 'FINANCIAL_LEDGER',
      severity: 'CRITICAL',
      risk_score: 94,
      estimated_financial_impact_usd: 85000,
      status: 'MITIGATING',
      root_cause_synthesis: 'Auth0 security event AUTH0-SEC-EVT-90041 revealed stolen service credentials used from an Eastern European Tor exit node to modify NetSuite vendor banking details to an offshore UK account. Simultaneously, SAP ERP batch job scheduled a duplicate €85,000 wire disbursement matching previous settlement.',
      correlated_record_ids: ['rec-sap-01', 'rec-net-01', 'rec-ath-01'],
      created_at: h(2.5),
      updated_at: h(0.5)
    }
  ];

  const mitigations: MitigationWorkflow[] = [
    // Incident 1 Mitigations
    {
      id: 'mit-001-auto',
      incident_id: incident1Id,
      user_id: userId,
      title: 'Clamp ASG Desired Capacity & Throttle Health Check Loop',
      action_type: 'RATE_LIMIT_CLUSTER',
      domain: 'CLOUD_INFRASTRUCTURE',
      target_system: 'AWS_AUTO_SCALING_API',
      execution_payload: {
        auto_scaling_group_name: 'ML-Inference-ASG',
        min_size: 4,
        max_size: 8,
        desired_capacity: 4,
        cooldown_seconds: 600,
        disable_scale_out_metric: 'TargetTracking-HighLossErrorRate'
      },
      rollback_plan: {
        restore_min_size: 4,
        restore_max_size: 64,
        enable_scaling_policy: true
      },
      risk_score: 45,
      financial_impact_usd: 9800,
      status: 'AUTO_EXECUTED',
      approved_by: 'AUTONOMOUS_POLICY_RULE_04',
      audit_justification: 'Risk score 45 and USD impact $9,800 fall within Auto-Execution Tier. Preserves baseline infrastructure stability without terminating running user jobs.',
      created_at: h(1.7),
      executed_at: h(1.7)
    },
    {
      id: 'mit-001-hitl',
      incident_id: incident1Id,
      user_id: userId,
      title: 'Emergency Terminate 56 Runaway GPU Nodes & Reroute NAT to VPC S3 Endpoint',
      action_type: 'TERMINATE_INSTANCES_AND_ROUTE',
      domain: 'CLOUD_INFRASTRUCTURE',
      target_system: 'AWS_EC2_AND_VPC_ROUTETABLE',
      execution_payload: {
        vpc_id: 'vpc-09887123aa',
        target_instance_ids: ['i-0112a8849b', 'i-0982bb716c', 'i-0442cc991d', '...and 53 more'],
        force_drain_seconds: 60,
        create_s3_gateway_endpoint: true,
        delete_unattached_ebs_volumes: true
      },
      rollback_plan: {
        can_rollback: false,
        recreation_script: 'terraform apply -target=module.inference_fleet'
      },
      risk_score: 88,
      financial_impact_usd: 42500,
      status: 'PENDING_APPROVAL',
      created_at: h(1.6)
    },

    // Incident 2 Mitigations
    {
      id: 'mit-002-auto',
      incident_id: incident2Id,
      user_id: userId,
      title: 'Revoke Compromised Service Token & Force Invalidate Auth0 Sessions',
      action_type: 'REVOKE_KEY',
      domain: 'IDENTITY_ACCESS',
      target_system: 'AUTH0_MANAGEMENT_API',
      execution_payload: {
        client_id: 'app_terraform_ci_prod_09',
        action: 'REVOKE_ALL_REFRESH_TOKENS',
        blacklist_ip_range: '185.220.101.0/24',
        rotate_client_secret: true
      },
      rollback_plan: {
        reactivate_client: true,
        generate_new_credentials: true
      },
      risk_score: 35,
      financial_impact_usd: 0,
      status: 'AUTO_EXECUTED',
      approved_by: 'AUTONOMOUS_SECURITY_ORCHESTRATOR',
      audit_justification: 'Automated immediate credential containment triggered by impossible travel heuristic. Risk level 35 is below HITL threshold.',
      created_at: h(2.4),
      executed_at: h(2.4)
    },
    {
      id: 'mit-002-hitl',
      incident_id: incident2Id,
      user_id: userId,
      title: 'Hard Freeze SAP Clearing Batch #BATCH-2026-NOV-881 & Rollback NetSuite Vendor IBAN',
      action_type: 'ROLLBACK_TRANSACTION',
      domain: 'FINANCIAL_LEDGER',
      target_system: 'SAP_ERP_BANK_GATEWAY',
      execution_payload: {
        batch_id: 'BATCH-2026-NOV-881',
        sap_doc_id: 'DOC-99281-EUR',
        freeze_payment_order: true,
        notify_clearing_bank_swift: 'BARCGB22',
        revert_vendor_record_to_iban: 'NL91ABNA0412889211'
      },
      rollback_plan: {
        unfreeze_batch_if_authorized: true,
        requeue_payment_run: true
      },
      risk_score: 94,
      financial_impact_usd: 85000,
      status: 'PENDING_APPROVAL',
      created_at: h(2.3)
    }
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'aud-001',
      user_id: userId,
      timestamp: h(4.2),
      actor_type: 'AUTONOMOUS_AGENT',
      actor_id: 'AegisFlow Correlation Engine v2.5',
      action: 'ANOMALY_CORRELATED',
      target_type: 'RECORD',
      target_id: 'rec-ath-01',
      details: {
        silo: 'AUTH0_SECURITY_LOGS',
        anomaly: 'Impossible travel token refresh from Romania proxy with elevated scopes'
      },
      risk_level: 'WARNING'
    },
    {
      id: 'aud-002',
      user_id: userId,
      timestamp: h(2.5),
      actor_type: 'AUTONOMOUS_AGENT',
      actor_id: 'AegisFlow Decision Core',
      action: 'INCIDENT_CREATED',
      target_type: 'INCIDENT',
      target_id: incident2Id,
      details: {
        title: 'Compromised Vendor Banking Update & Duplicate $85,000 SEPA Wire Batch',
        risk_score: 94,
        exposure_usd: 85000
      },
      risk_level: 'CRITICAL'
    },
    {
      id: 'aud-003',
      user_id: userId,
      timestamp: h(2.4),
      actor_type: 'AUTONOMOUS_AGENT',
      actor_id: 'AegisFlow Policy Enforcer',
      action: 'WORKFLOW_AUTO_EXECUTED',
      target_type: 'WORKFLOW',
      target_id: 'mit-002-auto',
      details: {
        action_type: 'REVOKE_KEY',
        client_id: 'app_terraform_ci_prod_09',
        reason: 'Risk 35 < HITL Threshold 70. Automated credential containment.'
      },
      risk_level: 'INFO'
    },
    {
      id: 'aud-004',
      user_id: userId,
      timestamp: h(2.3),
      actor_type: 'SYSTEM_POLICY',
      actor_id: 'Guardrail Policy Engine',
      action: 'WORKFLOW_ESCALATED_HITL',
      target_type: 'WORKFLOW',
      target_id: 'mit-002-hitl',
      details: {
        breached_conditions: [
          'Risk Score 94 exceeds threshold 70',
          'USD Exposure $85,000 exceeds threshold $25,000',
          'Domain FINANCIAL_LEDGER in mandatory HITL list'
        ],
        status: 'PENDING_APPROVAL'
      },
      risk_level: 'CRITICAL'
    },
    {
      id: 'aud-005',
      user_id: userId,
      timestamp: h(1.8),
      actor_type: 'AUTONOMOUS_AGENT',
      actor_id: 'AegisFlow Correlation Engine v2.5',
      action: 'INCIDENT_CREATED',
      target_type: 'INCIDENT',
      target_id: incident1Id,
      details: {
        title: 'Multi-Region GPU Auto-Scaling Loop & NAT Gateway Egress Spike',
        risk_score: 88,
        exposure_usd: 52300
      },
      risk_level: 'CRITICAL'
    },
    {
      id: 'aud-006',
      user_id: userId,
      timestamp: h(1.7),
      actor_type: 'AUTONOMOUS_AGENT',
      actor_id: 'AegisFlow Policy Enforcer',
      action: 'WORKFLOW_AUTO_EXECUTED',
      target_type: 'WORKFLOW',
      target_id: 'mit-001-auto',
      details: {
        action_type: 'RATE_LIMIT_CLUSTER',
        clamped_desired_capacity: 4,
        reason: 'Stabilized cluster capacity within low-risk tolerance.'
      },
      risk_level: 'INFO'
    },
    {
      id: 'aud-007',
      user_id: userId,
      timestamp: h(1.6),
      actor_type: 'SYSTEM_POLICY',
      actor_id: 'Guardrail Policy Engine',
      action: 'WORKFLOW_ESCALATED_HITL',
      target_type: 'WORKFLOW',
      target_id: 'mit-001-hitl',
      details: {
        breached_conditions: [
          'Risk Score 88 exceeds threshold 70',
          'USD Exposure $42,500 exceeds threshold $25,000',
          'Domain CLOUD_INFRASTRUCTURE in mandatory HITL list'
        ],
        status: 'PENDING_APPROVAL'
      },
      risk_level: 'CRITICAL'
    }
  ];

  return { incidents, mitigations, auditLogs };
};
