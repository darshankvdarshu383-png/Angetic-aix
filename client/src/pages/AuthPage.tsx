import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ShieldCheck,
  Zap,
  Lock,
  Mail,
  User,
  ArrowRight,
  Database,
  Cpu,
  ShieldAlert,
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, register, launchDemo } = useAuth();
  const { addToast } = useToast();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('alex.mercer@aegisflow.io');
  const [password, setPassword] = useState('aegis-demo-2026');
  const [fullName, setFullName] = useState('Alex Mercer');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({ email, password, full_name: fullName });
      }
      addToast({
        type: 'success',
        title: 'Authentication Successful',
        message: 'Welcome to AegisFlow Decision Core.',
      });
      navigate('/dashboard');
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Sign In Failed',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchDemo = async () => {
    setLoading(true);
    try {
      await launchDemo();
      addToast({
        type: 'success',
        title: 'Demo Workspace Initialized',
        message: 'Bootstrapped multi-silo telemetry and live incident decision room.',
      });
      navigate('/dashboard');
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Demo Launch Failed',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 radar-grid relative overflow-hidden">
      {/* Background glowing ambient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-xl shadow-indigo-950/60 mb-4">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950">
              <ShieldCheck className="h-8 w-8 text-indigo-400" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            AEGIS<span className="text-indigo-400">FLOW</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 font-mono">
            Autonomous Incident Mitigation Orchestrator & AI Finance Assistant
          </p>
        </div>

        {/* Instant Demo Launcher Card (Top priority) */}
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/40 shadow-xl shadow-indigo-950/40 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
            <h3 className="text-xs font-bold font-mono tracking-wider text-indigo-300 uppercase">
              Evaluation & Operator Sandbox
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            Pre-loaded with 15 cross-silo records across SAP, AWS, Stripe, NetSuite & Auth0 with active HITL workflows.
          </p>
          <button
            onClick={handleLaunchDemo}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-indigo-950/60 transition-all duration-200 disabled:opacity-50"
          >
            <span>Launch Instant Demo Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Standard Auth Card */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl backdrop-blur-md">
          <div className="flex border-b border-slate-800 pb-3 mb-5">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 text-center pb-2 text-xs font-semibold tracking-wider uppercase transition-all ${
                mode === 'login'
                  ? 'border-b-2 border-indigo-500 text-indigo-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 text-center pb-2 text-xs font-semibold tracking-wider uppercase transition-all ${
                mode === 'register'
                  ? 'border-b-2 border-indigo-500 text-indigo-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Register Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Mercer"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Enterprise Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@enterprise.com"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Security Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors disabled:opacity-50"
            >
              {mode === 'login' ? 'Authenticate Session' : 'Create Enterprise Account'}
            </button>
          </form>
        </div>

        {/* Feature Badges Footer */}
        <div className="mt-8 grid grid-cols-3 gap-2 text-center text-[10px] font-mono text-slate-500">
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-900/40 border border-slate-800/40">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Gemini 2.5 Flash</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-900/40 border border-slate-800/40">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>HITL Guardrails</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-900/40 border border-slate-800/40">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Supabase RLS</span>
          </div>
        </div>
      </div>
    </div>
  );
};
