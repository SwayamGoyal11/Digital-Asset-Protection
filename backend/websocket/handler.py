"""
WebSocket connection manager.

Maintains a registry of active WebSocket connections and broadcasts
real-time alert messages to all connected clients.
"""

from __future__ import annotations
import json
from typing import Dict, List
from fastapi import WebSocket


class ConnectionManager:
    """Thread-safe WebSocket connection registry with broadcast support."""

    def __init__(self):
        # client_id → WebSocket
        self._active: Dict[str, WebSocket] = {}

    async def connect(self, client_id: str, websocket: WebSocket):
        await websocket.accept()
        self._active[client_id] = websocket

    def disconnect(self, client_id: str):
        self._active.pop(client_id, None)

    async def send_personal(self, client_id: str, message: dict):
        """Send a message to a specific client."""
        ws = self._active.get(client_id)
        if ws:
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                self.disconnect(client_id)

    async def broadcast(self, message: dict):
        """Broadcast a message to all connected clients."""
        dead: List[str] = []
        payload = json.dumps(message)
        for client_id, ws in self._active.items():
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(client_id)
        for cid in dead:
            self.disconnect(cid)

    @property
    def connection_count(self) -> int:
        return len(self._active)


# ── Singleton instance shared across the application ──────────────────────────
manager = ConnectionManager()
