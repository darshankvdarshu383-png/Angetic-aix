import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { MitigationWorkflow } from '../../types';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, FileEdit, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

interface WorkflowActionModalProps {
  workflow: MitigationWorkflow | null;
  isOpen: boolean;
  onClose: () => void;
  onActionComplete: () => void;
}

export const WorkflowActionModal: React.FC<WorkflowActionModalProps> = ({
  workflow,
  isOpen,
  onClose,
  onActionComplete,
}) => {
  const { addToast } = useToast();
  const [action, setAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [justification, setJustification] = useState(
    'Authorized after verifying incident scope, emergency change criteria, and rollback contingencies.'
  );
  const [payloadText, setPayloadText] = useState('');
  const [payloadError, setPayloadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (workflow) {
      setPayloadText(JSON.stringify(workflow.execution_payload, null, 2));
      setPayloadError(null);
    }
  }, [workflow]);

  if (!workflow) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim()) {
      addToast({
        type: 'error',
        title: 'Audit Justification Required',
        message: 'Enterprise compliance regulations require an audit note for all Human-in-the-Loop decisions.',
      });
      return;
    }

    let parsedPayload: any = undefined;
    if (action === 'APPROVE') {
      try {
        parsedPayload = JSON.parse(payloadText);
      } catch (err: any) {
        setPayloadError('Invalid JSON format in execution payload');
        return;
      }
    }

    setSubmitting(true);
    try {
      await api.guardrails.takeAction({
        workflowId: workflow.id,
        action,
        justification,
        updatedPayload: parsedPayload,
      });

      addToast({
        type: action === 'APPROVE' ? 'success' : 'warning',
        title: action === 'APPROVE' ? 'Workflow Authorized & Executed' : 'Workflow Rejected',
        message: `${workflow.title} has been ${action === 'APPROVE' ? 'executed against ' + workflow.target_system : 'declined and logged in audit trail'}.`,
      });

      onActionComplete();
      onClose();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Action Failed',
        message: err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Human-in-the-Loop (HITL) Authorization Gate"
      subtitle={`Workflow ID: ${workflow.id} • Target System: ${workflow.target_system}`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Workflow Summary Header */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-mono uppercase text-indigo-400">
                {workflow.domain} • {workflow.action_type}
              </span>
              <h4 className="text-base font-bold text-slate-100 mt-1">{workflow.title}</h4>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-mono font-bold text-rose-400 block">
                Risk Score: {workflow.risk_score}/100
              </span>
              <span className="text-xs font-mono text-emerald-400">
                Impact: ${workflow.financial_impact_usd.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Toggle: Approve vs Reject */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Operator Decision
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAction('APPROVE')}
              className={clsx(
                'flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all',
                action === 'APPROVE'
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-950/30'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              )}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>APPROVE & EXECUTE</span>
            </button>
            <button
              type="button"
              onClick={() => setAction('REJECT')}
              className={clsx(
                'flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all',
                action === 'REJECT'
                  ? 'bg-rose-950/60 border-rose-500 text-rose-300 shadow-lg shadow-rose-950/30'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              )}
            >
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>REJECT WORKFLOW</span>
            </button>
          </div>
        </div>

        {/* Mandatory Justification Note */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
            <span>Audit Justification Note (Mandatory)</span>
            <span className="text-[10px] text-amber-400 font-mono">Immutable Compliance Log</span>
          </label>
          <textarea
            required
            rows={2}
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="State rationale for authorization or rejection..."
            className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
          />
        </div>

        {/* Execution Payload Editor (Editable if Approving) */}
        {action === 'APPROVE' && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileEdit className="w-3.5 h-3.5 text-indigo-400" />
                <span>Execution JSON Payload (Operator Modifiable)</span>
              </label>
              <span className="text-[10px] font-mono text-slate-500">JSON</span>
            </div>
            <textarea
              rows={5}
              value={payloadText}
              onChange={(e) => {
                setPayloadText(e.target.value);
                setPayloadError(null);
              }}
              className={clsx(
                'w-full rounded-xl bg-slate-950 border p-3 font-mono text-xs leading-relaxed focus:outline-none',
                payloadError ? 'border-rose-500 text-rose-300' : 'border-slate-800 text-slate-300 focus:border-indigo-500'
              )}
            />
            {payloadError && (
              <p className="text-xs text-rose-400 mt-1 font-mono flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {payloadError}
              </p>
            )}
          </div>
        )}

        {/* Rollback Plan Card (Read-only reference) */}
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 block">
            Rollback Safety Plan Contingency:
          </span>
          <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-[11px] text-slate-400 overflow-x-auto">
            {JSON.stringify(workflow.rollback_plan, null, 2)}
          </pre>
        </div>

        {/* Submit Actions */}
        <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-slate-100 text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={clsx(
              'flex items-center gap-2 px-5 py-2 rounded-xl text-white font-medium text-xs shadow-lg transition-all disabled:opacity-50',
              action === 'APPROVE'
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/40'
            )}
          >
            {action === 'APPROVE' ? (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Confirm Sign-Off & Execute</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4" />
                <span>Reject & Halt Workflow</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
