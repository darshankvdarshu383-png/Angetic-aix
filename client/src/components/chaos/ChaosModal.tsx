import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { SiloSource } from '../../types';
import {
  Flame,
  AlertTriangle,
  Play,
  FileCode,
  DollarSign,
  Cpu,
  CreditCard,
  KeyRound,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import clsx from 'clsx';

interface ChaosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChaosInjected?: () => void;
}

export const ChaosModal: React.FC<ChaosModalProps> = ({
  isOpen,
  onClose,
  onChaosInjected,
}) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [presets, setPresets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [injectionResult, setInjectionResult] = useState<any | null>(null);

  // Custom Telemetry Form State
  const [siloSource, setSiloSource] = useState<SiloSource>('SAP_ERP_LEDGER');
  const [entityName, setEntityName] = useState('Apex Global Logistics BV');
  const [amountUsd, setAmountUsd] = useState(85000);
  const [anomalyReason, setAnomalyReason] = useState(
    'Discrepant dual-settlement wire batch submitted with non-matching clearing ledger hash.'
  );

  useEffect(() => {
    if (isOpen) {
      setInjectionResult(null);
      api.chaos
        .getPresets()
        .then((res) => setPresets(res.presets))
        .catch(console.error);
    }
  }, [isOpen]);

  const handleInjectPreset = async (presetId: string) => {
    setLoading(true);
    setInjectionResult(null);
    try {
      const res = await api.chaos.inject({ presetId });
      setInjectionResult(res);
      addToast({
        type: 'critical',
        title: 'Chaos Scenario Activated',
        message: `Correlated ${res.injectedRecordsCount} multi-silo records. Incident detected with risk score ${res.incident?.risk_score || 88}.`,
      });
      if (onChaosInjected) onChaosInjected();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Chaos Injection Failed',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInjectCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setInjectionResult(null);
    try {
      const res = await api.chaos.inject({
        customTelemetry: {
          silo_source: siloSource,
          entity_name: entityName,
          amount_usd: Number(amountUsd),
          anomaly_reason: anomalyReason,
        },
      });
      setInjectionResult(res);
      addToast({
        type: 'warning',
        title: 'Custom Anomaly Injected',
        message: `Cross-DB Correlation Engine evaluated anomaly telemetry.`,
      });
      if (onChaosInjected) onChaosInjected();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Telemetry Submission Failed',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const getPresetIcon = (id: string) => {
    if (id.includes('wire')) return <DollarSign className="w-5 h-5 text-emerald-400" />;
    if (id.includes('gpu')) return <Cpu className="w-5 h-5 text-amber-400" />;
    if (id.includes('stripe')) return <CreditCard className="w-5 h-5 text-indigo-400" />;
    return <KeyRound className="w-5 h-5 text-rose-400" />;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chaos Telemetry Injector & Anomaly Lab"
      subtitle="Simulate real-world cross-silo failures to stress-test autonomous detection and HITL guardrail routing."
      maxWidth="2xl"
    >
      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-6">
        <button
          onClick={() => {
            setActiveTab('presets');
            setInjectionResult(null);
          }}
          className={clsx(
            'flex items-center gap-2 pb-3 px-4 text-sm font-medium border-b-2 transition-all',
            activeTab === 'presets'
              ? 'border-indigo-500 text-indigo-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          )}
        >
          <Flame className="w-4 h-4 text-rose-400" />
          Enterprise Chaos Presets ({presets.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('custom');
            setInjectionResult(null);
          }}
          className={clsx(
            'flex items-center gap-2 pb-3 px-4 text-sm font-medium border-b-2 transition-all',
            activeTab === 'custom'
              ? 'border-indigo-500 text-indigo-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          )}
        >
          <FileCode className="w-4 h-4 text-indigo-400" />
          Custom Anomaly Telemetry
        </button>
      </div>

      {/* Result Card if just injected */}
      {injectionResult && (
        <div className="mb-6 p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/20 backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
            <span className="flex items-center gap-2 text-sm font-bold text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Autonomous Decision Loop Completed
            </span>
            <span className="text-xs font-mono text-emerald-400">
              {injectionResult.injectedRecordsCount} Records Injected
            </span>
          </div>

          {injectionResult.incident && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-200">
                  {injectionResult.incident.title}
                </span>
                <span className="text-xs font-mono text-rose-400 font-bold">
                  Risk: {injectionResult.incident.risk_score} / Exposure: $
                  {injectionResult.incident.estimated_financial_impact_usd?.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {injectionResult.incident.root_cause_synthesis}
              </p>
            </div>
          )}

          {injectionResult.evaluatedMitigations && (
            <div className="mt-3 pt-3 border-t border-emerald-500/20 space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Guardrail Actions Generated ({injectionResult.evaluatedMitigations.length}):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {injectionResult.evaluatedMitigations.map((evalItem: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/90 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-200 truncate pr-2">
                        {evalItem.workflow?.title}
                      </span>
                      <span
                        className={clsx(
                          'px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0',
                          evalItem.decision === 'AUTO_EXECUTE'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        )}
                      >
                        {evalItem.decision === 'AUTO_EXECUTE' ? 'AUTO-EXECUTED' : 'PENDING HITL'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preset List Tab */}
      {activeTab === 'presets' && (
        <div className="space-y-3">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl border border-slate-700/80 bg-slate-800/80 shrink-0">
                  {getPresetIcon(preset.id)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-slate-100">{preset.name}</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                      {preset.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {preset.description}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] font-mono text-slate-400">
                    <span>
                      Est. Exposure:{' '}
                      <strong className="text-rose-400">
                        ${preset.estimatedExposureUsd?.toLocaleString()}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>{preset.records?.length || 2} Correlated Silo Records</span>
                  </div>
                </div>
              </div>

              <button
                disabled={loading}
                onClick={() => handleInjectPreset(preset.id)}
                className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-medium text-xs shadow-md shadow-rose-950/40 disabled:opacity-50 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Inject Now</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Custom Telemetry Form Tab */}
      {activeTab === 'custom' && (
        <form onSubmit={handleInjectCustom} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target Data Silo
              </label>
              <select
                value={siloSource}
                onChange={(e) => setSiloSource(e.target.value as SiloSource)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="SAP_ERP_LEDGER">SAP_ERP_LEDGER (Financial)</option>
                <option value="AWS_COST_EXPLORER">AWS_COST_EXPLORER (FinOps)</option>
                <option value="STRIPE_BILLING">STRIPE_BILLING (Payments)</option>
                <option value="NETSUITE_VENDORS">NETSUITE_VENDORS (Procurement)</option>
                <option value="AUTH0_SECURITY_LOGS">AUTH0_SECURITY_LOGS (IAM/SecOps)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target Entity Name / Resource ID
              </label>
              <input
                type="text"
                required
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                placeholder="e.g. p4d.24xlarge or Apex Global Logistics"
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Estimated Financial Exposure USD ($)
            </label>
            <input
              type="number"
              required
              min={0}
              value={amountUsd}
              onChange={(e) => setAmountUsd(Number(e.target.value))}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Anomaly Telemetry Diagnosis / Reason
            </label>
            <textarea
              required
              rows={3}
              value={anomalyReason}
              onChange={(e) => setAnomalyReason(e.target.value)}
              placeholder="Describe the operational anomaly..."
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-950/50 disabled:opacity-50 transition-all"
            >
              <ArrowRight className="w-4 h-4" />
              <span>Submit Anomaly & Run Gemini Correlation</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
