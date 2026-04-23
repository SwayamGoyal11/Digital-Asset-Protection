'use client';

import type { RiskLevel } from '@/types';
import { RISK_COLORS, RISK_BG, RISK_BORDER, RISK_LABELS } from '@/lib/riskColors';

interface Props {
  level: RiskLevel;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: { fontSize: '10px', padding: '2px 8px', borderRadius: '6px' },
  md: { fontSize: '12px', padding: '4px 12px', borderRadius: '8px' },
  lg: { fontSize: '14px', padding: '6px 16px', borderRadius: '10px' },
};

export default function RiskBadge({ level, score, size = 'md' }: Props) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: RISK_BG[level],
        color: RISK_COLORS[level],
        border: `1px solid ${RISK_BORDER[level]}`,
        fontWeight: 600,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        ...sizes[size],
      }}
    >
      <span
        className="pulse-dot"
        style={{ background: RISK_COLORS[level], width: '6px', height: '6px' }}
      />
      {RISK_LABELS[level]}
      {score !== undefined && (
        <span style={{ opacity: 0.8, marginLeft: '2px' }}>({score.toFixed(0)})</span>
      )}
    </span>
  );
}
