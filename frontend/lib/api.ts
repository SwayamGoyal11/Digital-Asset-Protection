/**
 * Axios API client.
 * All requests go to NEXT_PUBLIC_API_URL (defaults to http://localhost:8000/api).
 */

import axios from 'axios';
import type { DashboardData, LoginResponse, Alert, User, UserDetail, LoginEvent } from '@/types';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token if present in localStorage
if (typeof window !== 'undefined') {
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('ag_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function register(email: string, password: string) {
  const { data } = await api.post('/register', { email, password });
  return data;
}

export async function loginUser(payload: {
  email: string;
  password: string;
  device_id: string;
  user_agent?: string;
  ip_address?: string;
  behavior?: unknown;
}): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/login', payload);
  return data;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function fetchDashboard(): Promise<DashboardData> {
  const { data } = await api.get<DashboardData>('/dashboard-data');
  return data;
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export async function fetchAlerts(params?: { skip?: number; limit?: number; severity?: string }): Promise<Alert[]> {
  const { data } = await api.get<Alert[]>('/alerts', { params });
  return data;
}

export async function markAlertRead(id: number) {
  await api.patch(`/alerts/${id}/read`);
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function fetchUsers(): Promise<User[]> {
  const { data } = await api.get<User[]>('/users');
  return data;
}

export async function fetchUserDetail(id: number): Promise<UserDetail> {
  const { data } = await api.get<UserDetail>(`/users/${id}`);
  return data;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export async function fetchEvents(params?: { skip?: number; limit?: number; user_id?: number }): Promise<LoginEvent[]> {
  const { data } = await api.get<LoginEvent[]>('/events', { params });
  return data;
}

// ─── Risk Score ───────────────────────────────────────────────────────────────

export async function fetchRiskScore(userId: number) {
  const { data } = await api.get(`/risk-score/${userId}`);
  return data;
}

export default api;
