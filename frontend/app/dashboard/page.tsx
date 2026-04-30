'use client';

import { useEffect, useState } from 'react';
import { fetchDashboard } from '@/lib/api';
import type { DashboardData } from '@/types';
import AppShell from '@/components/AppShell';
import GlassCard from '@/components/ui/GlassCard';
import StatsOverview from '@/components/dashboard/StatsOverview';
import AlertsPanel from '@/components/dashboard/AlertsPanel';
import LoginHistory from '@/components/dashboard/LoginHistory';
import RiskTimeline from '@/components/charts/RiskTimeline';
import RiskBreakdown from '@/components/charts/RiskBreakdown';
import { RefreshCw, Bot, Globe, AlertTriangle, ShieldAlert, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [refreshing, setRefreshing] = useState(false);

  async function load(isRefresh = false) {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      const d = await fetchDashboard();
      setData(d);
      setError('');
    } catch {
      setError('Failed to load dashboard. Is the backend running?');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight mb-1">
            Identity Intelligence <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium">Real-time fraud monitoring · Auto-refreshes every 30s</p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 rounded-xl px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-red-400 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {loading && !data ? (
        <div className="flex justify-center items-center h-64 text-slate-500">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <p className="font-medium animate-pulse">Loading intelligence data…</p>
          </div>
        </div>
      ) : data ? (
        <div className="flex flex-col gap-6">
          {/* KPI Stats */}
          <StatsOverview stats={data.stats} />

          {/* Charts Row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <GlassCard className="xl:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg tracking-tight">Risk Score Timeline</h3>
                <span className="bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs text-slate-400">Last 30 logins</span>
              </div>
              <RiskTimeline data={data.risk_trend} />
            </GlassCard>

            <GlassCard>
              <h3 className="font-bold text-lg tracking-tight mb-6">Risk Factor Breakdown</h3>
              {data.recent_events[0]?.factors ? (
                <RiskBreakdown factors={data.recent_events[0].factors as any} />
              ) : (
                <div className="text-slate-500 text-sm text-center pt-10">No recent events with factors</div>
              )}
            </GlassCard>
          </div>

          {/* Alerts + Summary */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <GlassCard className="flex flex-col h-full min-h-[300px]">
              <h3 className="font-bold text-lg tracking-tight mb-6">Active Threat Alerts</h3>
              <div className="flex-1 overflow-hidden">
                <AlertsPanel initialAlerts={data.recent_alerts} />
              </div>
            </GlassCard>

            {/* Quick threat summary */}
            <GlassCard className="h-full">
              <h3 className="font-bold text-lg tracking-tight mb-6">Threat Intelligence Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: Bot, label: 'Bot Detections', value: data.stats.bot_detections, colorClass: 'text-amber-500', bgClass: 'bg-amber-500/10', borderClass: 'border-amber-500/20' },
                  { icon: Globe, label: 'Geo Anomalies',  value: data.stats.geo_anomalies,  colorClass: 'text-cyan-500', bgClass: 'bg-cyan-500/10', borderClass: 'border-cyan-500/20' },
                  { icon: AlertTriangle, label: 'High Risk Logins', value: data.stats.high_risk_logins, colorClass: 'text-red-500', bgClass: 'bg-red-500/10', borderClass: 'border-red-500/20' },
                  { icon: ShieldAlert, label: 'Unread Alerts',  value: data.stats.active_alerts,  colorClass: 'text-purple-500', bgClass: 'bg-purple-500/10', borderClass: 'border-purple-500/20' },
                ].map(({ icon: Icon, label, value, colorClass, bgClass, borderClass }, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={label} 
                    className={`flex flex-col justify-between p-5 rounded-xl border ${bgClass} ${borderClass} relative overflow-hidden group hover:scale-[1.02] transition-transform`}
                  >
                    <div className="flex items-center gap-3 mb-4 relative z-10">
                      <Icon className={`w-5 h-5 ${colorClass}`} />
                      <span className="text-slate-300 text-sm font-medium">{label}</span>
                    </div>
                    <span className={`font-bold text-3xl ${colorClass} relative z-10`}>{value}</span>
                    <div className="absolute right-[-10%] top-[-10%] w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors pointer-events-none" />
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Login History */}
          <GlassCard>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg tracking-tight">Recent Sessions</h3>
              <button className="text-blue-400 text-sm hover:text-blue-300 transition-colors font-medium">View All</button>
            </div>
            <LoginHistory events={data.recent_events} />
          </GlassCard>
        </div>
      ) : null}
    </AppShell>
  );
}
