/**
 * Shared TypeScript interfaces for the VaultX platform.
 */

export interface RiskFactor {
  reason: string;
  impact: number;
  percentage?: number;
}

export interface LoginEvent {
  id: number;
  user_id: number;
  device_id: string | null;
  ip_address: string | null;
  location: GeoLocation | null;
  risk_score: number;
  risk_level: RiskLevel;
  factors: RiskFactor[] | null;
  timestamp: string;
  is_flagged: boolean;
  scenario: string | null;
}

export interface GeoLocation {
  country: string;
  city: string;
  lat: number;
  lon: number;
  isp?: string;
  timezone?: string;
  query?: string;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Alert {
  id: number;
  user_id: number;
  login_event_id: number | null;
  alert_type: AlertType;
  severity: RiskLevel;
  message: string;
  details: Record<string, unknown> | null;
  timestamp: string;
  is_read: boolean;
}

export type AlertType = 'BOT' | 'GEO_VELOCITY' | 'MULTI_ACCOUNT' | 'HIGH_RISK' | 'NEW_DEVICE';

export interface DashboardStats {
  total_logins: number;
  high_risk_logins: number;
  active_alerts: number;
  unique_users: number;
  bot_detections: number;
  geo_anomalies: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recent_events: LoginEvent[];
  recent_alerts: Alert[];
  risk_trend: { timestamp: string; risk_score: number; risk_level: RiskLevel }[];
}

export interface User {
  id: number;
  email: string;
  created_at: string;
  login_count: number;
  avg_risk_score: number;
}

export interface DeviceRecord {
  device_id: string;
  trust_score: number;
  first_seen: string;
  last_seen: string;
  is_trusted: boolean;
}

export interface BehaviorProfile {
  avg_typing_speed: number;
  keystroke_variance: number;
  typical_location: GeoLocation | null;
  session_count: number;
}

export interface UserDetail extends User {
  devices: DeviceRecord[];
  behavior_profile: BehaviorProfile;
  recent_logins: LoginEvent[];
  alerts: Alert[];
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  email: string;
  risk_score: number;
  risk_level: RiskLevel;
  color: string;
  summary: string;
  factors: RiskFactor[];
  geo: {
    location: GeoLocation;
    geo_anomaly: boolean;
    distance_km: number;
    speed_kmh: number;
  };
  device: {
    device_id: string;
    is_new: boolean;
    trust_score: number;
  };
}

export interface KeystrokeEvent {
  key: string;
  timestamp: number;
  event_type: 'keydown' | 'keyup';
}

export interface MouseEventData {
  x: number;
  y: number;
  timestamp: number;
}

export interface BehaviorPayload {
  keystrokes: KeystrokeEvent[];
  mouse_movements: MouseEventData[];
  form_fill_duration_ms: number | null;
}
