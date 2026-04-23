'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useAlertStream } from '@/lib/websocket';
import RiskBadge from '@/components/ui/RiskBadge';
import type { Alert } from '@/types';

const ALERT_ICONS: Record<string, string> = {
  BOT:           '🤖',
  GEO_VELOCITY:  '🌍',
  MULTI_ACCOUNT: '👥',
  HIGH_RISK:     '⚠️',
  NEW_DEVICE:    '📱',
};

interface Props {
  initialAlerts?: Alert[];
}

export default function AlertsPanel({ initialAlerts = [] }: Props) {
  const { alerts: liveAlerts, connected } = useAlertStream();

  // Merge live + initial, deduplicate by id, sort newest first
  const all = [...liveAlerts, ...initialAlerts]
    .filter((a, i, arr) => arr.findIndex((x) => x.id === a.id) === i)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontWeight: 700, fontSize: '16px' }}>Live Alerts</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="pulse-dot" style={{ background: connected ? '#22c55e' : '#ef4444' }} />
          <span style={{ color: '#64748b', fontSize: '12px' }}>{connected ? 'Connected' : 'Reconnecting…'}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto' }}>
        <AnimatePresence mode="popLayout">
          {all.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#475569', fontSize: '13px' }}>
              No alerts yet. Monitoring active…
            </div>
          )}
          {all.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}
            >
              <span style={{ fontSize: '18px', flexShrink: 0 }}>
                {ALERT_ICONS[alert.alert_type] || '🔔'}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: '#e2e8f0' }}>{alert.alert_type.replace('_', ' ')}</span>
                  <RiskBadge level={alert.severity} size="sm" />
                </div>
                <p style={{ color: '#94a3b8', fontSize: '12px', lineHeight: 1.5, marginBottom: '4px' }}>{alert.message}</p>
                <p style={{ color: '#475569', fontSize: '10px' }}>
                  {format(new Date(alert.timestamp), 'MMM d, HH:mm:ss')} · User #{alert.user_id}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
