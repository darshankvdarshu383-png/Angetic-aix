import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Incident } from '../types';
import { Badge } from '../components/common/Badge';
import { ChaosModal } from '../components/chaos/ChaosModal';
import { useToast } from '../context/ToastContext';
import {
  AlertOctagon,
  Flame,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Layers,
  ShieldAlert,
} from 'lucide-react';

export const IncidentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [correlating, setCorrelating] = useState(false);
  const [chaosModalOpen, setChaosModalOpen] = useState(false);

  // Filters
  const [domainFilter, setDomainFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const res = await api.incidents.getAll({
        domain: domainFilter,
        severity: severityFilter,
        status: statusFilter,
      });
      setIncidents(res.incidents);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Failed to load incidents',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, [domainFilter, severityFilter, statusFilter]);

  const handleTriggerCorrelation = async () => {
    setCorrelating(true);
    try {
      const res = await api.incidents.correlate();
      if (res.incident) {
        addToast({
          type: 'success',
          title: 'Cross-DB Correlation Successful',
          message: `Gemini correlated anomalous telemetry into incident: ${res.incident.title}`,
        });
        loadIncidents();
      } else {
        addToast({
          type: 'info',
          title: 'Telemetry Correlation Normal',
          message: res.message || 'No active anomalous clusters requiring incident elevation.',
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Correlation Failed',
        message: err.message,
      });
    } finally {
      setCorrelating(false);
    }
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      inc.title.toLowerCase().includes(q) ||
      inc.description.toLowerCase().includes(q) ||
      inc.root_cause_synthesis.toLowerCase().includes(q) ||
      inc.domain.toLowerCase().includes(q)
    );
  });

  const totalExposure = filteredIncidents.reduce(
    (sum, inc) => sum + (inc.estimated_financial_impact_usd || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2.5">
              <AlertOctagon className="w-7 h-7 text-rose-500" />
              Incident Explorer & Decision Center
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Correlated cross-database operational anomalies diagnosed by Gemini 2.5 Flash with exact financial exposure.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTriggerCorrelation}
            disabled={correlating}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-950/40 disabled:opacity-50 transition-all"
          >
            <Sparkles className={`w-3.5 h-3.5 ${correlating ? 'animate-spin' : ''}`} />
            <span>Correlate Cross-DB Telemetry</span>
          </button>

          <button
            onClick={() => setChaosModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-medium text-xs shadow-md shadow-rose-950/40 transition-all"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Inject Chaos Scenario</span>
          </button>
        </div>
      </div>

      {/* Exposure Header Metric */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase text-slate-400">Total Filtered Exposure</span>
            <p className="text-2xl font-bold font-mono text-rose-400 mt-0.5">
              ${totalExposure.toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertOctagon className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase text-slate-400">Active Incidents</span>
            <p className="text-2xl font-bold font-mono text-slate-100 mt-0.5">
              {filteredIncidents.filter((i) => i.status !== 'RESOLVED').length}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase text-slate-400">Resolved Post-Mitigation</span>
            <p className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">
              {filteredIncidents.filter((i) => i.status === 'RESOLVED').length}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative min-w-[220px] flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search incidents or root causes..."
              className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Domain Filter */}
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Domains</option>
            <option value="FINANCIAL_LEDGER">Financial Ledger</option>
            <option value="CLOUD_INFRASTRUCTURE">Cloud Infrastructure</option>
            <option value="PAYMENT_GATEWAY">Payment Gateway</option>
            <option value="VENDOR_SUPPLY">Vendor Supply</option>
            <option value="IDENTITY_ACCESS">Identity & Access</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="DETECTED">Detected</option>
            <option value="MITIGATING">Mitigating</option>
            <option value="RESOLVED">Resolved</option>
            <option value="ESCALATED">Escalated</option>
          </select>
        </div>

        <button
          onClick={loadIncidents}
          className="p-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-400 hover:text-slate-200 text-xs transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Incidents Table / List */}
      <div className="space-y-4">
        {filteredIncidents.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/50">
            <AlertOctagon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-200">No Incidents Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              No active incidents match the current filters. Click "Inject Chaos Scenario" to trigger an automated cross-database failure test.
            </p>
          </div>
        ) : (
          filteredIncidents.map((inc) => (
            <div
              key={inc.id}
              onClick={() => navigate(`/incidents/${inc.id}`)}
              className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 hover:border-indigo-500/50 hover:bg-slate-900 shadow-xl backdrop-blur-md cursor-pointer transition-all duration-200 group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="domain" value={inc.domain}>
                      {inc.domain}
                    </Badge>
                    <Badge variant="severity" value={inc.severity}>
                      {inc.severity}
                    </Badge>
                    <Badge variant="status" value={inc.status}>
                      {inc.status}
                    </Badge>
                    <span className="text-[11px] font-mono text-slate-500">
                      ID: {inc.id} • {new Date(inc.created_at).toLocaleString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                    {inc.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
                    {inc.description}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
                    <span>
                      Correlated Records:{' '}
                      <strong className="text-indigo-400">
                        {inc.correlated_record_ids?.length || 0}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Mitigation Workflows:{' '}
                      <strong className="text-emerald-400">
                        {inc.mitigations?.length || 0}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Right Exposure Metric & Action CTA */}
                <div className="flex sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800 shrink-0">
                  <div className="lg:text-right">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                      Estimated Financial Exposure
                    </span>
                    <span className="text-xl sm:text-2xl font-bold font-mono text-rose-400">
                      ${inc.estimated_financial_impact_usd?.toLocaleString()}
                    </span>
                    <div className="mt-1 flex items-center lg:justify-end gap-1.5">
                      <span className="text-xs font-mono text-slate-400">Risk Score:</span>
                      <Badge variant="risk" value={inc.risk_score}>
                        {inc.risk_score}/100
                      </Badge>
                    </div>
                  </div>

                  <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white text-xs font-medium border border-slate-700 hover:border-indigo-500 transition-all">
                    <span>Decision Room</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Chaos Injection Modal */}
      <ChaosModal
        isOpen={chaosModalOpen}
        onClose={() => setChaosModalOpen(false)}
        onChaosInjected={loadIncidents}
      />
    </div>
  );
};
