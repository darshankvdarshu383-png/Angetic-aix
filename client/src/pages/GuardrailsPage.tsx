import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { GuardrailPolicy, MitigationWorkflow } from '../types';
import { Badge } from '../components/common/Badge';
import { WorkflowActionModal } from '../components/guardrails/WorkflowActionModal';
import { useToast } from '../context/ToastContext';
import {
  ShieldAlert,
  ShieldCheck,
  Sliders,
  DollarSign,
  AlertTriangle,
  Save,
  CheckCircle2,
  XCircle,
  Zap,
  Clock,
  Bell,
  RefreshCw,
} from 'lucide-react';
import clsx from 'clsx';

export const GuardrailsPage: React.FC = () => {
  const { addToast } = useToast();

  const [policy, setPolicy] = useState<GuardrailPolicy | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [history, setHistory] = useState<MitigationWorkflow[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);

  // Policy Form State
  const [riskThreshold, setRiskThreshold] = useState(70);
  const [usdThreshold, setUsdThreshold] = useState(25000);
  const [autoExecutionEnabled, setAutoExecutionEnabled] = useState(true);
  const [mandatoryDomains, setMandatoryDomains] = useState<string[]>([]);
  const [notificationChannel, setNotificationChannel] = useState('SLACK_PAGERDUTY');

  // Modal State
  const [selectedWorkflow, setSelectedWorkflow] = useState<MitigationWorkflow | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);

  const loadGuardrailData = async () => {
    setLoading(true);
    try {
      const data = await api.guardrails.get();
      setPolicy(data.policy);
      setPendingApprovals(data.pendingApprovals);
      setHistory(data.history);
      setStats(data.stats);

      // Populate form
      setRiskThreshold(data.policy.hitl_risk_threshold);
      setUsdThreshold(data.policy.hitl_usd_threshold);
      setAutoExecutionEnabled(data.policy.auto_execution_enabled);
      setMandatoryDomains(data.policy.mandatory_hitl_domains || []);
      setNotificationChannel(data.policy.notification_channel || 'SLACK_PAGERDUTY');
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Failed to load guardrails',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGuardrailData();
  }, []);

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPolicy(true);
    try {
      const res = await api.guardrails.updatePolicy({
        hitl_risk_threshold: Number(riskThreshold),
        hitl_usd_threshold: Number(usdThreshold),
        auto_execution_enabled: autoExecutionEnabled,
        mandatory_hitl_domains: mandatoryDomains,
        notification_channel: notificationChannel,
      });
      setPolicy(res.policy);
      addToast({
        type: 'success',
        title: 'Guardrail Policies Updated',
        message: 'New risk thresholds and mandatory HITL domains applied to all live workflows.',
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Failed to update policy',
        message: err.message,
      });
    } finally {
      setSavingPolicy(false);
    }
  };

  const toggleDomain = (domain: string) => {
    setMandatoryDomains((prev) =>
      prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain]
    );
  };

  const domainOptions = [
    { id: 'FINANCIAL_LEDGER', label: 'Financial Ledger (SAP ERP / ACH Clearing)' },
    { id: 'CLOUD_INFRASTRUCTURE', label: 'Cloud Infrastructure (AWS EC2 / Auto-Scaling)' },
    { id: 'PAYMENT_GATEWAY', label: 'Payment Gateway (Stripe Customer Charges)' },
    { id: 'VENDOR_SUPPLY', label: 'Vendor Supply (NetSuite Remittance Profiles)' },
    { id: 'IDENTITY_ACCESS', label: 'Identity & Access (Auth0 Tokens & Scopes)' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2.5">
              <ShieldAlert className="w-7 h-7 text-amber-400" />
              HITL Guardrail Queue & Policy Engine
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Enforce strict human-in-the-loop sign-off on high-risk financial and infrastructure mutations.
          </p>
        </div>

        <button
          onClick={loadGuardrailData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20">
          <span className="text-[11px] font-mono uppercase text-amber-400 font-semibold block">
            Pending Authorization
          </span>
          <span className="text-2xl font-bold font-mono text-amber-300 mt-1 block">
            {stats?.pendingCount || 0} Workflows
          </span>
        </div>

        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20">
          <span className="text-[11px] font-mono uppercase text-emerald-400 font-semibold block">
            Autonomous Executed
          </span>
          <span className="text-2xl font-bold font-mono text-emerald-300 mt-1 block">
            {stats?.autoExecutedCount || 0} Safe Actions
          </span>
        </div>

        <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20">
          <span className="text-[11px] font-mono uppercase text-indigo-400 font-semibold block">
            Human Signed-Off
          </span>
          <span className="text-2xl font-bold font-mono text-indigo-300 mt-1 block">
            {stats?.humanExecutedCount || 0} Approved
          </span>
        </div>

        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20">
          <span className="text-[11px] font-mono uppercase text-rose-400 font-semibold block">
            Operator Rejected
          </span>
          <span className="text-2xl font-bold font-mono text-rose-300 mt-1 block">
            {stats?.rejectedCount || 0} Declined
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Dedicated Pending Approval Inbox */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              Pending Sign-Off Inbox ({pendingApprovals.length})
            </h3>
            <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              AUDIT LOCKED
            </span>
          </div>

          {pendingApprovals.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/40">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-90" />
              <h4 className="text-base font-bold text-slate-100">All Mitigation Queues Cleared</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No mitigation workflows are currently breaching risk or exposure thresholds.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApprovals.map((workflow) => (
                <div
                  key={workflow.id}
                  className="p-5 rounded-2xl border border-amber-500/40 bg-slate-900/90 shadow-xl backdrop-blur-md space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="domain" value={workflow.domain}>
                          {workflow.domain}
                        </Badge>
                        <Badge variant="risk" value={workflow.risk_score}>
                          Risk Score: {workflow.risk_score}/100
                        </Badge>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          ${workflow.financial_impact_usd?.toLocaleString()}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-100">{workflow.title}</h4>
                      <p className="text-xs text-slate-400">
                        Target System: <strong className="text-slate-300">{workflow.target_system}</strong> • Associated Incident: {workflow.incidentTitle}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedWorkflow(workflow);
                        setActionModalOpen(true);
                      }}
                      className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-slate-950 font-bold text-xs tracking-wide shadow-lg shadow-amber-950/40 transition-all"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Authorize or Reject</span>
                    </button>
                  </div>

                  {/* Breached Guardrail Conditions */}
                  <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-1.5 text-xs text-amber-200">
                    <span className="font-bold flex items-center gap-1.5 text-amber-400">
                      <AlertTriangle className="w-4 h-4" />
                      Threshold Breaches Escalating to HITL:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[11px] pl-1 font-mono">
                      {workflow.risk_score >= (policy?.hitl_risk_threshold || 70) && (
                        <li>
                          Risk Score {workflow.risk_score} ≥ Configured Threshold ({policy?.hitl_risk_threshold})
                        </li>
                      )}
                      {workflow.financial_impact_usd >= (policy?.hitl_usd_threshold || 25000) && (
                        <li>
                          Financial Exposure ${workflow.financial_impact_usd.toLocaleString()} ≥ Configured Limit (${policy?.hitl_usd_threshold.toLocaleString()})
                        </li>
                      )}
                      {policy?.mandatory_hitl_domains.includes(workflow.domain) && (
                        <li>
                          Domain '{workflow.domain}' flagged as Mandatory Human Authorization Zone
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Proposed Execution Payload Preview */}
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                      Execution Payload Preview:
                    </span>
                    <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-32">
                      {JSON.stringify(workflow.execution_payload, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Past Mitigation Execution History */}
          <div className="pt-6">
            <h3 className="text-base font-bold text-slate-100 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              Mitigation Action History ({history.length})
            </h3>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
              <div className="divide-y divide-slate-800/80">
                {history.slice(0, 8).map((w) => (
                  <div key={w.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="status" value={w.status}>
                          {w.status}
                        </Badge>
                        <span className="font-semibold text-slate-200">{w.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {w.audit_justification || 'Executed under policy rules'}
                      </p>
                    </div>

                    <div className="text-right shrink-0 font-mono">
                      <span className="text-emerald-400 font-bold block">
                        ${w.financial_impact_usd?.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {w.executed_at ? new Date(w.executed_at).toLocaleTimeString() : 'Logged'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Interactive Guardrail Policy Configuration Engine */}
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold tracking-wide text-slate-100">
                  Guardrail Policy Engine
                </h3>
              </div>
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                ACTIVE
              </span>
            </div>

            <form onSubmit={handleSavePolicy} className="space-y-5">
              {/* Master Auto-Execution Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    Autonomous Auto-Execution
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Allow low-risk mitigations to execute immediately
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoExecutionEnabled(!autoExecutionEnabled)}
                  className={clsx(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                    autoExecutionEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                  )}
                >
                  <span
                    className={clsx(
                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
                      autoExecutionEnabled ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>

              {/* Risk Score Threshold Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300">HITL Risk Threshold</span>
                  <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    ≥ {riskThreshold} / 100
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="95"
                  step="5"
                  value={riskThreshold}
                  onChange={(e) => setRiskThreshold(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <p className="text-[10px] text-slate-400">
                  Any mitigation with risk score at or above this value pauses in PENDING_APPROVAL.
                </p>
              </div>

              {/* Financial Impact USD Threshold */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300">Financial Exposure Ceiling</span>
                  <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    ${Number(usdThreshold).toLocaleString()}
                  </span>
                </div>
                <input
                  type="number"
                  min="1000"
                  step="5000"
                  value={usdThreshold}
                  onChange={(e) => setUsdThreshold(Number(e.target.value))}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                {/* Presets */}
                <div className="flex gap-1.5">
                  {[10000, 25000, 50000, 100000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setUsdThreshold(val)}
                      className={`px-2 py-1 rounded text-[10px] font-mono border transition-colors ${
                        usdThreshold === val
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      ${val / 1000}k
                    </button>
                  ))}
                </div>
              </div>

              {/* Mandatory Restricted Domains */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">
                  Mandatory Restricted Domains (Always Require Human Approval)
                </span>
                <div className="space-y-2">
                  {domainOptions.map((opt) => (
                    <label
                      key={opt.id}
                      className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={mandatoryDomains.includes(opt.id)}
                        onChange={() => toggleDomain(opt.id)}
                        className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                      />
                      <span className="text-xs text-slate-300">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notification Channel */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-300 block">
                  Escalation Dispatch Channel
                </span>
                <select
                  value={notificationChannel}
                  onChange={(e) => setNotificationChannel(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="SLACK_PAGERDUTY">Slack (#finops-incidents) + PagerDuty</option>
                  <option value="WEBHOOK_ENTERPRISE">Enterprise Security Webhook</option>
                  <option value="EMAIL_SECURITY_OPS">SecOps Incident Distribution List</option>
                </select>
              </div>

              {/* Save Button */}
              <button
                type="submit"
                disabled={savingPolicy}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-indigo-950/60 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Save Policy Rules (Audited)</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Workflow Action Modal */}
      <WorkflowActionModal
        workflow={selectedWorkflow}
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        onActionComplete={loadGuardrailData}
      />
    </div>
  );
};
