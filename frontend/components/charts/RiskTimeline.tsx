'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart, ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';
import type { DashboardData } from '@/types';
import { getRiskColor } from '@/lib/riskColors';

interface Props {
  data: DashboardData['risk_trend'];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const score = payload[0]?.value ?? 0;
  return (
    <div className="glass p-3 !bg-[#0a0f1e]/90 shadow-xl border-white/10">
      <p className="text-slate-400 text-xs font-medium mb-1">{label}</p>
      <p style={{ color: getRiskColor(score) }} className="font-extrabold text-xl flex items-baseline gap-1.5">
        {score.toFixed(1)} <span className="text-xs opacity-70 font-medium">risk score</span>
      </p>
    </div>
  );
};

export default function RiskTimeline({ data }: Props) {
  const chartData = data.map((d) => ({
    time: format(new Date(d.timestamp), 'HH:mm'),
    score: Math.round(d.risk_score * 10) / 10,
    level: d.risk_level,
  }));

  return (
    <div className="w-full h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="time"
            stroke="#334155"
            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            domain={[0, 100]}
            stroke="#334155"
            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
            tickLine={false}
            axisLine={false}
            dx={-10}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
          <ReferenceLine y={75} stroke="rgba(168,85,247,0.3)" strokeDasharray="4 4" label={{ value: 'CRITICAL', fill: '#a855f7', fontSize: 10, fontWeight: 700, position: 'right' }} />
          <ReferenceLine y={50} stroke="rgba(239,68,68,0.2)" strokeDasharray="4 4" />
          <ReferenceLine y={25} stroke="rgba(245,158,11,0.1)" strokeDasharray="4 4" />
          <Area
            type="monotone"
            dataKey="score"
            stroke="url(#strokeGradient)"
            strokeWidth={3}
            fill="url(#riskGradient)"
            dot={{ fill: '#0f172a', r: 4, strokeWidth: 2, stroke: '#3b82f6' }}
            activeDot={{ fill: '#3b82f6', r: 6, strokeWidth: 0, className: 'animate-pulse' }}
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
