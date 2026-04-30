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
    <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
      <table className="w-full text-left border-collapse min-w-[700px]">
        <thead>
          <tr className="border-b border-white/5">
            {['Time', 'User', 'Location', 'Device', 'IP', 'Risk', 'Scenario'].map((h) => (
              <th key={h} className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
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
              className={`border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors ${
                event.is_flagged ? 'bg-red-500/[0.02] hover:bg-red-500/[0.04]' : ''
              }`}
            >
              <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
                {format(new Date(event.timestamp), 'MMM d, HH:mm')}
              </td>
              <td className="py-3 px-4 text-xs font-medium text-slate-300">#{event.user_id}</td>
              <td className="py-3 px-4 text-xs text-slate-400">
                {event.location ? `${event.location.city}, ${event.location.country}` : '—'}
              </td>
              <td className="py-3 px-4 text-[10px] font-mono text-slate-500 truncate max-w-[100px]">
                {event.device_id ? event.device_id.slice(0, 12) + '…' : '—'}
              </td>
              <td className="py-3 px-4 text-[10px] font-mono text-slate-500">
                {event.ip_address || '—'}
              </td>
              <td className="py-3 px-4">
                <RiskBadge level={event.risk_level} score={event.risk_score} size="sm" />
              </td>
              <td className="py-3 px-4">
                {event.scenario && (
                  <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider">
                    {event.scenario.replace('_', ' ')}
                  </span>
                )}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
      {events.length === 0 && (
        <div className="flex justify-center items-center h-32 text-slate-500 text-sm">
          No login events yet.
        </div>
      )}
    </div>
  );
}
