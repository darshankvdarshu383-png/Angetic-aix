import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'severity' | 'domain' | 'status' | 'silo' | 'risk' | 'neutral';
  value?: string | number;
  size?: 'xs' | 'sm' | 'md';
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  value,
  size = 'sm',
  pulse = false,
}) => {
  const strVal = String(value || children).toUpperCase();

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';

  if (variant === 'severity') {
    if (strVal === 'CRITICAL') colorClasses = 'bg-rose-950/70 text-rose-300 border-rose-500/40';
    else if (strVal === 'HIGH') colorClasses = 'bg-amber-950/70 text-amber-300 border-amber-500/40';
    else if (strVal === 'MEDIUM') colorClasses = 'bg-indigo-950/70 text-indigo-300 border-indigo-500/40';
    else if (strVal === 'LOW') colorClasses = 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40';
  } else if (variant === 'status') {
    if (strVal === 'PENDING_APPROVAL') colorClasses = 'bg-amber-950/80 text-amber-300 border-amber-500/50 shadow-amber-950/40';
    else if (strVal === 'AUTO_EXECUTED') colorClasses = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50';
    else if (strVal === 'EXECUTED') colorClasses = 'bg-indigo-950/80 text-indigo-300 border-indigo-500/50';
    else if (strVal === 'REJECTED') colorClasses = 'bg-rose-950/80 text-rose-300 border-rose-500/50';
    else if (strVal === 'DETECTED') colorClasses = 'bg-rose-950/80 text-rose-300 border-rose-500/50';
    else if (strVal === 'MITIGATING') colorClasses = 'bg-amber-950/80 text-amber-300 border-amber-500/50';
    else if (strVal === 'RESOLVED') colorClasses = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50';
  } else if (variant === 'domain') {
    if (strVal.includes('FINANCIAL')) colorClasses = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30';
    else if (strVal.includes('CLOUD')) colorClasses = 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30';
    else if (strVal.includes('PAYMENT')) colorClasses = 'bg-purple-950/60 text-purple-300 border-purple-500/30';
    else if (strVal.includes('VENDOR')) colorClasses = 'bg-amber-950/60 text-amber-300 border-amber-500/30';
    else if (strVal.includes('IDENTITY') || strVal.includes('IAM')) colorClasses = 'bg-rose-950/60 text-rose-300 border-rose-500/30';
  } else if (variant === 'silo') {
    if (strVal.includes('SAP')) colorClasses = 'bg-blue-950/60 text-blue-300 border-blue-500/30';
    else if (strVal.includes('AWS')) colorClasses = 'bg-amber-950/60 text-amber-300 border-amber-500/30';
    else if (strVal.includes('STRIPE')) colorClasses = 'bg-indigo-950/60 text-indigo-300 border-indigo-500/30';
    else if (strVal.includes('NETSUITE')) colorClasses = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30';
    else if (strVal.includes('AUTH0')) colorClasses = 'bg-rose-950/60 text-rose-300 border-rose-500/30';
  } else if (variant === 'risk') {
    const num = Number(value || 0);
    if (num >= 80) colorClasses = 'bg-rose-950 text-rose-300 border-rose-500';
    else if (num >= 60) colorClasses = 'bg-amber-950 text-amber-300 border-amber-500';
    else colorClasses = 'bg-emerald-950 text-emerald-300 border-emerald-500';
  }

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm font-medium',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border font-mono tracking-tight transition-all',
        sizeClasses[size],
        colorClasses,
        pulse && 'animate-pulse'
      )}
    >
      {pulse && <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 animate-ping-slow" />}
      {children}
    </span>
  );
};
