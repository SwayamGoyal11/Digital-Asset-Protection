'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useAlertStream } from '@/lib/websocket';
import RiskBadge from '@/components/ui/RiskBadge';
import type { Alert } from '@/types';
import { Bot, Globe, Users, AlertTriangle, Smartphone, ChevronRight, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ALERT_ICONS: Record<string, LucideIcon> = {
  BOT:           Bot,
  GEO_VELOCITY:  Globe,
  MULTI_ACCOUNT: Users,
  HIGH_RISK:     AlertTriangle,
  NEW_DEVICE:    Smartphone,
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
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse'}`} />
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{connected ? 'Live Feed Active' : 'Reconnecting…'}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-4">
        <AnimatePresence mode="popLayout">
          {all.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-48 text-slate-500 bg-white/[0.02] border border-white/5 rounded-xl border-dashed"
            >
              <ShieldCheck className="w-8 h-8 mb-2 opacity-50" />
              <span className="text-sm font-medium">No alerts yet. Monitoring active…</span>
            </motion.div>
          )}
          {all.map((alert) => {
            const Icon = ALERT_ICONS[alert.alert_type] || AlertTriangle;
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="group bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] rounded-xl p-4 flex gap-4 items-start transition-colors relative overflow-hidden"
              >
                {alert.severity === 'CRITICAL' && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                )}
                <div className={`p-2 rounded-lg bg-white/5 border border-white/10 shrink-0 ${alert.severity === 'CRITICAL' ? 'text-purple-400' : 'text-blue-400'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-sm text-slate-200 capitalize tracking-tight">
                      {alert.alert_type.replace('_', ' ').toLowerCase()}
                    </span>
                    <RiskBadge level={alert.severity} size="sm" />
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed mb-2">{alert.message}</p>
                  <div className="flex justify-between items-center">
                    <p className="text-slate-500 text-[10px] font-medium uppercase tracking-wider">
                      {format(new Date(alert.timestamp), 'MMM d, HH:mm:ss')} <span className="mx-1">•</span> User #{alert.user_id}
                    </p>
                    <button className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center text-[11px] font-bold uppercase tracking-wider hover:text-blue-300">
                      Investigate <ChevronRight className="w-3 h-3 ml-0.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
