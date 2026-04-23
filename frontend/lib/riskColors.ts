import type { RiskLevel } from '@/types';

export const RISK_COLORS: Record<RiskLevel, string> = {
  LOW:      '#22c55e',
  MEDIUM:   '#f59e0b',
  HIGH:     '#ef4444',
  CRITICAL: '#a855f7',
};

export const RISK_BG: Record<RiskLevel, string> = {
  LOW:      'rgba(34,197,94,0.15)',
  MEDIUM:   'rgba(245,158,11,0.15)',
  HIGH:     'rgba(239,68,68,0.15)',
  CRITICAL: 'rgba(168,85,247,0.15)',
};

export const RISK_BORDER: Record<RiskLevel, string> = {
  LOW:      'rgba(34,197,94,0.4)',
  MEDIUM:   'rgba(245,158,11,0.4)',
  HIGH:     'rgba(239,68,68,0.4)',
  CRITICAL: 'rgba(168,85,247,0.4)',
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  LOW:      'Low Risk',
  MEDIUM:   'Medium Risk',
  HIGH:     'High Risk',
  CRITICAL: 'Critical',
};

export function getRiskColor(score: number): string {
  if (score >= 75) return RISK_COLORS.CRITICAL;
  if (score >= 50) return RISK_COLORS.HIGH;
  if (score >= 25) return RISK_COLORS.MEDIUM;
  return RISK_COLORS.LOW;
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 75) return 'CRITICAL';
  if (score >= 50) return 'HIGH';
  if (score >= 25) return 'MEDIUM';
  return 'LOW';
}
