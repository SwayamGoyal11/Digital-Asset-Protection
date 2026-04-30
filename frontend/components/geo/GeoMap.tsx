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
    <div className="w-full h-full min-h-[480px]">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        className="w-full h-full bg-[#0a0f1e] z-0"
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
              color:     line.anomaly ? '#a855f7' : 'rgba(59,130,246,0.3)',
              weight:    line.anomaly ? 2 : 1.5,
              dashArray: line.anomaly ? undefined : '4 6',
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
              radius={event.risk_score > 50 ? 12 : 8}
              pathOptions={{
                color: event.scenario === 'geo_anomaly' ? '#a855f7' : color,
                fillColor: color,
                fillOpacity: 0.7,
                weight: event.scenario === 'geo_anomaly' ? 3 : 1.5,
              }}
            >
              <Popup className="custom-popup">
                <div className="flex flex-col gap-2 min-w-[180px]">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-1">
                    <span className="font-bold text-slate-200">User #{event.user_id}</span>
                    {event.scenario === 'geo_anomaly' && <span className="bg-purple-500/20 text-purple-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-purple-500/30">ANOMALY</span>}
                  </div>
                  
                  <div className="text-xs text-slate-300 flex flex-col gap-1.5">
                    <div className="flex items-start gap-2">
                      <span className="opacity-50">📍</span>
                      <span>{event.location.city}, {event.location.country}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="opacity-50">🌐</span>
                      <span className="font-mono text-[10px]">{event.ip_address}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="opacity-50 text-xs uppercase font-bold tracking-wider">Risk:</span>
                      <span className="font-bold" style={{ color }}>{event.risk_score.toFixed(1)} <span className="text-[10px] opacity-70 font-normal">({event.risk_level})</span></span>
                    </div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      
      {/* Global styles for Leaflet custom popup */}
      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          background: rgba(10, 15, 30, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #f8fafc;
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
          padding: 0;
        }
        .leaflet-popup-content {
          margin: 12px 16px;
        }
        .leaflet-popup-tip {
          background: rgba(10, 15, 30, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .leaflet-container a.leaflet-popup-close-button {
          color: #94a3b8;
          padding: 8px;
        }
        .leaflet-container a.leaflet-popup-close-button:hover {
          color: #f8fafc;
        }
      `}</style>
    </div>
  );
}
