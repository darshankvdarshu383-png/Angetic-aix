import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ChaosModal } from '../chaos/ChaosModal';
import { api } from '../../api/client';
import { DashboardStats } from '../../types';

export const AppLayout: React.FC = () => {
  const [chaosModalOpen, setChaosModalOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const refreshStats = async () => {
    try {
      const data = await api.dashboard.getStats();
      setStats(data);
    } catch (err) {
      console.warn('Dashboard stats refresh error', err);
    }
  };

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-950 text-slate-100 radar-grid">
      {/* Top Header */}
      <Navbar
        onOpenChaosModal={() => setChaosModalOpen(true)}
        systemStatus={stats?.systemStatus}
      />

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeIncidentsCount={stats?.kpis.activeIncidentsCount}
          pendingApprovalsCount={stats?.kpis.pendingApprovalsCount}
        />

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet context={{ refreshStats, stats }} />
        </main>
      </div>

      {/* Chaos Injection Modal */}
      <ChaosModal
        isOpen={chaosModalOpen}
        onClose={() => setChaosModalOpen(false)}
        onChaosInjected={() => {
          refreshStats();
        }}
      />
    </div>
  );
};
