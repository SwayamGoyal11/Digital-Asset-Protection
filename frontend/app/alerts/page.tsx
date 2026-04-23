'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { fetchAlerts, markAlertRead } from '@/lib/api';
import { useAlertStream } from '@/lib/websocket';
import AppShell from '@/components/AppShell';
import GlassCard from '@/components/ui/GlassCard';
import RiskBadge from '@/components/ui/RiskBadge';
import type { Alert, RiskLevel } from '@/types';

const ALERT_ICONS: Record<string, string> = {
  BOT:           '🤖',
  GEO_VELOCITY:  '🌍',
  MULTI_ACCOUNT: '👥',
  HIGH_RISK:     '⚠️',
  NEW_DEVICE:    '📱',
};

const FILTERS: { label: string; value: string }[] = [
  { label: 'All',      value: '' },
  { label: 'Critical', value: 'CRITICAL' },
  { label: 'High',     value: 'HIGH' },
  { label: 'Medium',   value: 'MEDIUM' },
  { label: 'Low',      value: 'LOW' },
];

export default function AlertsPage() {
  const [alerts, setAlerts]   = useState<Alert[]>([]);
  const [filter, setFilter]   = useState('');
  const [loading, setLoading] = useState(true);
  const { alerts: live, connected } = useAlertStream();

  useEffect(() => {
    fetchAlerts({ limit: 100 }).then((data) => {
      setAlerts(data);
      setLoading(false);
    });
  }, []);

  // Merge live alerts
  useEffect(() => {
    if (live.length === 0) return;
    setAlerts((prev) => {
      const ids = new Set(prev.map((a) => a.id));
      const news = live.filter((a) => !ids.has(a.id));
      return [...news, ...prev];
    });
  }, [live]);

  const displayed = filter ? alerts.filter((a) => a.severity === filter) : alerts;

  async function handleMarkRead(id: number) {
    await markAlertRead(id);
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, is_read: true } : a));
  }

  const unread = alerts.filter((a) => !a.is_read).length;

  return (
    <AppShell>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>
            Alert <span className="gradient-text">Center</span>
          </h1>
          <p style={{ color: '#475569', fontSize: '13px' }}>
            {unread} unread · {alerts.length} total · WebSocket {connected ? '🟢 live' : '🔴 offline'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: filter === f.value ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)',
                color: filter === f.value ? '#60a5fa' : '#64748b',
                fontWeight: filter === f.value ? 600 : 400,
                fontSize: '12px',
                transition: 'all 0.2s',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#475569' }}>Loading alerts…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <AnimatePresence>
            {displayed.length === 0 && (
              <GlassCard>
                <div style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>
                  No alerts {filter ? `for severity "${filter}"` : ''}
                </div>
              </GlassCard>
            )}
            {displayed.map((alert, i) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.02 }}
              >
                <div
                  className="glass"
                  style={{
                    padding: '16px 20px',
                    display: 'flex', gap: '16px', alignItems: 'flex-start',
                    opacity: alert.is_read ? 0.6 : 1,
                    borderLeft: alert.is_read ? '3px solid rgba(255,255,255,0.05)' : '3px solid #3b82f6',
                  }}
                >
                  <span style={{ fontSize: '24px', flexShrink: 0, marginTop: '2px' }}>
                    {ALERT_ICONS[alert.alert_type] || '🔔'}
                  </span>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 700, fontSize: '14px' }}>
                          {alert.alert_type.replace('_', ' ')}
                        </span>
                        <RiskBadge level={alert.severity as RiskLevel} size="sm" />
                        {!alert.is_read && (
                          <span style={{
                            background: 'rgba(59,130,246,0.2)', color: '#60a5fa',
                            padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600,
                          }}>NEW</span>
                        )}
                      </div>
                      <span style={{ color: '#475569', fontSize: '11px' }}>
                        {format(new Date(alert.timestamp), 'MMM d, yyyy HH:mm:ss')}
                      </span>
                    </div>

                    <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: 1.5, marginBottom: '8px' }}>
                      {alert.message}
                    </p>

                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <span style={{ color: '#475569', fontSize: '11px' }}>User #{alert.user_id}</span>
                      {alert.login_event_id && (
                        <span style={{ color: '#475569', fontSize: '11px' }}>Event #{alert.login_event_id}</span>
                      )}
                      {!alert.is_read && (
                        <button
                          onClick={() => handleMarkRead(alert.id)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#3b82f6', fontSize: '11px', fontWeight: 600,
                            padding: 0, textDecoration: 'underline',
                          }}
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </AppShell>
  );
}
