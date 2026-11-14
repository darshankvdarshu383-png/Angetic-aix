import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { FragmentedDataRecord, SiloSource } from '../types';
import { Badge } from '../components/common/Badge';
import { useToast } from '../context/ToastContext';
import {
  Layers,
  Search,
  AlertTriangle,
  Database,
  Code,
  DollarSign,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import clsx from 'clsx';

export const DataSourcesPage: React.FC = () => {
  const { addToast } = useToast();

  const [records, setRecords] = useState<FragmentedDataRecord[]>([]);
  const [siloSummaries, setSiloSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [activeSiloTab, setActiveSiloTab] = useState<string>('ALL');
  const [anomalyOnly, setAnomalyOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [recordsRes, silosRes] = await Promise.all([
        api.dataSources.getRecords({
          silo: activeSiloTab === 'ALL' ? undefined : activeSiloTab,
          anomalyOnly,
          search: searchQuery || undefined,
        }),
        api.dataSources.getSilos(),
      ]);

      setRecords(recordsRes.records);
      setSiloSummaries(silosRes.silos);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error loading data silos',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeSiloTab, anomalyOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const silosList = [
    { id: 'ALL', label: 'All Silos' },
    { id: 'SAP_ERP_LEDGER', label: 'SAP ERP Ledger' },
    { id: 'AWS_COST_EXPLORER', label: 'AWS Cost Explorer' },
    { id: 'STRIPE_BILLING', label: 'Stripe Billing' },
    { id: 'NETSUITE_VENDORS', label: 'NetSuite Vendors' },
    { id: 'AUTH0_SECURITY_LOGS', label: 'Auth0 Security' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2.5">
              <Layers className="w-7 h-7 text-indigo-400" />
              Fragmented Enterprise Data Hub
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Live multi-silo database inspector simulating enterprise ERP, Cloud FinOps, Billing, and IAM access logs.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Mesh</span>
        </button>
      </div>

      {/* Silos Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {siloSummaries.map((silo) => {
          const hasAnomalies = silo.anomaliesCount > 0;

          return (
            <div
              key={silo.silo}
              onClick={() => setActiveSiloTab(silo.silo)}
              className={clsx(
                'p-4 rounded-xl border cursor-pointer transition-all duration-200',
                activeSiloTab === silo.silo
                  ? 'border-indigo-500 bg-indigo-950/20 shadow-md shadow-indigo-950/30'
                  : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <Badge variant="silo" value={silo.silo} size="xs">
                  {silo.silo.replace('_', ' ')}
                </Badge>
                {hasAnomalies ? (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </div>

              <div className="flex items-baseline justify-between mt-2">
                <span className="text-lg font-bold font-mono text-slate-100">
                  {silo.totalRecords} Rows
                </span>
                {silo.totalUsd > 0 && (
                  <span className="text-xs font-mono text-slate-400">
                    ${(silo.totalUsd / 1000).toFixed(0)}k
                  </span>
                )}
              </div>

              <div className="mt-1 flex items-center justify-between text-[11px] font-mono">
                <span className={hasAnomalies ? 'text-rose-400 font-bold' : 'text-slate-500'}>
                  {silo.anomaliesCount} Anomaly Flags
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter and Tab Bar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md space-y-3">
        {/* Silo Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
          {silosList.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveSiloTab(t.id)}
              className={clsx(
                'px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all',
                activeSiloTab === t.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search & Anomaly Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, entity, reason, or status..."
              className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </form>

          <label className="flex items-center gap-2 cursor-pointer self-start sm:self-auto">
            <input
              type="checkbox"
              checked={anomalyOnly}
              onChange={(e) => setAnomalyOnly(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-rose-600 focus:ring-0"
            />
            <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Show Flagged Anomalies Only
            </span>
          </label>
        </div>
      </div>

      {/* Records Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Silo Source</th>
                <th className="py-3 px-4">Record ID</th>
                <th className="py-3 px-4">Entity / Service</th>
                <th className="py-3 px-4">Amount USD</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Anomaly Flag</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                    No records found matching current silo and anomaly filters.
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const isExpanded = expandedRecordId === r.id;

                  return (
                    <React.Fragment key={r.id}>
                      <tr
                        onClick={() => setExpandedRecordId(isExpanded ? null : r.id)}
                        className={clsx(
                          'cursor-pointer hover:bg-slate-850/80 transition-colors',
                          r.is_anomaly && 'bg-rose-950/10'
                        )}
                      >
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge variant="silo" value={r.silo_source} size="xs">
                            {r.silo_source.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-200 whitespace-nowrap">
                          {r.external_record_id}
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-300 font-medium whitespace-nowrap">
                          {r.entity_name}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {r.amount_usd > 0 ? (
                            <span className="font-bold text-rose-400">
                              ${r.amount_usd.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {r.is_anomaly ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                              <AlertTriangle className="w-3 h-3 text-rose-400" />
                              ANOMALY
                            </span>
                          ) : (
                            <span className="text-slate-600 text-[10px]">NORMAL</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                          {new Date(r.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Row Details */}
                      {isExpanded && (
                        <tr className="bg-slate-950/90">
                          <td colSpan={8} className="p-4 border-y border-slate-800">
                            <div className="space-y-3 font-sans">
                              {r.is_anomaly && (
                                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-300">
                                  <strong>Anomaly Telemetry Analysis:</strong> {r.anomaly_reason}
                                </div>
                              )}

                              <div>
                                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                                  Raw JSON Payload (PostgreSQL jsonb / Supabase schema):
                                </span>
                                <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-48">
                                  {JSON.stringify(r.raw_payload, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
