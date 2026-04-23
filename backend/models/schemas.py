"""
Pydantic v2 request/response schemas.
These are the contracts between the frontend and the API.
"""

from __future__ import annotations
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, EmailStr, Field


# ─── Auth / User ──────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str


# ─── Behavior / Biometrics ────────────────────────────────────────────────────

class KeystrokeEvent(BaseModel):
    key: str
    timestamp: float          # epoch ms
    event_type: str           # keydown | keyup


class MouseEvent(BaseModel):
    x: float
    y: float
    timestamp: float


class BehaviorPayload(BaseModel):
    keystrokes: List[KeystrokeEvent] = []
    mouse_movements: List[MouseEvent] = []
    form_fill_duration_ms: Optional[float] = None


# ─── Collect Data (device fingerprint + behavior) ─────────────────────────────

class CollectDataRequest(BaseModel):
    user_id: Optional[int] = None
    device_id: str = Field(..., description="FingerprintJS visitorId")
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    behavior: Optional[BehaviorPayload] = None


# ─── Login ────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    device_id: str
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    behavior: Optional[BehaviorPayload] = None


# ─── Risk Engine ──────────────────────────────────────────────────────────────

class RiskFactor(BaseModel):
    reason: str
    impact: float


class RiskScoreResponse(BaseModel):
    user_id: int
    risk_score: float
    risk_level: str          # LOW | MEDIUM | HIGH | CRITICAL
    factors: List[RiskFactor]
    timestamp: datetime


# ─── Login Event ──────────────────────────────────────────────────────────────

class LoginEventOut(BaseModel):
    id: int
    user_id: int
    device_id: Optional[str]
    ip_address: Optional[str]
    location: Optional[Dict[str, Any]]
    risk_score: float
    risk_level: str
    factors: Optional[List[RiskFactor]]
    timestamp: datetime
    is_flagged: bool
    scenario: Optional[str]

    model_config = {"from_attributes": True}


# ─── Alert ────────────────────────────────────────────────────────────────────

class AlertOut(BaseModel):
    id: int
    user_id: int
    login_event_id: Optional[int]
    alert_type: str
    severity: str
    message: str
    details: Optional[Dict[str, Any]]
    timestamp: datetime
    is_read: bool

    model_config = {"from_attributes": True}


# ─── Dashboard ────────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_logins: int
    high_risk_logins: int
    active_alerts: int
    unique_users: int
    bot_detections: int
    geo_anomalies: int


class DashboardData(BaseModel):
    stats: DashboardStats
    recent_events: List[LoginEventOut]
    recent_alerts: List[AlertOut]
    risk_trend: List[Dict[str, Any]]   # [{timestamp, avg_risk_score}, ...]


# ─── User Detail ──────────────────────────────────────────────────────────────

class UserDetailOut(BaseModel):
    id: int
    email: str
    created_at: datetime
    login_count: int
    avg_risk_score: float
    devices: List[Dict[str, Any]]
    behavior_profile: Optional[Dict[str, Any]]
    recent_logins: List[LoginEventOut]
    alerts: List[AlertOut]
