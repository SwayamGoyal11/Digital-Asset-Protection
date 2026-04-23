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

export default function DashboardPage() {
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  async function load() {
    try {
      setLoading(true);
      const d = await fetchDashboard();
      setData(d);
    } catch {
      setError('Failed to load dashboard. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // Auto-refresh every 30 seconds
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppShell>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>
            Identity Intelligence <span className="gradient-text">Dashboard</span>
          </h1>
          <p style={{ color: '#475569', fontSize: '13px' }}>Real-time fraud monitoring · Auto-refreshes every 30s</p>
        </div>
        <button
          onClick={load}
          style={{
            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
            color: '#60a5fa', borderRadius: '10px', padding: '8px 16px',
            cursor: 'pointer', fontSize: '12px', fontWeight: 600,
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '12px', padding: '16px', marginBottom: '24px', color: '#f87171',
        }}>
          {error}
        </div>
      )}

      {loading && !data ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: '#475569' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px', animation: 'spin 1s linear infinite' }}>⟳</div>
            <p>Loading intelligence data…</p>
          </div>
        </div>
      ) : data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* KPI Stats */}
          <StatsOverview stats={data.stats} />

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            <GlassCard>
              <h3 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '20px' }}>
                Risk Score Timeline
                <span style={{ color: '#475569', fontSize: '12px', fontWeight: 400, marginLeft: '10px' }}>Last 30 logins</span>
              </h3>
              <RiskTimeline data={data.risk_trend} />
            </GlassCard>

            <GlassCard>
              <h3 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '20px' }}>
                Risk Factor Breakdown
              </h3>
              {data.recent_events[0]?.factors ? (
                <RiskBreakdown factors={data.recent_events[0].factors as any} />
              ) : (
                <div style={{ color: '#475569', fontSize: '13px', textAlign: 'center', paddingTop: '40px' }}>No recent events with factors</div>
              )}
            </GlassCard>
          </div>

          {/* Alerts + Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <GlassCard>
              <AlertsPanel initialAlerts={data.recent_alerts} />
            </GlassCard>

            {/* Quick threat summary */}
            <GlassCard>
              <h3 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '16px' }}>Threat Intelligence</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { icon: '🤖', label: 'Bot Detections', value: data.stats.bot_detections, color: '#f59e0b' },
                  { icon: '🌍', label: 'Geo Anomalies',  value: data.stats.geo_anomalies,  color: '#06b6d4' },
                  { icon: '⚠️', label: 'High Risk',       value: data.stats.high_risk_logins, color: '#ef4444' },
                  { icon: '🚨', label: 'Unread Alerts',  value: data.stats.active_alerts,  color: '#a855f7' },
                ].map(({ icon, label, value, color }) => (
                  <div key={label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 14px', background: 'rgba(255,255,255,0.03)',
                    borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '18px' }}>{icon}</span>
                      <span style={{ color: '#94a3b8', fontSize: '13px' }}>{label}</span>
                    </div>
                    <span style={{ color, fontWeight: 700, fontSize: '20px' }}>{value}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Login History */}
          <GlassCard>
            <LoginHistory events={data.recent_events} />
          </GlassCard>
        </div>
      ) : null}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppShell>
  );
}
