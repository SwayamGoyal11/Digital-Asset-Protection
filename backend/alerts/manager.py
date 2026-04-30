"""
Alert manager.

Creates alerts in the database and immediately broadcasts them
to all connected WebSocket clients for real-time dashboard updates.
"""

from __future__ import annotations
from datetime import datetime
from sqlalchemy.orm import Session
from models.db_models import Alert
from websocket.handler import manager
from db.mongodb import mongo_db


async def create_and_broadcast_alert(
    db: Session,
    user_id: int,
    alert_type: str,
    severity: str,
    message: str,
    login_event_id: int | None = None,
    details: dict | None = None,
) -> Alert:
    """
    Persist an alert to the database and push it via WebSocket.

    Alert types: BOT | GEO_VELOCITY | MULTI_ACCOUNT | HIGH_RISK | NEW_DEVICE
    Severities:  LOW | MEDIUM | HIGH | CRITICAL
    """
    alert = Alert(
        user_id=user_id,
        login_event_id=login_event_id,
        alert_type=alert_type,
        severity=severity,
        message=message,
        details=details or {},
        timestamp=datetime.utcnow(),
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    # ── Mirror to MongoDB Atlas ────────────────────────────────────────────
    mongo_db.alerts.insert_one({
        "sql_id":        alert.id,
        "user_id":       alert.user_id,
        "login_event_id": alert.login_event_id,
        "alert_type":    alert.alert_type,
        "severity":      alert.severity,
        "message":       alert.message,
        "details":       alert.details,
        "timestamp":     alert.timestamp,
        "is_read":       alert.is_read,
    })

    # Broadcast to all dashboard WebSocket clients
    await manager.broadcast({
        "type":           "ALERT",
        "id":             alert.id,
        "user_id":        alert.user_id,
        "alert_type":     alert.alert_type,
        "severity":       alert.severity,
        "message":        alert.message,
        "details":        alert.details,
        "timestamp":      alert.timestamp.isoformat(),
        "login_event_id": alert.login_event_id,
    })

    return alert


async def maybe_alert(
    db: Session,
    user_id: int,
    risk_score: float,
    risk_level: str,
    factors: list,
    login_event_id: int | None = None,
    is_new_device: bool = False,
    is_bot: bool = False,
    geo_anomaly: bool = False,
    multi_account: bool = False,
):
    """
    Determine which alerts to fire based on the risk assessment.
    Multiple alert types can fire in a single session.
    """
    if is_bot:
        await create_and_broadcast_alert(
            db, user_id, "BOT", "CRITICAL",
            "Bot-like behavior detected during login attempt.",
            login_event_id, {"factors": factors}
        )

    if geo_anomaly:
        await create_and_broadcast_alert(
            db, user_id, "GEO_VELOCITY", "HIGH",
            "Impossible travel detected between consecutive logins.",
            login_event_id, {"factors": factors}
        )

    if multi_account:
        await create_and_broadcast_alert(
            db, user_id, "MULTI_ACCOUNT", "HIGH",
            "Multiple accounts detected on the same device.",
            login_event_id, {}
        )

    if is_new_device and risk_level in ("MEDIUM", "HIGH", "CRITICAL"):
        await create_and_broadcast_alert(
            db, user_id, "NEW_DEVICE", "MEDIUM",
            "Login from a new, unrecognized device.",
            login_event_id, {}
        )

    if risk_level in ("HIGH", "CRITICAL") and not is_bot and not geo_anomaly:
        await create_and_broadcast_alert(
            db, user_id, "HIGH_RISK", risk_level,
            f"High-risk login detected. Score: {risk_score:.1f}.",
            login_event_id, {"factors": factors}
        )
