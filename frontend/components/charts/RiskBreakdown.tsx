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
    <div style={{
      background: 'rgba(10,15,30,0.95)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '10px',
      padding: '12px 16px',
    }}>
      <p style={{ color: '#f1f5f9', fontWeight: 600, marginBottom: '4px', fontSize: '13px' }}>{item.payload.reason}</p>
      <p style={{ color: '#3b82f6', fontWeight: 700 }}>+{item.value} pts</p>
      {item.payload.percentage && (
        <p style={{ color: '#64748b', fontSize: '11px' }}>{item.payload.percentage}% of total risk</p>
      )}
    </div>
  );
};

export default function RiskBreakdown({ factors }: Props) {
  if (!factors || factors.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: '#475569', fontSize: '13px' }}>
        No risk factors detected
      </div>
    );
  }

  const data = factors.map((f) => ({
    reason: f.reason.length > 20 ? f.reason.slice(0, 20) + '…' : f.reason,
    fullReason: f.reason,
    impact: f.impact,
    percentage: f.percentage,
  }));

  return (
    <div style={{ width: '100%', height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
          <XAxis type="number" stroke="#334155" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="reason"
            width={130}
            stroke="#334155"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="impact" radius={[0, 6, 6, 0]} maxBarSize={20}>
            {data.map((entry, index) => (
              <Cell key={index} fill={getRiskColor(entry.impact * 2)} fillOpacity={0.9} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
