'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import type { LoginEvent } from '@/types';
import RiskBadge from '@/components/ui/RiskBadge';

const SCENARIO_LABELS: Record<string, { icon: string; label: string }> = {
  normal_login:  { icon: '🟢', label: 'Normal Login' },
  new_device:    { icon: '🟡', label: 'New Device' },
  bot_behavior:  { icon: '🤖', label: 'Bot Detected' },
  geo_anomaly:   { icon: '🌍', label: 'Geo Anomaly' },
  historical:    { icon: '📋', label: 'Historical' },
};

interface Props {
  events: LoginEvent[];
  maxItems?: number;
}

export default function ActivityFeed({ events, maxItems = 8 }: Props) {
  const displayed = events.slice(0, maxItems);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontWeight: 700, fontSize: '16px' }}>
          Activity Feed
        </h3>
        <span style={{
          fontSize: '11px', color: '#475569',
          background: 'rgba(255,255,255,0.04)',
          padding: '3px 8px', borderRadius: '6px',
        }}>
          {events.length} events
        </span>
      </div>

      {displayed.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#475569', padding: '32px 0', fontSize: '13px' }}>
          No activity to display
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <AnimatePresence>
            {displayed.map((event, idx) => {
              const scenario = SCENARIO_LABELS[event.scenario ?? 'historical'] ?? SCENARIO_LABELS.historical;
              const location = event.location
                ? `${event.location.city ?? ''}${event.location.country ? `, ${event.location.country}` : ''}`
                : event.ip_address;

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.2, delay: idx * 0.04 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    background: event.is_flagged
                      ? 'rgba(239,68,68,0.05)'
                      : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${event.is_flagged ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)'}`,
                    borderRadius: '10px',
                    transition: 'background 0.2s',
                  }}
                >
                  {/* Icon */}
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>{scenario.icon}</span>

                  {/* Main info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>
                        {scenario.label}
                      </span>
                      {event.is_flagged && (
                        <span style={{
                          fontSize: '9px', fontWeight: 700, letterSpacing: '0.05em',
                          color: '#ef4444', background: 'rgba(239,68,68,0.12)',
                          padding: '1px 6px', borderRadius: '4px',
                        }}>
                          FLAGGED
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        📍 {location}
                      </span>
                      <span style={{ fontSize: '11px', color: '#334155' }}>
                        {event.timestamp
                          ? formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })
                          : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Risk badge */}
                  <div style={{ flexShrink: 0 }}>
                    <RiskBadge level={event.risk_level} score={event.risk_score} size="sm" />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
