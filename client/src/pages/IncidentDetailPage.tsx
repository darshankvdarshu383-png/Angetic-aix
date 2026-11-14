import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Incident, MitigationWorkflow, FragmentedDataRecord } from '../types';
import { Badge } from '../components/common/Badge';
import { WorkflowActionModal } from '../components/guardrails/WorkflowActionModal';
import { useToast } from '../context/ToastContext';
import {
  ArrowLeft,
  AlertOctagon,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Database,
  Code,
  RotateCcw,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Zap,
} from 'lucide-react';
import clsx from 'clsx';

export const IncidentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [incident, setIncident] = useState<(Incident & { mitigations: MitigationWorkflow[] }) | null>(null);
  const [correlatedRecords, setCorrelatedRecords] = useState<FragmentedDataRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<MitigationWorkflow | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  const loadIncidentData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.incidents.getById(id);
      setIncident(res.incident);
      setCorrelatedRecords(res.correlatedRecords || []);
      if (res.correlatedRecords?.length > 0) {
        setExpandedRecordId(res.correlatedRecords[0].id);
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error Loading Incident',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidentData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span className="text-xs font-mono text-slate-400">Loading Incident Decision Room...</span>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="p-8 text-center rounded-2xl border border-slate-800 bg-slate-900/50">
        <AlertOctagon className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-100">Incident Not Found</h2>
        <p className="text-xs text-slate-400 mt-1">The requested incident ID does not exist in your workspace.</p>
        <button
          onClick={() => navigate('/incidents')}
          className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
        >
          Return to Incident Explorer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/incidents')}
          className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-100 hover:border-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono text-slate-400">
          Incidents / <strong className="text-slate-200">{incident.id}</strong>
        </span>
      </div>

      {/* Hero Decision Room Header Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant="domain" value={incident.domain}>
                {incident.domain}
              </Badge>
              <Badge variant="severity" value={incident.severity}>
                {incident.severity}
              </Badge>
              <Badge variant="status" value={incident.status}>
                {incident.status}
              </Badge>
              <span className="text-xs font-mono text-slate-500">
                Created: {new Date(incident.created_at).toLocaleString()}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">
              {incident.title}
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed max-w-4xl">
              {incident.description}
            </p>
          </div>

          {/* Metric Stats Right */}
          <div className="flex sm:flex-row lg:flex-col gap-4 lg:text-right shrink-0 p-4 rounded-xl border border-slate-800 bg-slate-950/60">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                Estimated Exposure USD
              </span>
              <span className="text-2xl sm:text-3xl font-bold font-mono text-rose-400">
                ${incident.estimated_financial_impact_usd?.toLocaleString()}
              </span>
            </div>

            <div className="pt-2 sm:pt-0 lg:pt-2 sm:border-l lg:border-l-0 lg:border-t border-slate-800 pl-4 sm:pl-4 lg:pl-0">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                Composite Risk Score
              </span>
              <div className="flex items-center lg:justify-end gap-2 mt-1">
                <Badge variant="risk" value={incident.risk_score} size="md">
                  {incident.risk_score} / 100
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gemini Root-Cause Synthesis Card */}
      <div className="p-6 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between pb-3 border-b border-indigo-500/20 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            <h3 className="text-sm font-bold tracking-wide text-indigo-300">
              Autonomous Root-Cause Synthesis (Gemini 2.5 Flash)
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
            CROSS-DB CORRELATION ENGINE
          </span>
        </div>

        <p className="text-sm text-slate-200 leading-relaxed font-sans">
          {incident.root_cause_synthesis}
        </p>

        <div className="mt-4 pt-3 border-t border-indigo-500/10 flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Correlated Entity Records:</span>
          {incident.correlated_record_ids.map((recId) => (
            <span
              key={recId}
              onClick={() => setExpandedRecordId(recId)}
              className="cursor-pointer px-2 py-0.5 rounded-md text-xs font-mono bg-slate-900 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-950 transition-colors"
            >
              [{recId}]
            </span>
          ))}
        </div>
      </div>

      {/* Two Columns: Proposed Mitigations & Correlated Data Silos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Col: Proposed Mitigation Workflows (Actionable HITL Gate) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              Proposed Mitigation Workflows ({incident.mitigations?.length || 0})
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Deterministic Guardrail Gated
            </span>
          </div>

          <div className="space-y-4">
            {(incident.mitigations || []).map((workflow) => {
              const isPending = workflow.status === 'PENDING_APPROVAL';
              const isAuto = workflow.status === 'AUTO_EXECUTED';

              return (
                <div
                  key={workflow.id}
                  className={clsx(
                    'p-5 rounded-2xl border shadow-xl backdrop-blur-md transition-all space-y-4',
                    isPending
                      ? 'border-amber-500/50 bg-amber-950/10'
                      : isAuto
                      ? 'border-emerald-500/40 bg-emerald-950/10'
                      : 'border-slate-800 bg-slate-900/80'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="status" value={workflow.status}>
                          {workflow.status}
                        </Badge>
                        <span className="text-xs font-mono text-slate-400">
                          {workflow.domain}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-100">{workflow.title}</h4>
                      <p className="text-xs font-mono text-slate-400">
                        Target System: <strong className="text-slate-300">{workflow.target_system}</strong>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono text-rose-400 font-bold block">
                        Risk: {workflow.risk_score}
                      </span>
                      <span className="text-xs font-mono text-emerald-400">
                        ${workflow.financial_impact_usd?.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Audit Justification */}
                  {workflow.audit_justification && (
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300">
                      <span className="text-[10px] font-mono uppercase text-slate-500 block mb-0.5">
                        Audit Justification / Execution Policy:
                      </span>
                      {workflow.audit_justification}
                    </div>
                  )}

                  {/* Execution JSON Payload Accordion */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Code className="w-3 h-3 text-indigo-400" />
                      Execution Payload:
                    </span>
                    <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-36">
                      {JSON.stringify(workflow.execution_payload, null, 2)}
                    </pre>
                  </div>

                  {/* Rollback Safety Plan */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <RotateCcw className="w-3 h-3 text-cyan-400" />
                      Rollback Plan:
                    </span>
                    <pre className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] font-mono text-slate-400 overflow-x-auto max-h-24">
                      {JSON.stringify(workflow.rollback_plan, null, 2)}
                    </pre>
                  </div>

                  {/* Inline Action Controls if PENDING_APPROVAL */}
                  {isPending && (
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-xs text-amber-400 font-medium flex items-center gap-1.5">
                        <AlertOctagon className="w-4 h-4" />
                        Human Operator Authorization Required
                      </span>

                      <button
                        onClick={() => {
                          setSelectedWorkflow(workflow);
                          setActionModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-950/40 transition-all"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Sign-Off / Reject Workflow</span>
                      </button>
                    </div>
                  )}

                  {workflow.status === 'EXECUTED' && (
                    <div className="pt-2 text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4" />
                      Executed by: {workflow.approved_by} at{' '}
                      {workflow.executed_at ? new Date(workflow.executed_at).toLocaleTimeString() : 'N/A'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Correlated Cross-Silo Telemetry Records */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" />
              Correlated Multi-Silo Database Records ({correlatedRecords.length})
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Live Database Row Grounding
            </span>
          </div>

          <div className="space-y-3">
            {correlatedRecords.map((rec) => {
              const isExpanded = expandedRecordId === rec.id;

              return (
                <div
                  key={rec.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg overflow-hidden transition-all"
                >
                  <div
                    onClick={() => setExpandedRecordId(isExpanded ? null : rec.id)}
                    className="p-4 cursor-pointer hover:bg-slate-850 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="silo" value={rec.silo_source}>
                        {rec.silo_source}
                      </Badge>
                      <div>
                        <h5 className="text-xs font-bold text-slate-200">
                          {rec.entity_name}
                        </h5>
                        <p className="text-[10px] font-mono text-slate-400">
                          Record ID: {rec.external_record_id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {rec.amount_usd > 0 && (
                        <span className="text-xs font-mono font-bold text-rose-400">
                          ${rec.amount_usd.toLocaleString()}
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Body */}
                  {isExpanded && (
                    <div className="p-4 pt-0 border-t border-slate-800/80 space-y-3 mt-2">
                      {rec.is_anomaly && (
                        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 leading-relaxed">
                          <span className="font-bold block mb-0.5">Anomaly Telemetry Diagnosis:</span>
                          {rec.anomaly_reason}
                        </div>
                      )}

                      <div>
                        <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                          Full Database JSON Payload (Supabase):
                        </span>
                        <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-56">
                          {JSON.stringify(rec.raw_payload, null, 2)}
                        </pre>
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                        <span>Timestamp: {new Date(rec.timestamp).toLocaleString()}</span>
                        <span>Internal ID: {rec.id}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* HITL Action Modal */}
      <WorkflowActionModal
        workflow={selectedWorkflow}
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        onActionComplete={loadIncidentData}
      />
    </div>
  );
};
