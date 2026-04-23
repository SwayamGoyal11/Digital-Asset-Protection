'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from 'react-leaflet';
import type { LoginEvent } from '@/types';
import { RISK_COLORS } from '@/lib/riskColors';
import 'leaflet/dist/leaflet.css';

interface Props {
  events: LoginEvent[];
}

// Group events by user to draw travel lines
function buildTravelLines(events: LoginEvent[]) {
  const byUser: Record<number, LoginEvent[]> = {};
  for (const e of events) {
    if (!byUser[e.user_id]) byUser[e.user_id] = [];
    byUser[e.user_id].push(e);
  }
  const lines: { positions: [number, number][]; anomaly: boolean }[] = [];
  for (const userEvents of Object.values(byUser)) {
    const sorted = [...userEvents].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (prev.location && curr.location) {
        lines.push({
          positions: [
            [prev.location.lat, prev.location.lon],
            [curr.location.lat, curr.location.lon],
          ],
          anomaly: curr.scenario === 'geo_anomaly',
        });
      }
    }
  }
  return lines;
}

export default function GeoMap({ events }: Props) {
  const lines = buildTravelLines(events);

  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', height: '480px' }}>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%', background: '#0a0f1e' }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; CartoDB"
        />

        {/* Travel path lines */}
        {lines.map((line, i) => (
          <Polyline
            key={i}
            positions={line.positions}
            pathOptions={{
              color:     line.anomaly ? '#a855f7' : 'rgba(59,130,246,0.4)',
              weight:    line.anomaly ? 2 : 1,
              dashArray: line.anomaly ? undefined : '4 4',
            }}
          />
        ))}

        {/* Login event markers */}
        {events.map((event) => {
          if (!event.location) return null;
          const color = RISK_COLORS[event.risk_level] || '#3b82f6';
          return (
            <CircleMarker
              key={event.id}
              center={[event.location.lat, event.location.lon]}
              radius={event.risk_score > 50 ? 10 : 7}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.8,
                weight: event.scenario === 'geo_anomaly' ? 2 : 1,
              }}
            >
              <Popup>
                <div style={{ fontFamily: 'sans-serif', fontSize: '12px', minWidth: '160px' }}>
                  <strong>User #{event.user_id}</strong>
                  <br />📍 {event.location.city}, {event.location.country}
                  <br />🌐 {event.ip_address}
                  <br />⚡ Risk: <span style={{ color, fontWeight: 700 }}>{event.risk_score.toFixed(1)} ({event.risk_level})</span>
                  {event.scenario && <><br />🏷️ {event.scenario.replace('_', ' ')}</>}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
