"""
All REST API routes for Antigravity AI.

Endpoints:
  POST /collect-data          – ingest device fingerprint + behavior payload
  POST /register              – create new user
  POST /login                 – authenticate, run risk engine, return score
  GET  /risk-score/{user_id}  – latest risk score for a user
  GET  /alerts                – paginated alerts list
  GET  /dashboard-data        – aggregate stats for the dashboard
  GET  /users/{user_id}       – full user detail
  GET  /events                – paginated login event history
  WS   /ws/{client_id}        – WebSocket for real-time alert push
"""

from __future__ import annotations
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from db.database import get_db
from models import db_models, schemas
from services import auth_service, device_service, ip_service, geo_velocity, multi_account
from behavior_profiler import extractor as bextractor, baseline as bbaseline
from detection.bot_detector import detect_bot
from risk_engine.scorer import compute_risk, RiskInput
from risk_engine.explainer import build_explanation
from alerts.manager import maybe_alert
from websocket.handler import manager
from ml.isolation_forest import score_session

router = APIRouter()


# ─── WebSocket ────────────────────────────────────────────────────────────────

@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """Real-time alert stream. Connect once and receive push notifications."""
    await manager.connect(client_id, websocket)
    try:
        while True:
            # Keep connection alive; we only push, never expect client data
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(client_id)


# ─── Auth / Users ─────────────────────────────────────────────────────────────

@router.post("/register", response_model=schemas.TokenResponse, status_code=201)
def register(body: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new user and return a JWT."""
    if auth_service.get_user_by_email(db, body.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    user  = auth_service.create_user(db, body.email, body.password)
    token = auth_service.create_access_token({"sub": str(user.id)})
    return schemas.TokenResponse(access_token=token, user_id=user.id, email=user.email)


# ─── Collect Data ─────────────────────────────────────────────────────────────

@router.post("/collect-data", status_code=200)
async def collect_data(body: schemas.CollectDataRequest, db: Session = Depends(get_db)):
    """
    Ingest a device fingerprint + optional behavior payload.
    Can be called without authentication (pre-login fingerprinting).
    """
    if body.user_id:
        device_service.get_or_create_device(db, body.device_id, body.user_id, body.user_agent)

    # Extract and store behavior features
    behavior_features = None
    if body.behavior:
        behavior_features = bextractor.extract_features(
            body.behavior.keystrokes,
            body.behavior.mouse_movements,
            body.behavior.form_fill_duration_ms,
        )

    return {"status": "ok", "device_id": body.device_id}


# ─── Login ────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=dict)
async def login(body: schemas.LoginRequest, request: Request, db: Session = Depends(get_db)):
    """
    Authenticate user → run full risk pipeline → return risk score + token.

    Pipeline:
      1. Authenticate credentials
      2. Device fingerprint check
      3. Geo-IP resolution
      4. Behavioral feature extraction
      5. Bot detection
      6. Geo-velocity check
      7. Multi-account check
      8. Risk scoring
      9. Explainable AI
      10. Persist login event
      11. Fire alerts (async WebSocket push)
    """
    # ── 1. Authenticate ───────────────────────────────────────────────────────
    user = auth_service.authenticate_user(db, body.email, body.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # ── 2. Device fingerprint ─────────────────────────────────────────────────
    device, is_new_device = device_service.get_or_create_device(db, body.device_id, user.id, body.user_agent)

    # ── 3. Geo-IP ─────────────────────────────────────────────────────────────
    ip = body.ip_address or request.client.host
    location = await ip_service.resolve_ip(ip)

    # ── 4. Behavioral features ────────────────────────────────────────────────
    behavior_features = None
    bot_result = None
    if body.behavior:
        behavior_features = bextractor.extract_features(
            body.behavior.keystrokes,
            body.behavior.mouse_movements,
            body.behavior.form_fill_duration_ms,
        )
        # ── 5. Bot detection ──────────────────────────────────────────────────
        bot_result = detect_bot(
            body.behavior.keystrokes,
            body.behavior.mouse_movements,
            body.behavior.form_fill_duration_ms,
        )

    # ── 6. Geo-velocity ───────────────────────────────────────────────────────
    now = datetime.utcnow()
    geo_result = geo_velocity.check_geo_velocity(db, user.id, location, now)

    # ── 7. Multi-account ──────────────────────────────────────────────────────
    ma_result = multi_account.check_multi_account(db, body.device_id, user.id)

    # ── 8. Behavior baseline comparison ──────────────────────────────────────
    profile = bbaseline.get_or_create_profile(db, user.id)
    is_abnormal_typing = False
    if behavior_features:
        is_abnormal_typing = bbaseline.is_abnormal_typing(profile, behavior_features.typing_speed_cps)
    is_unusual_hour = bbaseline.is_unusual_hour(profile)

    # ── 9. ML anomaly score (optional) ───────────────────────────────────────
    ml_score = None
    if behavior_features:
        ml_score = score_session(behavior_features.to_dict())

    # ── 10. Risk scoring ──────────────────────────────────────────────────────
    risk_inputs = RiskInput(
        is_new_device       = is_new_device,
        device_trust_score  = device.trust_score,
        is_bot              = bot_result.is_bot if bot_result else False,
        bot_confidence      = bot_result.confidence if bot_result else 0.0,
        is_abnormal_typing  = is_abnormal_typing,
        is_unusual_hour     = is_unusual_hour,
        geo_anomaly         = geo_result["anomaly"],
        geo_distance_km     = geo_result["distance_km"],
        multi_account       = ma_result["detected"],
        multi_account_count = ma_result["user_count"],
        ml_anomaly_score    = ml_score,
    )
    risk_output = compute_risk(risk_inputs)
    explanation = build_explanation(risk_output)

    # ── 11. Persist login event ───────────────────────────────────────────────
    event = db_models.LoginEvent(
        user_id    = user.id,
        device_id  = body.device_id,
        ip_address = ip,
        location   = location,
        risk_score = risk_output.risk_score,
        risk_level = risk_output.risk_level,
        factors    = risk_output.factors,
        timestamp  = now,
        is_flagged = risk_output.risk_level in ("HIGH", "CRITICAL"),
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # Update behavioral baseline
    if behavior_features:
        bbaseline.update_baseline(db, user.id, behavior_features, location)

    # Increase device trust on low-risk login
    if risk_output.risk_score < 25:
        device_service.increase_trust(db, device, delta=5.0)

    # ── 12. Fire alerts ───────────────────────────────────────────────────────
    await maybe_alert(
        db, user.id,
        risk_output.risk_score, risk_output.risk_level,
        risk_output.factors, event.id,
        is_new_device = is_new_device,
        is_bot        = bot_result.is_bot if bot_result else False,
        geo_anomaly   = geo_result["anomaly"],
        multi_account = ma_result["detected"],
    )

    # ── 13. Issue JWT ─────────────────────────────────────────────────────────
    token = auth_service.create_access_token({"sub": str(user.id)})

    return {
        "access_token": token,
        "token_type":   "bearer",
        "user_id":      user.id,
        "email":        user.email,
        **explanation,
        "geo": {
            "location":        location,
            "geo_anomaly":     geo_result["anomaly"],
            "distance_km":     geo_result["distance_km"],
            "speed_kmh":       geo_result["implied_speed_kmh"],
        },
        "device": {
            "device_id":   body.device_id,
            "is_new":      is_new_device,
            "trust_score": device.trust_score,
        },
    }


# ─── Risk Score ───────────────────────────────────────────────────────────────

@router.get("/risk-score/{user_id}")
def get_risk_score(user_id: int, db: Session = Depends(get_db)):
    """Return the most recent risk score and its explanation for a user."""
    event = (
        db.query(db_models.LoginEvent)
        .filter(db_models.LoginEvent.user_id == user_id)
        .order_by(db_models.LoginEvent.timestamp.desc())
        .first()
    )
    if not event:
        raise HTTPException(404, "No login events found for this user")
    return {
        "user_id":     user_id,
        "risk_score":  event.risk_score,
        "risk_level":  event.risk_level,
        "factors":     event.factors,
        "timestamp":   event.timestamp.isoformat(),
    }


# ─── Alerts ───────────────────────────────────────────────────────────────────

@router.get("/alerts", response_model=List[schemas.AlertOut])
def get_alerts(
    skip: int = 0,
    limit: int = Query(50, le=200),
    severity: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Paginated list of alerts, optionally filtered by severity."""
    q = db.query(db_models.Alert).order_by(db_models.Alert.timestamp.desc())
    if severity:
        q = q.filter(db_models.Alert.severity == severity.upper())
    return q.offset(skip).limit(limit).all()


@router.patch("/alerts/{alert_id}/read")
def mark_alert_read(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(db_models.Alert).get(alert_id)
    if not alert:
        raise HTTPException(404, "Alert not found")
    alert.is_read = True
    db.commit()
    return {"status": "ok"}


# ─── Dashboard ────────────────────────────────────────────────────────────────

@router.get("/dashboard-data")
def get_dashboard_data(db: Session = Depends(get_db)):
    """Aggregate stats + recent events + risk trend for the dashboard."""
    total_logins       = db.query(func.count(db_models.LoginEvent.id)).scalar()
    high_risk_logins   = db.query(func.count(db_models.LoginEvent.id)).filter(
                            db_models.LoginEvent.risk_level.in_(["HIGH", "CRITICAL"])).scalar()
    active_alerts      = db.query(func.count(db_models.Alert.id)).filter(
                            db_models.Alert.is_read == False).scalar()
    unique_users       = db.query(func.count(func.distinct(db_models.LoginEvent.user_id))).scalar()
    bot_detections     = db.query(func.count(db_models.Alert.id)).filter(
                            db_models.Alert.alert_type == "BOT").scalar()
    geo_anomalies      = db.query(func.count(db_models.Alert.id)).filter(
                            db_models.Alert.alert_type == "GEO_VELOCITY").scalar()

    recent_events = (
        db.query(db_models.LoginEvent)
        .order_by(db_models.LoginEvent.timestamp.desc())
        .limit(20)
        .all()
    )

    recent_alerts = (
        db.query(db_models.Alert)
        .order_by(db_models.Alert.timestamp.desc())
        .limit(10)
        .all()
    )

    # Risk trend: last 30 login events grouped by hour (simplified)
    trend_events = (
        db.query(db_models.LoginEvent)
        .order_by(db_models.LoginEvent.timestamp.asc())
        .limit(30)
        .all()
    )
    risk_trend = [
        {"timestamp": e.timestamp.isoformat(), "risk_score": e.risk_score, "risk_level": e.risk_level}
        for e in trend_events
    ]

    return {
        "stats": {
            "total_logins":     total_logins,
            "high_risk_logins": high_risk_logins,
            "active_alerts":    active_alerts,
            "unique_users":     unique_users,
            "bot_detections":   bot_detections,
            "geo_anomalies":    geo_anomalies,
        },
        "recent_events": [_event_to_dict(e) for e in recent_events],
        "recent_alerts": [_alert_to_dict(a) for a in recent_alerts],
        "risk_trend":    risk_trend,
    }


# ─── Users ────────────────────────────────────────────────────────────────────

@router.get("/users")
def list_users(db: Session = Depends(get_db)):
    users = db.query(db_models.User).all()
    result = []
    for u in users:
        event_count = db.query(func.count(db_models.LoginEvent.id)).filter(
            db_models.LoginEvent.user_id == u.id).scalar()
        avg_score = db.query(func.avg(db_models.LoginEvent.risk_score)).filter(
            db_models.LoginEvent.user_id == u.id).scalar() or 0.0
        result.append({
            "id": u.id,
            "email": u.email,
            "created_at": u.created_at.isoformat(),
            "login_count": event_count,
            "avg_risk_score": round(float(avg_score), 2),
        })
    return result


@router.get("/users/{user_id}")
def get_user_detail(user_id: int, db: Session = Depends(get_db)):
    user = db.query(db_models.User).get(user_id)
    if not user:
        raise HTTPException(404, "User not found")

    devices = db.query(db_models.Device).filter(db_models.Device.user_id == user_id).all()
    events  = (db.query(db_models.LoginEvent)
               .filter(db_models.LoginEvent.user_id == user_id)
               .order_by(db_models.LoginEvent.timestamp.desc())
               .limit(20).all())
    alerts  = (db.query(db_models.Alert)
               .filter(db_models.Alert.user_id == user_id)
               .order_by(db_models.Alert.timestamp.desc())
               .limit(10).all())
    profile = db.query(db_models.BehaviorProfile).filter(
              db_models.BehaviorProfile.user_id == user_id).first()

    avg_score = db.query(func.avg(db_models.LoginEvent.risk_score)).filter(
        db_models.LoginEvent.user_id == user_id).scalar() or 0.0

    return {
        "id":             user.id,
        "email":          user.email,
        "created_at":     user.created_at.isoformat(),
        "login_count":    len(events),
        "avg_risk_score": round(float(avg_score), 2),
        "devices":        [{"device_id": d.device_id, "trust_score": d.trust_score,
                            "first_seen": d.first_seen.isoformat(),
                            "last_seen": d.last_seen.isoformat(),
                            "is_trusted": d.is_trusted} for d in devices],
        "behavior_profile": {
            "avg_typing_speed":   profile.avg_typing_speed if profile else 0,
            "keystroke_variance": profile.keystroke_variance if profile else 0,
            "typical_location":   profile.typical_location if profile else None,
            "session_count":      profile.session_count if profile else 0,
        },
        "recent_logins": [_event_to_dict(e) for e in events],
        "alerts":        [_alert_to_dict(a) for a in alerts],
    }


# ─── Login Events ─────────────────────────────────────────────────────────────

@router.get("/events")
def get_events(
    skip: int = 0,
    limit: int = Query(50, le=200),
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    q = db.query(db_models.LoginEvent).order_by(db_models.LoginEvent.timestamp.desc())
    if user_id:
        q = q.filter(db_models.LoginEvent.user_id == user_id)
    events = q.offset(skip).limit(limit).all()
    return [_event_to_dict(e) for e in events]


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _event_to_dict(e: db_models.LoginEvent) -> dict:
    return {
        "id":          e.id,
        "user_id":     e.user_id,
        "device_id":   e.device_id,
        "ip_address":  e.ip_address,
        "location":    e.location,
        "risk_score":  e.risk_score,
        "risk_level":  e.risk_level,
        "factors":     e.factors,
        "timestamp":   e.timestamp.isoformat(),
        "is_flagged":  e.is_flagged,
        "scenario":    e.scenario,
    }


def _alert_to_dict(a: db_models.Alert) -> dict:
    return {
        "id":             a.id,
        "user_id":        a.user_id,
        "login_event_id": a.login_event_id,
        "alert_type":     a.alert_type,
        "severity":       a.severity,
        "message":        a.message,
        "details":        a.details,
        "timestamp":      a.timestamp.isoformat(),
        "is_read":        a.is_read,
    }
