import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';
import { DEFAULT_USER_ID } from '../db/seedData.js';
import { config } from '../config.js';

const router = Router();

router.get('/stats', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;

  const incidents = db.getIncidents(userId);
  const activeIncidents = incidents.filter((i) => i.status !== 'RESOLVED');
  const workflows = db.getMitigationWorkflows(userId);
  const pendingWorkflows = workflows.filter((w) => w.status === 'PENDING_APPROVAL');
  const autoExecutedWorkflows = workflows.filter((w) => w.status === 'AUTO_EXECUTED');
  const records = db.getRecords(userId);
  const auditLogs = db.getAuditLogs(userId, 10);
  const policy = db.getGuardrailPolicy(userId);

  // 1. KPI Calculations
  const totalFinancialExposureUsd = activeIncidents.reduce(
    (sum, inc) => sum + (inc.estimated_financial_impact_usd || 0),
    0
  );

  const activeIncidentsCount = activeIncidents.length;
  const pendingApprovalsCount = pendingWorkflows.length;

  const totalActionedMitigations = workflows.filter((w) => w.status !== 'REJECTED').length;
  const autonomousMitigationRate =
    totalActionedMitigations > 0
      ? Math.round((autoExecutedWorkflows.length / totalActionedMitigations) * 100)
      : 80;

  // 2. Domain Risk Breakdown
  const domainMap: Record<string, { count: number; exposureUsd: number; maxRisk: number }> = {
    FINANCIAL_LEDGER: { count: 0, exposureUsd: 0, maxRisk: 0 },
    CLOUD_INFRASTRUCTURE: { count: 0, exposureUsd: 0, maxRisk: 0 },
    PAYMENT_GATEWAY: { count: 0, exposureUsd: 0, maxRisk: 0 },
    VENDOR_SUPPLY: { count: 0, exposureUsd: 0, maxRisk: 0 },
    IDENTITY_ACCESS: { count: 0, exposureUsd: 0, maxRisk: 0 },
  };

  activeIncidents.forEach((inc) => {
    if (!domainMap[inc.domain]) {
      domainMap[inc.domain] = { count: 0, exposureUsd: 0, maxRisk: 0 };
    }
    domainMap[inc.domain].count += 1;
    domainMap[inc.domain].exposureUsd += inc.estimated_financial_impact_usd || 0;
    domainMap[inc.domain].maxRisk = Math.max(domainMap[inc.domain].maxRisk, inc.risk_score || 0);
  });

  const domainBreakdown = Object.entries(domainMap).map(([domain, data]) => ({
    domain,
    count: data.count,
    exposureUsd: data.exposureUsd,
    maxRisk: data.maxRisk,
  }));

  // 3. Urgent HITL Queue Items
  const urgentQueue = pendingWorkflows.slice(0, 5).map((w) => {
    const parentIncident = incidents.find((i) => i.id === w.incident_id);
    return {
      ...w,
      incidentTitle: parentIncident?.title || 'Unknown Incident',
      incidentSeverity: parentIncident?.severity || 'HIGH',
    };
  });

  // 4. Silo Telemetry Summary
  const siloCounts: Record<string, { total: number; anomalies: number; totalUsd: number }> = {};
  records.forEach((r) => {
    if (!siloCounts[r.silo_source]) {
      siloCounts[r.silo_source] = { total: 0, anomalies: 0, totalUsd: 0 };
    }
    siloCounts[r.silo_source].total += 1;
    if (r.is_anomaly) siloCounts[r.silo_source].anomalies += 1;
    siloCounts[r.silo_source].totalUsd += r.amount_usd || 0;
  });

  res.json({
    kpis: {
      totalFinancialExposureUsd,
      activeIncidentsCount,
      pendingApprovalsCount,
      autonomousMitigationRate,
    },
    domainBreakdown,
    urgentQueue,
    auditStream: auditLogs,
    siloStats: siloCounts,
    systemStatus: {
      geminiEngine: config.geminiApiKey ? 'ONLINE_LIVE_API' : 'ONLINE_DETERMINISTIC_CORE',
      geminiModel: config.geminiModel,
      databaseMode: db.isSupabaseConnected ? 'SUPABASE_POSTGRES' : 'LOCAL_PERSISTENT_STORE',
      hitlPolicy: {
        riskThreshold: policy.hitl_risk_threshold,
        usdThreshold: policy.hitl_usd_threshold,
        autoExecutionEnabled: policy.auto_execution_enabled,
      },
    },
  });
});

export default router;
