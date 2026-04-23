'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { fetchUserDetail } from '@/lib/api';
import type { UserDetail } from '@/types';
import AppShell from '@/components/AppShell';
import GlassCard from '@/components/ui/GlassCard';
import RiskBadge from '@/components/ui/RiskBadge';
import RiskBreakdown from '@/components/charts/RiskBreakdown';
import LoginHistory from '@/components/dashboard/LoginHistory';
import { getRiskLevel } from '@/lib/riskColors';

export default function UserDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserDetail(Number(id))
      .then(setUser)
      .catch(() => router.push('/users'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <AppShell>
      <div style={{ textAlign: 'center', padding: '80px', color: '#475569' }}>Loading user profile…</div>
    </AppShell>
  );

  if (!user) return null;

  const latestFactors = user.recent_logins[0]?.factors ?? [];

  return (
    <AppShell>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800 }}>{user.email}</h1>
            <RiskBadge level={getRiskLevel(user.avg_risk_score)} score={user.avg_risk_score} size="md" />
          </div>
          <p style={{ color: '#475569', fontSize: '13px' }}>
            Account #{user.id} · Created {format(new Date(user.created_at), 'MMM d, yyyy')} · {user.login_count} logins
          </p>
        </div>
        <button onClick={() => router.back()} style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          color: '#64748b', borderRadius: '8px', padding: '8px 14px',
          cursor: 'pointer', fontSize: '12px',
        }}>
          ← Back
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Top row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          {/* Behavior profile */}
          <GlassCard>
            <h3 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '16px', color: '#94a3b8' }}>Behavior Profile</h3>
            {[
              { label: 'Avg Typing Speed', value: `${user.behavior_profile.avg_typing_speed.toFixed(2)} cps` },
              { label: 'Keystroke Variance', value: `${user.behavior_profile.keystroke_variance.toFixed(1)} ms` },
              { label: 'Sessions Analyzed', value: user.behavior_profile.session_count },
              { label: 'Typical Location', value: user.behavior_profile.typical_location
                  ? `${user.behavior_profile.typical_location.city}, ${user.behavior_profile.typical_location.country}`
                  : 'Unknown' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '12px' }}>
                <span style={{ color: '#64748b' }}>{label}</span>
                <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </GlassCard>

          {/* Devices */}
          <GlassCard>
            <h3 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '16px', color: '#94a3b8' }}>
              Devices ({user.devices.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {user.devices.map((d) => (
                <div key={d.device_id} style={{
                  background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
                  padding: '10px 12px', fontSize: '11px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#64748b', fontFamily: 'monospace' }}>{d.device_id.slice(0, 16)}…</span>
                    <span style={{ color: d.is_trusted ? '#22c55e' : '#f59e0b', fontWeight: 600 }}>
                      {d.is_trusted ? '✓ Trusted' : '⚠ Unknown'}
                    </span>
                  </div>
                  <div style={{ color: '#475569' }}>Trust: {d.trust_score.toFixed(0)}% · Last: {format(new Date(d.last_seen), 'MMM d')}</div>
                </div>
              ))}
              {user.devices.length === 0 && <p style={{ color: '#475569', fontSize: '12px' }}>No devices registered</p>}
            </div>
          </GlassCard>

          {/* Latest risk breakdown */}
          <GlassCard>
            <h3 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '12px', color: '#94a3b8' }}>Latest Risk Factors</h3>
            <RiskBreakdown factors={latestFactors as any} />
          </GlassCard>
        </div>

        {/* Alerts */}
        {user.alerts.length > 0 && (
          <GlassCard>
            <h3 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '16px' }}>Alerts for This User</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {user.alerts.map((a) => (
                <div key={a.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', background: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px', fontSize: '12px',
                }}>
                  <span style={{ color: '#94a3b8' }}>{a.message}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <RiskBadge level={a.severity as any} size="sm" />
                    <span style={{ color: '#475569' }}>{format(new Date(a.timestamp), 'MMM d, HH:mm')}</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Login History */}
        <GlassCard>
          <LoginHistory events={user.recent_logins} />
        </GlassCard>
      </div>
    </AppShell>
  );
}
