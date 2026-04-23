"""
SQLAlchemy ORM models for PostgreSQL/SQLite.

Tables:
  users           – registered accounts
  devices         – fingerprinted devices per user
  login_events    – every login attempt with risk metadata
  behavior_profiles – per-user behavioral baseline
  alerts          – generated fraud alerts
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime,
    JSON, ForeignKey, Boolean, Text
)
from sqlalchemy.orm import relationship
from db.database import Base


class User(Base):
    __tablename__ = "users"

    id           = Column(Integer, primary_key=True, index=True)
    email        = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at   = Column(DateTime, default=datetime.utcnow)
    is_active    = Column(Boolean, default=True)

    devices          = relationship("Device",          back_populates="user", cascade="all, delete-orphan")
    login_events     = relationship("LoginEvent",      back_populates="user", cascade="all, delete-orphan")
    behavior_profile = relationship("BehaviorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    alerts           = relationship("Alert",           back_populates="user", cascade="all, delete-orphan")


class Device(Base):
    __tablename__ = "devices"

    id          = Column(Integer, primary_key=True, index=True)
    device_id   = Column(String(255), index=True, nullable=False)   # FingerprintJS visitorId
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    first_seen  = Column(DateTime, default=datetime.utcnow)
    last_seen   = Column(DateTime, default=datetime.utcnow)
    trust_score = Column(Float, default=50.0)    # 0 (untrusted) → 100 (fully trusted)
    user_agent  = Column(Text, nullable=True)
    is_trusted  = Column(Boolean, default=False)

    user = relationship("User", back_populates="devices")


class LoginEvent(Base):
    __tablename__ = "login_events"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    device_id   = Column(String(255), nullable=True)
    ip_address  = Column(String(64), nullable=True)
    location    = Column(JSON, nullable=True)     # {city, country, lat, lon, isp}
    risk_score  = Column(Float, default=0.0)
    risk_level  = Column(String(16), default="LOW")  # LOW | MEDIUM | HIGH | CRITICAL
    factors     = Column(JSON, nullable=True)         # [{reason, impact}, ...]
    timestamp   = Column(DateTime, default=datetime.utcnow)
    is_flagged  = Column(Boolean, default=False)
    scenario    = Column(String(64), nullable=True)   # demo scenario label

    user = relationship("User", back_populates="login_events")


class BehaviorProfile(Base):
    __tablename__ = "behavior_profiles"

    id                  = Column(Integer, primary_key=True, index=True)
    user_id             = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    avg_typing_speed    = Column(Float, default=0.0)   # chars per second
    keystroke_variance  = Column(Float, default=0.0)   # std-dev of inter-key intervals (ms)
    avg_mouse_speed     = Column(Float, default=0.0)
    typical_location    = Column(JSON, nullable=True)  # {lat, lon, country}
    common_hours        = Column(JSON, nullable=True)  # [0..23] histogram
    session_count       = Column(Integer, default=0)
    updated_at          = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="behavior_profile")


class Alert(Base):
    __tablename__ = "alerts"

    id             = Column(Integer, primary_key=True, index=True)
    user_id        = Column(Integer, ForeignKey("users.id"), nullable=False)
    login_event_id = Column(Integer, ForeignKey("login_events.id"), nullable=True)
    alert_type     = Column(String(64))   # BOT | GEO_VELOCITY | MULTI_ACCOUNT | HIGH_RISK | NEW_DEVICE
    severity       = Column(String(16))   # LOW | MEDIUM | HIGH | CRITICAL
    message        = Column(Text)
    details        = Column(JSON, nullable=True)
    timestamp      = Column(DateTime, default=datetime.utcnow)
    is_read        = Column(Boolean, default=False)

    user = relationship("User", back_populates="alerts")
