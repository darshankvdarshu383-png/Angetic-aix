import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';
import { DEFAULT_USER_ID } from '../db/seedData.js';
import { geminiService } from '../ai/geminiClient.js';
import { guardrailEngine } from '../guardrails/guardrailEngine.js';
import { MitigationWorkflow, Incident } from '../db/schema.js';

const router = Router();

// List all incidents
router.get('/', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
  const { domain, severity, status } = req.query;

  let incidents = db.getIncidents(userId);

  if (domain && domain !== 'ALL') {
    incidents = incidents.filter((i) => i.domain === domain);
  }
  if (severity && severity !== 'ALL') {
    incidents = incidents.filter((i) => i.severity === severity);
  }
  if (status && status !== 'ALL') {
    incidents = incidents.filter((i) => i.status === status);
  }

  res.json({
    incidents,
    total: incidents.length,
  });
});

// Get single incident with correlated records details
router.get('/:id', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
  const id = String(req.params.id);

  const incident = db.getIncidentById(id);
  if (!incident) {
    return res.status(404).json({ error: `Incident ${id} not found` });
  }

  // Populate correlated records
  const correlatedRecords = (incident.correlated_record_ids || [])
    .map((recId) => db.getRecordById(recId))
    .filter(Boolean);

  res.json({
    incident,
    correlatedRecords,
  });
});

// Trigger autonomous re-correlation
router.post('/correlate', async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
  const allRecords = db.getRecords(userId);
  const anomalousRecords = allRecords.filter((r) => r.is_anomaly);

  if (anomalousRecords.length === 0) {
    return res.json({
      detected: false,
      message: 'No anomalous telemetry records detected in database.',
    });
  }

  try {
    const result = await geminiService.correlateCrossSiloAnomalies(
      anomalousRecords.slice(0, 5),
      allRecords.filter((r) => !r.is_anomaly)
    );

    const policy = db.getGuardrailPolicy(userId);
    let createdIncident: Incident | null = null;
    const evaluatedMitigations: any[] = [];

    if (result.detected) {
      const incidentId = `inc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;
      createdIncident = {
        id: incidentId,
        user_id: userId,
        title: result.title,
        description: result.description,
        domain: result.domain,
        severity: result.severity,
        risk_score: result.risk_score,
        estimated_financial_impact_usd: result.estimated_financial_impact_usd,
        status: 'DETECTED',
        root_cause_synthesis: result.root_cause_synthesis,
        correlated_record_ids: result.correlated_record_ids,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      db.insertIncident(createdIncident);

      for (const m of result.proposed_mitigations) {
        const workflow: MitigationWorkflow = {
          id: `mit-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          incident_id: incidentId,
          user_id: userId,
          title: m.title,
          action_type: m.action_type,
          domain: m.domain,
          target_system: m.target_system,
          risk_score: m.risk_score,
          financial_impact_usd: m.financial_impact_usd,
          execution_payload: m.execution_payload,
          rollback_plan: m.rollback_plan,
          status: 'PENDING_APPROVAL',
          audit_justification: m.audit_justification,
          created_at: new Date().toISOString(),
        };

        const evalResult = guardrailEngine.evaluateAndRouteWorkflow(workflow, policy, createdIncident);
        evaluatedMitigations.push(evalResult);
      }
    }

    res.json({
      success: true,
      correlation: result,
      incident: createdIncident,
      mitigations: evaluatedMitigations,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Correlation failed', details: err.message });
  }
});

export default router;
