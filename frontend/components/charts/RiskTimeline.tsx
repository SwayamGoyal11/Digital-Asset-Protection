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
    <div style={{
      background: 'rgba(10,15,30,0.95)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '10px',
      padding: '12px 16px',
      backdropFilter: 'blur(10px)',
    }}>
      <p style={{ color: '#64748b', fontSize: '11px', marginBottom: '4px' }}>{label}</p>
      <p style={{ color: getRiskColor(score), fontWeight: 700, fontSize: '18px' }}>
        {score.toFixed(1)} <span style={{ fontSize: '11px', opacity: 0.7 }}>risk score</span>
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
    <div style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="time"
            stroke="#334155"
            tick={{ fill: '#475569', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, 100]}
            stroke="#334155"
            tick={{ fill: '#475569', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={75} stroke="rgba(168,85,247,0.4)" strokeDasharray="4 4" label={{ value: 'Critical', fill: '#a855f7', fontSize: 10, position: 'right' }} />
          <ReferenceLine y={50} stroke="rgba(239,68,68,0.4)" strokeDasharray="4 4" />
          <ReferenceLine y={25} stroke="rgba(245,158,11,0.3)" strokeDasharray="4 4" />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#riskGradient)"
            dot={{ fill: '#3b82f6', r: 3, strokeWidth: 0 }}
            activeDot={{ fill: '#60a5fa', r: 5, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
