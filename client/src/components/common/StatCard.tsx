import React from 'react';
import clsx from 'clsx';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  glowVariant?: 'rose' | 'amber' | 'emerald' | 'indigo' | 'cyan';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon,
  trend,
  glowVariant = 'indigo',
  onClick,
}) => {
  const glowBorder = {
    rose: 'hover:border-rose-500/50 hover:shadow-rose-950/20',
    amber: 'hover:border-amber-500/50 hover:shadow-amber-950/20',
    emerald: 'hover:border-emerald-500/50 hover:shadow-emerald-950/20',
    indigo: 'hover:border-indigo-500/50 hover:shadow-indigo-950/20',
    cyan: 'hover:border-cyan-500/50 hover:shadow-cyan-950/20',
  }[glowVariant];

  const iconBg = {
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  }[glowVariant];

  return (
    <div
      onClick={onClick}
      className={clsx(
        'relative overflow-hidden rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-lg backdrop-blur-md transition-all duration-300',
        glowBorder,
        onClick && 'cursor-pointer hover:-translate-y-0.5'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className={clsx('p-2.5 rounded-xl border', iconBg)}>
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-slate-100">
          {value}
        </span>
      </div>

      {(subtext || trend) && (
        <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400">
          {subtext && <span>{subtext}</span>}
          {trend && (
            <span
              className={clsx(
                'inline-flex items-center font-mono font-medium',
                trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
              )}
            >
              {trend.value} <span className="text-slate-500 ml-1">{trend.label}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
