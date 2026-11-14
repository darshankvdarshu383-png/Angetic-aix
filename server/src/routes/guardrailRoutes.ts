import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';
import { DEFAULT_USER_ID } from '../db/seedData.js';
import { guardrailEngine } from '../guardrails/guardrailEngine.js';
import { z } from 'zod';

const router = Router();

// Get guardrail policies and pending queue
router.get('/', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
  const policy = db.getGuardrailPolicy(userId);
  const workflows = db.getMitigationWorkflows(userId);
  const incidents = db.getIncidents(userId);

  const pendingApprovals = workflows
    .filter((w) => w.status === 'PENDING_APPROVAL')
    .map((w) => {
      const parentIncident = incidents.find((i) => i.id === w.incident_id);
      return {
        ...w,
        incidentTitle: parentIncident?.title || 'System Alert',
        incidentSeverity: parentIncident?.severity || 'HIGH',
      };
    });

  const history = workflows.filter((w) => w.status !== 'PENDING_APPROVAL');

  res.json({
    policy,
    pendingApprovals,
    history,
    stats: {
      total: workflows.length,
      pendingCount: pendingApprovals.length,
      autoExecutedCount: workflows.filter((w) => w.status === 'AUTO_EXECUTED').length,
      humanExecutedCount: workflows.filter((w) => w.status === 'EXECUTED').length,
      rejectedCount: workflows.filter((w) => w.status === 'REJECTED').length,
    },
  });
});

const PolicyUpdateSchema = z.object({
  hitl_risk_threshold: z.number().min(0).max(100).optional(),
  hitl_usd_threshold: z.number().min(0).optional(),
  mandatory_hitl_domains: z.array(z.string()).optional(),
  auto_execution_enabled: z.boolean().optional(),
  notification_channel: z.string().optional(),
});

// Update guardrail policy
router.put('/policy', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
  const parseResult = PolicyUpdateSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid policy payload', details: parseResult.error.errors });
  }

  const updatedPolicy = db.updateGuardrailPolicy(userId, parseResult.data);

  // Write audit log
  db.insertAuditLog({
    id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    user_id: userId,
    timestamp: new Date().toISOString(),
    actor_type: 'HUMAN_OPERATOR',
    actor_id: (req.headers['x-operator-name'] as string) || 'Authorized Security Operator',
    action: 'GUARDRAIL_POLICY_UPDATED',
    target_type: 'POLICY',
    target_id: updatedPolicy.id,
    details: parseResult.data,
    risk_level: 'WARNING',
  });

  res.json({
    success: true,
    policy: updatedPolicy,
  });
});

const ActionSchema = z.object({
  workflowId: z.string().min(1),
  action: z.enum(['APPROVE', 'REJECT']),
  justification: z.string().min(3, 'Justification note is mandatory for auditable compliance'),
  updatedPayload: z.record(z.any()).optional(),
});

// Operator action: Approve or Reject
router.post('/action', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
  const operatorName = (req.headers['x-operator-name'] as string) || 'Alex Mercer';
  const parseResult = ActionSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid action payload', details: parseResult.error.errors });
  }

  const { workflowId, action, justification, updatedPayload } = parseResult.data;

  try {
    let resultWorkflow;
    if (action === 'APPROVE') {
      resultWorkflow = guardrailEngine.approveWorkflow(
        workflowId,
        userId,
        operatorName,
        justification,
        updatedPayload
      );
    } else {
      resultWorkflow = guardrailEngine.rejectWorkflow(workflowId, userId, operatorName, justification);
    }

    const parentIncident = db.getIncidentById(resultWorkflow.incident_id);

    res.json({
      success: true,
      action,
      workflow: resultWorkflow,
      incident: parentIncident,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
