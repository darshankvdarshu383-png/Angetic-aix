import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { FinanceAnalysis } from '../types';
import { useToast } from '../context/ToastContext';
import {
  TrendingDown,
  DollarSign,
  ShieldCheck,
  Zap,
  Sparkles,
  Sliders,
  Play,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Clock,
  Briefcase,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import clsx from 'clsx';

export const FinanceAssistantPage: React.FC = () => {
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<FinanceAnalysis | null>(null);

  // Stress-testing Form Controls
  const [stressMultiplier, setStressMultiplier] = useState(1.0);
  const [growthScenario, setGrowthScenario] = useState('Baseline High-Volatility');

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const res = await api.finance.analyze({
        growthScenario,
        stressMultiplier: Number(stressMultiplier),
      });
      setAnalysis(res.analysis);
      addToast({
        type: 'success',
        title: 'CFO Fiscal Analysis Synthesized',
        message: 'Updated multi-period exposure projections and mitigation ROI models.',
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Analysis Failed',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis();
  }, []);

  const scenarioOptions = [
    'Baseline High-Volatility (Active Incidents)',
    'Cascading Cloud Auto-Scaling Loop Surge',
    'Black Swan Wire Transfer & Procurement Compromise',
    'Payment Gateway Webhook Dead-Letter Partition',
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2.5">
              <TrendingDown className="w-7 h-7 text-indigo-400" />
              AI Finance Assistant & Cash-at-Risk Engine
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            CFO-grade predictive financial exposure modeling, mitigation ROI analysis, and multi-period stress-testing.
          </p>
        </div>

        <button
          onClick={runAnalysis}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium text-xs shadow-md shadow-indigo-950/40 disabled:opacity-50 transition-all"
        >
          <Sparkles className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Re-run Financial Stress Model</span>
        </button>
      </div>

      {/* Interactive Stress-Testing Controls Bar */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-200">
              Interactive Fiscal Stress-Testing Parameters
            </h3>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            DYNAMIC RISK SENSITIVITY
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          {/* Scenario Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Operational Failure Scenario
            </label>
            <select
              value={growthScenario}
              onChange={(e) => setGrowthScenario(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {scenarioOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Stress Multiplier Slider */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-slate-300">Failure Stress Multiplier</span>
              <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {Number(stressMultiplier).toFixed(1)}x Baseline
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={stressMultiplier}
              onChange={(e) => setStressMultiplier(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
              <span>0.5x Conservative</span>
              <span>1.0x Baseline</span>
              <span>3.0x Catastrophic</span>
            </div>
          </div>

          {/* Run button */}
          <div>
            <button
              onClick={runAnalysis}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-indigo-950/60 disabled:opacity-50 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Simulate & Model Impact</span>
            </button>
          </div>
        </div>
      </div>

      {/* Executive Financial Synthesis Card */}
      {analysis && (
        <div className="space-y-6">
          {/* 3 Executive Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-rose-500/40 bg-gradient-to-br from-rose-950/40 to-slate-900 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-rose-300">Total Cash at Risk</span>
                <DollarSign className="w-5 h-5 text-rose-400" />
              </div>
              <p className="text-3xl font-bold font-mono text-rose-200 mt-2">
                ${analysis.total_cash_at_risk_usd.toLocaleString()}
              </p>
              <span className="text-[11px] text-rose-400 mt-1 block">
                Unmitigated exposure across active incidents
              </span>
            </div>

            <div className="p-5 rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 to-slate-900 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-emerald-300">
                  Projected Recapture Savings
                </span>
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-3xl font-bold font-mono text-emerald-200 mt-2">
                ${analysis.estimated_mitigation_savings_usd.toLocaleString()}
              </p>
              <span className="text-[11px] text-emerald-400 mt-1 block">
                Recoverable through HITL mitigation sign-offs
              </span>
            </div>

            <div className="p-5 rounded-2xl border border-indigo-500/40 bg-gradient-to-br from-indigo-950/40 to-slate-900 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-indigo-300">
                  Mitigation ROI Multiplier
                </span>
                <Zap className="w-5 h-5 text-indigo-400" />
              </div>
              <p className="text-3xl font-bold font-mono text-indigo-200 mt-2">
                {analysis.mitigation_roi_percentage}%
              </p>
              <span className="text-[11px] text-indigo-400 mt-1 block">
                Yield on immediate remediation actions
              </span>
            </div>
          </div>

          {/* Executive Summary Prose Card */}
          <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-indigo-300">
                CFO Executive Risk Synthesis
              </h3>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-sans">
              {analysis.executive_summary}
            </p>
          </div>

          {/* Recharts Multi-Period Forecast Visualization */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Multi-Period Financial Forecast ($ USD Exposure Timeline)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Trajectory modeling comparing unmitigated exposure escalation against residual risk after HITL actions.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                6-Period Time Series (Current → T+30d)
              </span>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={analysis.forecast_time_series}
                  margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorUnmitigated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorResidual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorPrevented" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="period" stroke="#64748b" fontSize={11} tickLine={false} />
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
                    formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area
                    type="monotone"
                    name="Unmitigated Exposure (USD)"
                    dataKey="unmitigated_exposure_usd"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorUnmitigated)"
                  />
                  <Area
                    type="monotone"
                    name="Mitigated Residual Risk (USD)"
                    dataKey="mitigated_residual_risk_usd"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorResidual)"
                  />
                  <Area
                    type="monotone"
                    name="Cumulative Prevented Loss (USD)"
                    dataKey="cumulative_prevented_loss_usd"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPrevented)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CFO Prioritized Action Recommendations */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-400" />
                CFO Prioritized Remediation Directives ({analysis.recommended_actions.length})
              </h3>
              <span className="text-xs font-mono text-slate-400">Ranked by Net Financial Impact</span>
            </div>

            <div className="space-y-3">
              {analysis.recommended_actions.map((rec, idx) => {
                const priorityBadge = {
                  CRITICAL: 'bg-rose-950/80 text-rose-300 border-rose-500/50',
                  HIGH: 'bg-amber-950/80 text-amber-300 border-amber-500/50',
                  MEDIUM: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/50',
                  LOW: 'bg-slate-800 text-slate-300 border-slate-700',
                }[rec.priority];

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${priorityBadge}`}>
                          {rec.priority}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          Owner: <strong className="text-slate-200">{rec.owner}</strong>
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          Timeline: {rec.timeline}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-100">{rec.action}</h4>
                      <p className="text-xs text-slate-400">
                        Complexity: <span className="text-slate-300">{rec.implementation_complexity}</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">
                        Projected Recapture
                      </span>
                      <span className="text-lg font-bold font-mono text-emerald-400">
                        +${rec.potential_savings_usd.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
