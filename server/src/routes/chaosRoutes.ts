import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';
import { DEFAULT_USER_ID } from '../db/seedData.js';
import { CHAOS_PRESETS } from '../chaos/chaosPresets.js';
import { geminiService } from '../ai/geminiClient.js';
import { guardrailEngine } from '../guardrails/guardrailEngine.js';
import { FragmentedDataRecord, Incident, MitigationWorkflow, AuditLog } from '../db/schema.js';
import { z } from 'zod';

const router = Router();

router.get('/presets', (req: Request, res: Response) => {
  res.json({ presets: CHAOS_PRESETS });
});

const InjectSchema = z.object({
  presetId: z.string().optional(),
  customTelemetry: z
    .object({
      silo_source: z.enum([
        'SAP_ERP_LEDGER',
        'AWS_COST_EXPLORER',
        'STRIPE_BILLING',
        'NETSUITE_VENDORS',
        'AUTH0_SECURITY_LOGS',
      ]),
      entity_name: z.string().min(1),
      amount_usd: z.number().min(0),
      anomaly_reason: z.string().min(5),
      raw_payload: z.record(z.any()).optional(),
    })
    .optional(),
});

router.post('/inject', async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
  const parseResult = InjectSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid injection payload', details: parseResult.error.errors });
  }

  const { presetId, customTelemetry } = parseResult.data;
  const injectedRecords: FragmentedDataRecord[] = [];

  if (presetId) {
    const preset = CHAOS_PRESETS.find((p) => p.id === presetId);
    if (!preset) {
      return res.status(404).json({ error: `Chaos preset '${presetId}' not found` });
    }

    preset.records.forEach((r, idx) => {
      const rec: FragmentedDataRecord = {
        id: `rec-chaos-${Date.now().toString(36)}-${idx}`,
        user_id: userId,
        ...r,
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      db.insertRecord(rec);
      injectedRecords.push(rec);
    });

    // Audit log
    db.insertAuditLog({
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      timestamp: new Date().toISOString(),
      actor_type: 'HUMAN_OPERATOR',
      actor_id: 'Chaos Engineering Lab',
      action: 'CHAOS_SCENARIO_INJECTED',
      target_type: 'CHAOS_PRESET',
      target_id: preset.id,
      details: {
        presetName: preset.name,
        recordsInjected: injectedRecords.length,
        estimatedExposureUsd: preset.estimatedExposureUsd,
      },
      risk_level: 'CRITICAL',
    });
  } else if (customTelemetry) {
    const rec: FragmentedDataRecord = {
      id: `rec-custom-${Date.now().toString(36)}`,
      user_id: userId,
      silo_source: customTelemetry.silo_source,
      external_record_id: `CUSTOM-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      entity_name: customTelemetry.entity_name,
      amount_usd: customTelemetry.amount_usd,
      status: 'ANOMALY_SUBMITTED',
      raw_payload: customTelemetry.raw_payload || { source: 'custom_operator_injection' },
      is_anomaly: true,
      anomaly_reason: customTelemetry.anomaly_reason,
      created_at: new Date().toISOString(),
    };
    db.insertRecord(rec);
    injectedRecords.push(rec);

    db.insertAuditLog({
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      timestamp: new Date().toISOString(),
      actor_type: 'HUMAN_OPERATOR',
      actor_id: 'Operator Telemetry Console',
      action: 'CUSTOM_TELEMETRY_INJECTED',
      target_type: 'RECORD',
      target_id: rec.id,
      details: {
        silo: rec.silo_source,
        amount_usd: rec.amount_usd,
        reason: rec.anomaly_reason,
      },
      risk_level: 'WARNING',
    });
  } else {
    return res.status(400).json({ error: 'Either presetId or customTelemetry is required.' });
  }

  // Autonomous Correlation & Decision Loop
  const allUserRecords = db.getRecords(userId);
  const anomalousRecords = allUserRecords.filter((r) => r.is_anomaly);

  try {
    const correlation = await geminiService.correlateCrossSiloAnomalies(
      injectedRecords,
      allUserRecords.filter((r) => !r.is_anomaly)
    );

    const policy = db.getGuardrailPolicy(userId);
    let createdIncident: Incident | null = null;
    const evaluatedMitigations: any[] = [];

    if (correlation.detected) {
      const incidentId = `inc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;
      createdIncident = {
        id: incidentId,
        user_id: userId,
        title: correlation.title,
        description: correlation.description,
        domain: correlation.domain,
        severity: correlation.severity,
        risk_score: correlation.risk_score,
        estimated_financial_impact_usd: correlation.estimated_financial_impact_usd,
        status: 'DETECTED',
        root_cause_synthesis: correlation.root_cause_synthesis,
        correlated_record_ids: correlation.correlated_record_ids,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      db.insertIncident(createdIncident);

      // Audit log for Incident creation
      db.insertAuditLog({
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        user_id: userId,
        timestamp: new Date().toISOString(),
        actor_type: 'AUTONOMOUS_AGENT',
        actor_id: 'AegisFlow Decision Core (gemini-2.5-flash)',
        action: 'INCIDENT_CREATED',
        target_type: 'INCIDENT',
        target_id: incidentId,
        details: {
          title: createdIncident.title,
          risk_score: createdIncident.risk_score,
          estimated_usd: createdIncident.estimated_financial_impact_usd,
        },
        risk_level: createdIncident.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
      });

      // Route every proposed mitigation through Deterministic Guardrail Engine
      for (const m of correlation.proposed_mitigations) {
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

    res.status(201).json({
      success: true,
      injectedRecordsCount: injectedRecords.length,
      correlation,
      incident: createdIncident,
      evaluatedMitigations,
    });
  } catch (err: any) {
    console.error('[ChaosRoutes] Error during correlation and mitigation routing:', err);
    res.status(500).json({ error: 'Failed to process chaos injection', details: err.message });
  }
});

export default router;
