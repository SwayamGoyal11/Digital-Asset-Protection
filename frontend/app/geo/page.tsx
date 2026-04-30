'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { fetchEvents } from '@/lib/api';
import type { LoginEvent } from '@/types';
import AppShell from '@/components/AppShell';
import GlassCard from '@/components/ui/GlassCard';
import RiskBadge from '@/components/ui/RiskBadge';
import { format } from 'date-fns';
import { MapPin, AlertTriangle, ShieldCheck, Globe, Navigation, Clock, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

// Dynamic import for Leaflet (SSR incompatible)
const GeoMap = dynamic(() => import('@/components/geo/GeoMap'), { ssr: false, loading: () => (
  <div className="h-[480px] flex items-center justify-center text-slate-500 bg-white/[0.02] border border-white/5 rounded-xl border-dashed">
    <div className="flex flex-col items-center gap-4 animate-pulse">
      <Globe className="w-10 h-10 text-blue-500/50" />
      <span className="font-medium tracking-wider uppercase text-xs">Initializing Satellite Map…</span>
    </div>
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
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1 flex items-center gap-2">
          <Globe className="w-6 h-6 text-blue-500" />
          Geo <span className="gradient-text">Intelligence Map</span>
        </h1>
        <p className="text-slate-400 text-sm font-medium">
          {events.length} geolocated login events <span className="mx-2">•</span> {countries.length} countries <span className="mx-2">•</span> <span className="text-purple-400">{anomalies.length} velocity anomalies</span>
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Map */}
        <GlassCard className="xl:col-span-2 p-0 overflow-hidden relative">
          <div className="absolute top-4 left-4 z-[400] glass px-4 py-2 flex items-center gap-3">
             <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> <span className="text-[10px] text-slate-300 uppercase tracking-wider font-bold">Standard</span></div>
             <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> <span className="text-[10px] text-slate-300 uppercase tracking-wider font-bold">Suspicious</span></div>
             <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]" /> <span className="text-[10px] text-slate-300 uppercase tracking-wider font-bold">Anomaly</span></div>
          </div>
          {!loading && <GeoMap events={events} />}
        </GlassCard>

        {/* Right Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Geo anomalies list */}
          <GlassCard className="flex flex-col h-[300px]">
            <h3 className="font-bold text-lg tracking-tight mb-4 flex items-center gap-2 text-purple-400">
              <Activity className="w-5 h-5" /> Velocity Anomalies
            </h3>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-3">
              {anomalies.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-slate-500">
                   <ShieldCheck className="w-8 h-8 mb-2 opacity-50 text-emerald-500" />
                   <span className="text-xs font-medium">No impossible travel detected</span>
                 </div>
              ) : (
                anomalies.map((e, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                    key={e.id} 
                    className="flex flex-col gap-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl hover:bg-purple-500/20 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-slate-200 font-bold text-sm">User #{e.user_id}</span>
                        <div className="flex items-center gap-1 mt-1 text-slate-400 text-xs">
                          <MapPin className="w-3 h-3" /> {e.location?.city}, {e.location?.country}
                        </div>
                      </div>
                      <RiskBadge level={e.risk_level} score={e.risk_score} size="sm" />
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                      <Clock className="w-3 h-3" /> {format(new Date(e.timestamp), 'MMM d, HH:mm')}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </GlassCard>

          {/* Country breakdown */}
          <GlassCard className="flex-1">
            <h3 className="font-bold text-lg tracking-tight mb-4 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-blue-400" /> Login Origins
            </h3>
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[300px] custom-scrollbar pr-2">
              {countries.map((country, idx) => {
                const count = events.filter((e) => e.location?.country === country).length;
                const maxRisk = Math.max(...events.filter((e) => e.location?.country === country).map((e) => e.risk_score));
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                    key={country} 
                    className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex justify-between items-center hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-300 text-sm font-semibold">{country}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-100 font-bold text-lg leading-none">{count}</p>
                      <p className="text-slate-500 text-[10px] font-medium uppercase tracking-wider mt-1 flex items-center gap-1">
                        <AlertTriangle className={`w-3 h-3 ${maxRisk > 50 ? 'text-amber-500' : 'text-emerald-500'}`} /> Max {maxRisk.toFixed(0)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      </div>
    </AppShell>
  );
}
