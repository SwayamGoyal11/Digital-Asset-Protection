'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import type { RiskFactor } from '@/types';
import { getRiskColor } from '@/lib/riskColors';

interface Props {
  factors: RiskFactor[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="glass p-3 !bg-[#0a0f1e]/90 shadow-xl border-white/10">
      <p className="text-slate-200 font-semibold mb-1 text-xs">{item.payload.reason}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-blue-400 font-bold text-lg">+{item.value} pts</p>
        {item.payload.percentage && (
          <p className="text-slate-500 text-xs font-medium">{item.payload.percentage}% of risk</p>
        )}
      </div>
    </div>
  );
};

export default function RiskBreakdown({ factors }: Props) {
  if (!factors || factors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-slate-500 bg-white/[0.02] border border-white/5 rounded-xl border-dashed">
        <span className="text-2xl mb-2 opacity-50">🛡️</span>
        <span className="text-sm font-medium">No risk factors detected</span>
      </div>
    );
  }

  const data = factors.map((f) => ({
    reason: f.reason.length > 25 ? f.reason.slice(0, 25) + '…' : f.reason,
    fullReason: f.reason,
    impact: f.impact,
    percentage: f.percentage,
  }));

  return (
    <div className="w-full h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
          <defs>
            {data.map((entry, index) => {
              const color = getRiskColor(entry.impact * 2);
              return (
                <linearGradient key={`gradient-${index}`} id={`colorUv-${index}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={color} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={color} stopOpacity={1} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
          <XAxis type="number" stroke="#334155" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="reason"
            width={140}
            stroke="#334155"
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
          <Bar dataKey="impact" radius={[0, 4, 4, 0]} maxBarSize={16} animationDuration={1000}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={`url(#colorUv-${index})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
