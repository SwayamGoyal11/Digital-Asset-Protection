'use client';

import { motion, animate } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import type { DashboardStats } from '@/types';
import { useEffect, useRef } from 'react';
import { KeyRound, AlertTriangle, ShieldAlert, Users, Bot, Globe } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Props { stats: DashboardStats }

interface StatItem {
  label: string;
  value: number;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
  description?: string;
  trend?: string;
}

function Counter({ value }: { value: number }) {
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (node) {
      const controls = animate(0, value, {
        duration: 1.5,
        ease: 'easeOut',
        onUpdate(val) {
          node.textContent = Math.round(val).toLocaleString();
        },
      });
      return () => controls.stop();
    }
  }, [value]);

  return <span ref={nodeRef}>{value.toLocaleString()}</span>;
}

function StatCard({ item, index }: { item: StatItem; index: number }) {
  const Icon = item.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
      className="h-full"
    >
      <GlassCard hover className="h-full flex flex-col justify-between group relative overflow-hidden">
        {/* Soft background glow */}
        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none ${item.bgClass}`} />
        
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              {item.label}
            </p>
            <p className={`text-3xl font-extrabold leading-none ${item.colorClass}`}>
              <Counter value={item.value} />
            </p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${item.bgClass} border-white/10 shadow-inner`}>
            <Icon className={`w-5 h-5 ${item.colorClass}`} />
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-auto relative z-10">
          {item.trend && (
            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded">
              {item.trend}
            </span>
          )}
          {item.description && (
            <p className="text-slate-500 text-xs font-medium">{item.description}</p>
          )}
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
      icon: KeyRound,
      colorClass: 'text-blue-400',
      bgClass: 'bg-blue-500/20',
      description: 'All login attempts',
      trend: '+12%',
    },
    {
      label: 'High Risk Logins',
      value: stats.high_risk_logins,
      icon: AlertTriangle,
      colorClass: 'text-red-400',
      bgClass: 'bg-red-500/20',
      description: 'Score ≥ 50',
    },
    {
      label: 'Active Alerts',
      value: stats.active_alerts,
      icon: ShieldAlert,
      colorClass: 'text-purple-400',
      bgClass: 'bg-purple-500/20',
      description: 'Unread alerts',
    },
    {
      label: 'Unique Users',
      value: stats.unique_users,
      icon: Users,
      colorClass: 'text-cyan-400',
      bgClass: 'bg-cyan-500/20',
      description: 'Distinct accounts',
      trend: '+5%',
    },
    {
      label: 'Bot Detections',
      value: stats.bot_detections,
      icon: Bot,
      colorClass: 'text-amber-400',
      bgClass: 'bg-amber-500/20',
      description: 'Automated access',
    },
    {
      label: 'Geo Anomalies',
      value: stats.geo_anomalies,
      icon: Globe,
      colorClass: 'text-emerald-400',
      bgClass: 'bg-emerald-500/20',
      description: 'Impossible travel',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {items.map((item, i) => <StatCard key={item.label} item={item} index={i} />)}
    </div>
  );
}
