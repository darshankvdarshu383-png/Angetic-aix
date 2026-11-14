import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { api } from '../api/client';
import { DashboardStats, MitigationWorkflow } from '../types';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { WorkflowActionModal } from '../components/guardrails/WorkflowActionModal';
import {
  DollarSign,
  AlertTriangle,
  ShieldAlert,
  Zap,
  ArrowRight,
  TrendingUp,
  Cpu,
  RefreshCw,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const context = useOutletContext<{ refreshStats: () => void; stats: DashboardStats | null }>();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(context?.stats || null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<MitigationWorkflow | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await api.dashboard.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (context?.stats) {
      setStats(context.stats);
    } else {
      loadDashboard();
    }
  }, [context?.stats]);

  const handleOpenActionModal = (workflow: any) => {
    setSelectedWorkflow(workflow);
    setActionModalOpen(true);
  };

  const domainColors: Record<string, string> = {
    FINANCIAL_LEDGER: '#10b981',
    CLOUD_INFRASTRUCTURE: '#06b6d4',
    PAYMENT_GATEWAY: '#a855f7',
    VENDOR_SUPPLY: '#f59e0b',
    IDENTITY_ACCESS: '#f43f5e',
  };

  const chartData = (stats?.domainBreakdown || []).map((d) => ({
    name: d.domain.replace('_', ' '),
    rawDomain: d.domain,
    exposureUsd: d.exposureUsd,
    count: d.count,
    maxRisk: d.maxRisk,
  }));

  return (
    <div className="space-y-6">
      {/* Page Title & Autonomous Telemetry Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">
              Executive Command Center
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE TELEMETRY
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time cross-database risk correlation, autonomous incident mitigations & HITL authorization queue.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadDashboard}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Cash at Risk (USD)"
          value={`$${(stats?.kpis.totalFinancialExposureUsd || 0).toLocaleString()}`}
          subtext="Active unmitigated exposure"
          icon={<DollarSign className="w-5 h-5" />}
          glowVariant="rose"
          trend={{ value: 'Real-time', isPositive: false, label: 'Cross-DB calculated' }}
          onClick={() => navigate('/finance-assistant')}
        />

        <StatCard
          title="Active Critical Incidents"
          value={stats?.kpis.activeIncidentsCount || 0}
          subtext="Correlated cross-silo anomalies"
          icon={<AlertTriangle className="w-5 h-5" />}
          glowVariant="amber"
          trend={{ value: 'Actionable', isPositive: false, label: 'Gemini 2.5 Flash' }}
          onClick={() => navigate('/incidents')}
        />

        <StatCard
          title="Pending HITL Approvals"
          value={stats?.kpis.pendingApprovalsCount || 0}
          subtext="Requiring operator sign-off"
          icon={<ShieldAlert className="w-5 h-5" />}
          glowVariant="indigo"
          trend={{ value: 'Urgent', isPositive: false, label: 'Guardrail gated' }}
          onClick={() => navigate('/guardrails')}
        />

        <StatCard
          title="Autonomous Mitigation Rate"
          value={`${stats?.kpis.autonomousMitigationRate || 80}%`}
          subtext="Low-risk containment tier"
          icon={<Zap className="w-5 h-5" />}
          glowVariant="emerald"
          trend={{ value: 'Optimal', isPositive: true, label: 'Target: >75%' }}
        />
      </div>

      {/* Main Grid: Domain Risk Breakdown & Urgent HITL Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Domain Risk Breakdown Chart & Urgent Approvals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Domain Breakdown Chart Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
              <div>
                <h3 className="text-sm font-bold tracking-wide text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  Financial Exposure by Domain ($ USD)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Multi-silo financial risk distribution aggregated across active incidents.
                </p>
              </div>
              <button
                onClick={() => navigate('/finance-assistant')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                <span>CFO Stress Model</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0b1120',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Exposure USD']}
                  />
                  <Bar dataKey="exposureUsd" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={domainColors[entry.rawDomain] || '#6366f1'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Urgent HITL Queue Preview Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
              <div>
                <h3 className="text-sm font-bold tracking-wide text-slate-100 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  Urgent Human-in-the-Loop (HITL) Queue
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  High-stakes mitigation actions halted by system policies awaiting explicit operator authorization.
                </p>
              </div>
              <button
                onClick={() => navigate('/guardrails')}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
              >
                <span>View All ({stats?.kpis.pendingApprovalsCount || 0})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {(stats?.urgentQueue || []).length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-semibold text-slate-200">Guardrail Queue Empty</p>
                <p className="text-xs text-slate-500 mt-1">
                  All automated containment policies are executing within safe baseline tolerances.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats?.urgentQueue.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-slate-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="domain" value={item.domain}>
                          {item.domain}
                        </Badge>
                        <Badge variant="risk" value={item.risk_score}>
                          Risk: {item.risk_score}
                        </Badge>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          ${item.financial_impact_usd?.toLocaleString()}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-100">{item.title}</h4>
                      <p className="text-xs text-slate-400">
                        Target System: <strong className="text-slate-300">{item.target_system}</strong> • Linked to: {item.incidentTitle}
                      </p>
                    </div>

                    <button
                      onClick={() => handleOpenActionModal(item)}
                      className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs tracking-wide shadow-md shadow-amber-950/40 transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Review & Authorize</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Live Autonomous Audit Stream */}
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
              <div>
                <h3 className="text-sm font-bold tracking-wide text-slate-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  Autonomous Audit Stream
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Immutable chronological agent actions.
                </p>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                LIVE
              </span>
            </div>

            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
              {(stats?.auditStream || []).map((log) => {
                const actorBadge = {
                  AUTONOMOUS_AGENT: 'bg-indigo-950 text-indigo-300 border-indigo-500/40',
                  SYSTEM_POLICY: 'bg-rose-950 text-rose-300 border-rose-500/40',
                  HUMAN_OPERATOR: 'bg-emerald-950 text-emerald-300 border-emerald-500/40',
                }[log.actor_type] || 'bg-slate-800 text-slate-300';

                return (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${actorBadge}`}>
                        {log.actor_type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] font-mono text-indigo-400">
                        {log.target_type}: {log.target_id.slice(0, 14)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      {typeof log.details === 'object'
                        ? log.details.reason || log.details.title || log.details.anomaly || JSON.stringify(log.details)
                        : String(log.details)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Action Modal */}
      <WorkflowActionModal
        workflow={selectedWorkflow}
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        onActionComplete={() => {
          loadDashboard();
          if (context?.refreshStats) context.refreshStats();
        }}
      />
    </div>
  );
};
