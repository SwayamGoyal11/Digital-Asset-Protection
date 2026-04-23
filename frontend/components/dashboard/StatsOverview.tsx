'use client';

import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import type { DashboardStats } from '@/types';

interface Props { stats: DashboardStats }

interface StatItem {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  glow: string;
  description?: string;
}

function StatCard({ item, index }: { item: StatItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <GlassCard hover>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: '#64748b', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
              {item.label}
            </p>
            <p style={{ color: item.color, fontSize: '32px', fontWeight: 800, lineHeight: 1 }}>
              {item.value.toLocaleString()}
            </p>
            {item.description && (
              <p style={{ color: '#475569', fontSize: '11px', marginTop: '6px' }}>{item.description}</p>
            )}
          </div>
          <div style={{
            width: '44px', height: '44px',
            background: item.glow,
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px',
          }}>
            {item.icon}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

export default function StatsOverview({ stats }: Props) {
  const items: StatItem[] = [
    {
      label: 'Total Logins',
      value: stats.total_logins,
      icon: '🔐',
      color: '#3b82f6',
      glow: 'rgba(59,130,246,0.15)',
      description: 'All login attempts',
    },
    {
      label: 'High Risk Logins',
      value: stats.high_risk_logins,
      icon: '⚠️',
      color: '#ef4444',
      glow: 'rgba(239,68,68,0.15)',
      description: 'Score ≥ 50',
    },
    {
      label: 'Active Alerts',
      value: stats.active_alerts,
      icon: '🚨',
      color: '#a855f7',
      glow: 'rgba(168,85,247,0.15)',
      description: 'Unread alerts',
    },
    {
      label: 'Unique Users',
      value: stats.unique_users,
      icon: '👤',
      color: '#06b6d4',
      glow: 'rgba(6,182,212,0.15)',
      description: 'Distinct accounts',
    },
    {
      label: 'Bot Detections',
      value: stats.bot_detections,
      icon: '🤖',
      color: '#f59e0b',
      glow: 'rgba(245,158,11,0.15)',
      description: 'Automated access',
    },
    {
      label: 'Geo Anomalies',
      value: stats.geo_anomalies,
      icon: '🌍',
      color: '#10b981',
      glow: 'rgba(16,185,129,0.15)',
      description: 'Impossible travel',
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
      {items.map((item, i) => <StatCard key={item.label} item={item} index={i} />)}
    </div>
  );
}
