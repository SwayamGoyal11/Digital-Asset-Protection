'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { fetchEvents } from '@/lib/api';
import type { LoginEvent } from '@/types';
import AppShell from '@/components/AppShell';
import GlassCard from '@/components/ui/GlassCard';
import RiskBadge from '@/components/ui/RiskBadge';
import { RISK_COLORS } from '@/lib/riskColors';
import { format } from 'date-fns';

// Dynamic import for Leaflet (SSR incompatible)
const GeoMap = dynamic(() => import('@/components/geo/GeoMap'), { ssr: false, loading: () => (
  <div style={{ height: '480px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
    Loading map…
  </div>
) });

export default function GeoPage() {
  const [events, setEvents]   = useState<LoginEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents({ limit: 100 }).then((d) => {
      setEvents(d.filter((e) => e.location && e.location.lat && e.location.lon));
      setLoading(false);
    });
  }, []);

  const anomalies = events.filter((e) => e.scenario === 'geo_anomaly');
  const countries = [...new Set(events.map((e) => e.location?.country).filter(Boolean))];

  return (
    <AppShell>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>
          Geo <span className="gradient-text">Intelligence Map</span>
        </h1>
        <p style={{ color: '#475569', fontSize: '13px' }}>
          {events.length} geolocated login events · {countries.length} countries · {anomalies.length} velocity anomalies
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Map */}
        <GlassCard>
          {!loading && <GeoMap events={events} />}
        </GlassCard>

        {/* Geo anomalies list */}
        {anomalies.length > 0 && (
          <GlassCard>
            <h3 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '16px' }}>🚨 Velocity Anomalies</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {anomalies.map((e) => (
                <div key={e.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 14px',
                  background: 'rgba(168,85,247,0.08)',
                  border: '1px solid rgba(168,85,247,0.2)',
                  borderRadius: '10px', fontSize: '12px',
                }}>
                  <div>
                    <span style={{ color: '#e2e8f0', fontWeight: 600 }}>User #{e.user_id}</span>
                    <span style={{ color: '#64748b', marginLeft: '12px' }}>
                      {e.location?.city}, {e.location?.country}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <RiskBadge level={e.risk_level} score={e.risk_score} size="sm" />
                    <span style={{ color: '#475569' }}>{format(new Date(e.timestamp), 'MMM d, HH:mm')}</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Country breakdown */}
        <GlassCard>
          <h3 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '16px' }}>Login Origins</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
            {countries.map((country) => {
              const count = events.filter((e) => e.location?.country === country).length;
              const maxRisk = Math.max(...events.filter((e) => e.location?.country === country).map((e) => e.risk_score));
              return (
                <div key={country} style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '10px', padding: '12px 14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>🌐 {country}</span>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '16px' }}>{count}</p>
                    <p style={{ color: '#475569', fontSize: '10px' }}>max {maxRisk.toFixed(0)} risk</p>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>
    </AppShell>
  );
}
