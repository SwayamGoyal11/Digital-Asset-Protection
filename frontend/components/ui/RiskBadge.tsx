'use client';

import type { RiskLevel } from '@/types';
import { RISK_COLORS, RISK_BG, RISK_BORDER, RISK_LABELS } from '@/lib/riskColors';

interface Props {
  level: RiskLevel;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'text-[10px] px-2 py-0.5 rounded-md',
  md: 'text-xs px-3 py-1 rounded-lg',
  lg: 'text-sm px-4 py-1.5 rounded-xl',
};

export default function RiskBadge({ level, score, size = 'md' }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold tracking-wider uppercase whitespace-nowrap shadow-sm ${sizes[size]}`}
      style={{
        background: RISK_BG[level],
        color: RISK_COLORS[level],
        border: `1px solid ${RISK_BORDER[level]}`,
      }}
    >
      <span
        className="pulse-dot shadow-sm"
        style={{ background: RISK_COLORS[level], width: '6px', height: '6px', boxShadow: `0 0 6px ${RISK_COLORS[level]}` }}
      />
      {RISK_LABELS[level]}
      {score !== undefined && (
        <span className="opacity-80 ml-0.5">({score.toFixed(0)})</span>
      )}
    </span>
  );
}
