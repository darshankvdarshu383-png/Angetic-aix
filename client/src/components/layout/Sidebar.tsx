import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertOctagon,
  ShieldAlert,
  TrendingDown,
  BotMessageSquare,
  Layers,
  Activity,
} from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  activeIncidentsCount?: number;
  pendingApprovalsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeIncidentsCount = 0,
  pendingApprovalsCount = 0,
}) => {
  const navItems = [
    {
      to: '/dashboard',
      label: 'Command Center',
      icon: <LayoutDashboard className="w-5 h-5" />,
      badge: null,
    },
    {
      to: '/incidents',
      label: 'Incident Explorer',
      icon: <AlertOctagon className="w-5 h-5" />,
      badge: activeIncidentsCount > 0 ? (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
          {activeIncidentsCount}
        </span>
      ) : null,
    },
    {
      to: '/guardrails',
      label: 'HITL Guardrails',
      icon: <ShieldAlert className="w-5 h-5" />,
      badge: pendingApprovalsCount > 0 ? (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
          {pendingApprovalsCount} PENDING
        </span>
      ) : null,
    },
    {
      to: '/finance-assistant',
      label: 'AI Finance Assistant',
      icon: <TrendingDown className="w-5 h-5" />,
      badge: null,
    },
    {
      to: '/chatbot',
      label: 'Agentic Ops Copilot',
      icon: <BotMessageSquare className="w-5 h-5" />,
      badge: (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300">
          AI
        </span>
      ),
    },
    {
      to: '/data-sources',
      label: 'Data Silos Hub',
      icon: <Layers className="w-5 h-5" />,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-950/90 flex flex-col justify-between p-4 hidden md:flex">
      <div className="space-y-6">
        <div>
          <span className="px-3 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
            Enterprise Operations
          </span>
          <nav className="mt-2 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm shadow-indigo-950/40'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border border-transparent'
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 group-hover:text-indigo-400 transition-colors">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Real-time Telemetry Monitor Card */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              Silo Telemetry Mesh
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              HEALTHY
            </span>
          </div>
          <div className="mt-2.5 space-y-1 text-[11px] text-slate-400 font-mono">
            <div className="flex justify-between">
              <span>SAP ERP Ledger:</span>
              <span className="text-slate-200">Sync: 1s</span>
            </div>
            <div className="flex justify-between">
              <span>AWS Cost Explorer:</span>
              <span className="text-slate-200">Stream: Active</span>
            </div>
            <div className="flex justify-between">
              <span>Stripe Billing:</span>
              <span className="text-slate-200">Webhooks: 99.8%</span>
            </div>
            <div className="flex justify-between">
              <span>NetSuite Vendors:</span>
              <span className="text-slate-200">AP Audit: Live</span>
            </div>
            <div className="flex justify-between">
              <span>Auth0 Security:</span>
              <span className="text-slate-200">Token Watch: On</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-900 text-[11px] text-slate-500 font-mono text-center">
        AegisFlow v2.5.0 • Zero-Placeholder Engine
      </div>
    </aside>
  );
};
