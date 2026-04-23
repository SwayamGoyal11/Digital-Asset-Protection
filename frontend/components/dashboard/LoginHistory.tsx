'use client';

import { motion } from 'framer-motion';
import { format } from 'date-fns';
import RiskBadge from '@/components/ui/RiskBadge';
import type { LoginEvent } from '@/types';

interface Props {
  events: LoginEvent[];
}

export default function LoginHistory({ events }: Props) {
  return (
    <div>
      <h3 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '16px' }}>Login History</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Time', 'User', 'Location', 'Device', 'IP', 'Risk', 'Scenario'].map((h) => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: 600, whiteSpace: 'nowrap', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map((event, i) => (
              <motion.tr
                key={event.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  background: event.is_flagged ? 'rgba(239,68,68,0.04)' : 'transparent',
                }}
              >
                <td style={{ padding: '10px 12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                  {format(new Date(event.timestamp), 'MMM d, HH:mm')}
                </td>
                <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>#{event.user_id}</td>
                <td style={{ padding: '10px 12px', color: '#94a3b8' }}>
                  {event.location ? `${event.location.city}, ${event.location.country}` : '—'}
                </td>
                <td style={{ padding: '10px 12px', color: '#64748b', fontFamily: 'monospace', fontSize: '10px', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {event.device_id ? event.device_id.slice(0, 12) + '…' : '—'}
                </td>
                <td style={{ padding: '10px 12px', color: '#64748b', fontFamily: 'monospace', fontSize: '10px' }}>
                  {event.ip_address || '—'}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <RiskBadge level={event.risk_level} score={event.risk_score} size="sm" />
                </td>
                <td style={{ padding: '10px 12px' }}>
                  {event.scenario && (
                    <span style={{
                      background: 'rgba(59,130,246,0.1)',
                      color: '#60a5fa',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '10px',
                      fontWeight: 500,
                    }}>
                      {event.scenario.replace('_', ' ')}
                    </span>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {events.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px', color: '#475569', fontSize: '13px' }}>
            No login events yet.
          </div>
        )}
      </div>
    </div>
  );
}
