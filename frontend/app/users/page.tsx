'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchUsers } from '@/lib/api';
import AppShell from '@/components/AppShell';
import GlassCard from '@/components/ui/GlassCard';
import RiskBadge from '@/components/ui/RiskBadge';
import type { User } from '@/types';
import { getRiskLevel } from '@/lib/riskColors';

export default function UsersPage() {
  const [users, setUsers]   = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers().then((d) => { setUsers(d); setLoading(false); });
  }, []);

  return (
    <AppShell>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>
          User <span className="gradient-text">Risk Profiles</span>
        </h1>
        <p style={{ color: '#475569', fontSize: '13px' }}>{users.length} registered accounts</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#475569' }}>Loading users…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {users.map((u) => (
            <Link key={u.id} href={`/users/${u.id}`} style={{ textDecoration: 'none' }}>
              <GlassCard hover>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{
                    width: '40px', height: '40px',
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(139,92,246,0.3))',
                    borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px',
                  }}>
                    👤
                  </div>
                  <RiskBadge level={getRiskLevel(u.avg_risk_score)} score={u.avg_risk_score} size="sm" />
                </div>
                <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px', color: '#f1f5f9' }}>{u.email}</p>
                <p style={{ color: '#475569', fontSize: '11px', marginBottom: '12px' }}>ID #{u.id}</p>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div>
                    <p style={{ color: '#475569', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Logins</p>
                    <p style={{ color: '#94a3b8', fontWeight: 600, fontSize: '16px' }}>{u.login_count}</p>
                  </div>
                  <div>
                    <p style={{ color: '#475569', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Risk</p>
                    <p style={{ fontWeight: 600, fontSize: '16px', color: '#3b82f6' }}>{u.avg_risk_score.toFixed(1)}</p>
                  </div>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
