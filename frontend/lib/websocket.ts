/**
 * WebSocket hook for real-time alert streaming.
 *
 * Usage:
 *   const { alerts, connected } = useAlertStream();
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Alert } from '@/types';

const WS_BASE =
  process.env.NEXT_PUBLIC_WS_URL ??
  (process.env.NODE_ENV === 'development' ? 'ws://localhost:8000/api/ws' : '');

interface WSMessage {
  type: string;
  [key: string]: unknown;
}

export function useAlertStream() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const clientId = useRef(`dashboard-${Math.random().toString(36).slice(2)}`);

  const connect = useCallback(() => {
    if (!WS_BASE) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(`${WS_BASE}/${clientId.current}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      // Auto-reconnect after 3 seconds
      setTimeout(connect, 3000);
    };
    ws.onerror = () => ws.close();

    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        if (msg.type === 'ALERT') {
          const newAlert: Alert = {
            id:             msg.id as number,
            user_id:        msg.user_id as number,
            login_event_id: msg.login_event_id as number | null,
            alert_type:     msg.alert_type as Alert['alert_type'],
            severity:       msg.severity as Alert['severity'],
            message:        msg.message as string,
            details:        msg.details as Record<string, unknown>,
            timestamp:      msg.timestamp as string,
            is_read:        false,
          };
          setAlerts((prev) => [newAlert, ...prev].slice(0, 50));
        }
      } catch {
        // Ignore malformed messages
      }
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  const clearAlerts = useCallback(() => setAlerts([]), []);

  return { alerts, connected, clearAlerts };
}
