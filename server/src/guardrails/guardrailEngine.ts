import { db } from '../db/database.js';
import { MitigationWorkflow, GuardrailPolicy, AuditLog, Incident } from '../db/schema.js';

export interface GuardrailEvaluationResult {
  decision: 'AUTO_EXECUTE' | 'REQUIRE_HITL';
  breached_reasons: string[];
  workflow: MitigationWorkflow;
}

export class GuardrailEngine {
  /**
   * Deterministic evaluation of a proposed workflow against user guardrail policies
   */
  public evaluateAndRouteWorkflow(
    workflow: MitigationWorkflow,
    policy: GuardrailPolicy,
    incident: Incident
  ): GuardrailEvaluationResult {
    const breachedReasons: string[] = [];

    // 1. Check auto-execution global master switch
    if (!policy.auto_execution_enabled) {
      breachedReasons.push('Global autonomous auto-execution switch is DISABLED');
    }

    // 2. Risk Score check
    if (workflow.risk_score >= policy.hitl_risk_threshold) {
      breachedReasons.push(
        `Risk Score ${workflow.risk_score} reaches or exceeds HITL threshold (${policy.hitl_risk_threshold})`
      );
    }

    // 3. Financial Exposure check
    if (workflow.financial_impact_usd >= policy.hitl_usd_threshold) {
      breachedReasons.push(
        `Financial Impact $${workflow.financial_impact_usd.toLocaleString()} reaches or exceeds USD threshold ($${policy.hitl_usd_threshold.toLocaleString()})`
      );
    }

    // 4. Mandatory HITL Domain check
    if (policy.mandatory_hitl_domains.includes(workflow.domain)) {
      breachedReasons.push(
        `Domain '${workflow.domain}' is classified as a MANDATORY Human-in-the-Loop restricted zone`
      );
    }

    if (breachedReasons.length === 0 && policy.auto_execution_enabled) {
      // Auto-Execution Tier
      workflow.status = 'AUTO_EXECUTED';
      workflow.approved_by = 'AUTONOMOUS_POLICY_GUARDRAIL_ENGINE';
      workflow.executed_at = new Date().toISOString();
      workflow.audit_justification = `Auto-executed deterministically. Risk Score ${workflow.risk_score} < ${policy.hitl_risk_threshold}, Exposure $${workflow.financial_impact_usd} < $${policy.hitl_usd_threshold}, domain permitted.`;

      db.insertMitigationWorkflow(workflow);

      // Create Audit Log
      const auditLog: AuditLog = {
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        user_id: workflow.user_id,
        timestamp: new Date().toISOString(),
        actor_type: 'AUTONOMOUS_AGENT',
        actor_id: 'AegisFlow Policy Enforcer',
        action: 'WORKFLOW_AUTO_EXECUTED',
        target_type: 'WORKFLOW',
        target_id: workflow.id,
        details: {
          title: workflow.title,
          action_type: workflow.action_type,
          target_system: workflow.target_system,
          risk_score: workflow.risk_score,
          financial_impact_usd: workflow.financial_impact_usd,
          execution_payload: workflow.execution_payload,
        },
        risk_level: 'INFO',
      };
      db.insertAuditLog(auditLog);

      return {
        decision: 'AUTO_EXECUTE',
        breached_reasons: [],
        workflow,
      };
    } else {
      // HITL Escalation Tier
      workflow.status = 'PENDING_APPROVAL';
      db.insertMitigationWorkflow(workflow);

      // Create Audit Log for Escalation
      const auditLog: AuditLog = {
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        user_id: workflow.user_id,
        timestamp: new Date().toISOString(),
        actor_type: 'SYSTEM_POLICY',
        actor_id: 'Guardrail Policy Engine',
        action: 'WORKFLOW_ESCALATED_HITL',
        target_type: 'WORKFLOW',
        target_id: workflow.id,
        details: {
          title: workflow.title,
          action_type: workflow.action_type,
          breached_reasons: breachedReasons,
          risk_score: workflow.risk_score,
          financial_impact_usd: workflow.financial_impact_usd,
        },
        risk_level: 'CRITICAL',
      };
      db.insertAuditLog(auditLog);

      return {
        decision: 'REQUIRE_HITL',
        breached_reasons: breachedReasons,
        workflow,
      };
    }
  }

  /**
   * Human operator approves a pending mitigation workflow
   */
  public approveWorkflow(
    workflowId: string,
    operatorUserId: string,
    operatorName: string,
    justification: string,
    updatedPayload?: Record<string, unknown>
  ): MitigationWorkflow {
    const workflow = db.getMitigationById(workflowId);
    if (!workflow) {
      throw new Error(`Mitigation workflow ${workflowId} not found`);
    }

    if (workflow.status !== 'PENDING_APPROVAL') {
      throw new Error(`Workflow is not in PENDING_APPROVAL state (current: ${workflow.status})`);
    }

    const payload = updatedPayload || workflow.execution_payload;

    const updated = db.updateMitigationWorkflow(workflowId, {
      status: 'EXECUTED',
      approved_by: `${operatorName} (${operatorUserId})`,
      audit_justification: justification,
      execution_payload: payload,
      executed_at: new Date().toISOString(),
    });

    if (!updated) {
      throw new Error('Failed to update workflow');
    }

    // Log human operator authorization
    const auditLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: operatorUserId,
      timestamp: new Date().toISOString(),
      actor_type: 'HUMAN_OPERATOR',
      actor_id: operatorName,
      action: 'WORKFLOW_APPROVED_AND_EXECUTED',
      target_type: 'WORKFLOW',
      target_id: workflow.id,
      details: {
        title: workflow.title,
        action_type: workflow.action_type,
        justification,
        modified_payload: !!updatedPayload,
        execution_payload: payload,
      },
      risk_level: 'WARNING',
    };
    db.insertAuditLog(auditLog);

    // Check incident status: if all mitigations executed, resolve or mitigate incident
    const inc = db.getIncidentById(workflow.incident_id);
    if (inc) {
      const remainingPending = inc.mitigations.filter((m) => m.id !== workflowId && m.status === 'PENDING_APPROVAL');
      if (remainingPending.length === 0) {
        db.updateIncident(inc.id, { status: 'RESOLVED' });
        db.insertAuditLog({
          id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          user_id: operatorUserId,
          timestamp: new Date().toISOString(),
          actor_type: 'SYSTEM_POLICY',
          actor_id: 'Incident Lifecycle Manager',
          action: 'INCIDENT_RESOLVED',
          target_type: 'INCIDENT',
          target_id: inc.id,
          details: {
            title: inc.title,
            reason: 'All mitigation workflows successfully executed and validated.',
          },
          risk_level: 'INFO',
        });
      } else {
        db.updateIncident(inc.id, { status: 'MITIGATING' });
      }
    }

    return updated;
  }

  /**
   * Human operator rejects a pending mitigation workflow
   */
  public rejectWorkflow(
    workflowId: string,
    operatorUserId: string,
    operatorName: string,
    justification: string
  ): MitigationWorkflow {
    const workflow = db.getMitigationById(workflowId);
    if (!workflow) {
      throw new Error(`Mitigation workflow ${workflowId} not found`);
    }

    const updated = db.updateMitigationWorkflow(workflowId, {
      status: 'REJECTED',
      approved_by: `${operatorName} (REJECTED)`,
      audit_justification: justification,
    });

    if (!updated) {
      throw new Error('Failed to update workflow');
    }

    // Log human operator rejection
    const auditLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: operatorUserId,
      timestamp: new Date().toISOString(),
      actor_type: 'HUMAN_OPERATOR',
      actor_id: operatorName,
      action: 'WORKFLOW_REJECTED',
      target_type: 'WORKFLOW',
      target_id: workflow.id,
      details: {
        title: workflow.title,
        action_type: workflow.action_type,
        justification,
      },
      risk_level: 'WARNING',
    };
    db.insertAuditLog(auditLog);

    return updated;
  }
}

export const guardrailEngine = new GuardrailEngine();
