import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api/client';
import {
  ShieldCheck,
  Cpu,
  Database,
  Flame,
  RotateCcw,
  User,
  LogOut,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  onOpenChaosModal: () => void;
  systemStatus?: {
    geminiEngine: string;
    geminiModel: string;
    databaseMode: string;
  };
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenChaosModal, systemStatus }) => {
  const { user, logout } = useAuth();
  const { addToast } = useToast();

  const handleResetDemo = async () => {
    if (confirm('Restore AegisFlow workspace to pristine factory demo state?')) {
      try {
        await api.seed.reset();
        addToast({
          type: 'success',
          title: 'Workspace Restored',
          message: 'Default multi-silo enterprise records, guardrail policies, and seed incidents have been refreshed.',
        });
        window.location.reload();
      } catch (err: any) {
        addToast({
          type: 'error',
          title: 'Reset Failed',
          message: err.message,
        });
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-950/50">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
              <ShieldCheck className="h-5 w-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-wider bg-gradient-to-r from-slate-100 via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                AEGIS<span className="text-indigo-400">FLOW</span>
              </span>
              <span className="hidden sm:inline-flex items-center rounded-md bg-indigo-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-indigo-400 border border-indigo-500/20">
                v2.5 AUTONOMOUS
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-400 font-mono tracking-tight">
              Agentic FinOps & SecOps Incident Orchestrator
            </p>
          </div>
        </div>

        {/* System Health Status Pills */}
        <div className="hidden lg:flex items-center gap-2.5">
          {/* Gemini AI Status */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">AI Core:</span>
            <span className="text-cyan-300 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
              gemini-2.5-flash
            </span>
          </div>

          {/* Database Sync Status */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Storage:</span>
            <span className="text-emerald-300 font-semibold">
              {systemStatus?.databaseMode?.includes('SUPABASE') ? 'Supabase Postgres' : 'Local ACID Store'}
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Live Chaos Injector Button */}
          <button
            onClick={onOpenChaosModal}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-medium text-xs shadow-md shadow-rose-950/40 hover:shadow-rose-900/60 transition-all duration-200"
          >
            <Flame className="w-3.5 h-3.5 text-white" />
            <span>Inject Chaos</span>
          </button>

          {/* Reset Demo State Button */}
          <button
            onClick={handleResetDemo}
            title="Reset Workspace to Clean Demo State"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="hidden md:block text-right">
              <p className="text-xs font-semibold text-slate-200 leading-tight">
                {user?.full_name || 'Alex Mercer'}
              </p>
              <p className="text-[10px] font-mono text-indigo-400">
                {user?.role || 'INCIDENT_COMMANDER'}
              </p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-950 border border-indigo-500/40 text-indigo-300">
              <User className="h-4 w-4" />
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
