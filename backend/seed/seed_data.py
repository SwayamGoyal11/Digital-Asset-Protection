# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
"""
Seed script – injects realistic demo data for all 4 test scenarios.

Run from the /backend directory:
  python seed/seed_data.py

Scenarios:
  1. normal_login    -> low risk (score ~10)
  2. new_device      → medium risk (score ~35)
  3. bot_behavior    → high/critical risk (score ~85)
  4. geo_anomaly     → critical risk (impossible travel, score ~90)
"""

import sys
import os
import asyncio
from datetime import datetime, timedelta
import random

# Allow imports from parent directory
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import SessionLocal, engine, Base
import models.db_models as M
from services.auth_service import create_user, hash_password
from risk_engine.scorer import compute_risk, RiskInput
from risk_engine.explainer import build_explanation

Base.metadata.create_all(bind=engine)


DEMO_USERS = [
    {"email": "alice@demo.com",   "password": "password123"},
    {"email": "bob@demo.com",     "password": "password123"},
    {"email": "charlie@demo.com", "password": "password123"},
    {"email": "diana@demo.com",   "password": "password123"},
]

LOCATIONS = {
    "new_york":   {"country": "US", "city": "New York",   "lat": 40.7128,  "lon": -74.0060},
    "london":     {"country": "GB", "city": "London",     "lat": 51.5074,  "lon":  -0.1278},
    "tokyo":      {"country": "JP", "city": "Tokyo",      "lat": 35.6762,  "lon": 139.6503},
    "mumbai":     {"country": "IN", "city": "Mumbai",     "lat": 19.0760,  "lon":  72.8777},
    "sydney":     {"country": "AU", "city": "Sydney",     "lat": -33.8688, "lon": 151.2093},
    "moscow":     {"country": "RU", "city": "Moscow",     "lat": 55.7558,  "lon":  37.6173},
}

DEVICES = {
    "trusted_macbook": "fp_trusted_macbook_abc123",
    "new_phone":       "fp_new_iphone_xyz789",
    "bot_server":      "fp_bot_server_000000",
    "vpn_device":      "fp_vpn_device_delta99",
}


def seed():
    db = SessionLocal()
    try:
        # ── Clear existing demo data ──────────────────────────────────────────
        print("[*] Clearing existing data...")
        db.query(M.Alert).delete()
        db.query(M.LoginEvent).delete()
        db.query(M.BehaviorProfile).delete()
        db.query(M.Device).delete()
        db.query(M.User).delete()
        db.commit()

        # ── Create demo users ─────────────────────────────────────────────────
        print("[*] Creating demo users...")
        users = {}
        for u in DEMO_USERS:
            user = M.User(email=u["email"], password_hash=hash_password(u["password"]))
            db.add(user)
            db.commit()
            db.refresh(user)
            users[u["email"]] = user
            print(f"   + {u['email']} (id={user.id})")

        # ── Seed behavior profiles ────────────────────────────────────────────
        print("[*] Seeding behavior profiles...")
        for email, user in users.items():
            profile = M.BehaviorProfile(
                user_id=user.id,
                avg_typing_speed=random.uniform(3.5, 6.0),
                keystroke_variance=random.uniform(10.0, 30.0),
                avg_mouse_speed=random.uniform(200.0, 600.0),
                typical_location=LOCATIONS["new_york"],
                common_hours=[random.randint(0, 5) for _ in range(24)],
                session_count=random.randint(10, 50),
            )
            db.add(profile)
        db.commit()

        # ──────────────────────────────────────────────────────────────────────
        # SCENARIO 1: Normal login (Alice, trusted device, familiar location)
        # ──────────────────────────────────────────────────────────────────────
        print("\n[1] Scenario 1: Normal Login")
        alice = users["alice@demo.com"]
        _seed_device(db, DEVICES["trusted_macbook"], alice.id, trust_score=80.0, is_trusted=True)
        for i in range(8):
            ts = datetime.utcnow() - timedelta(days=8 - i, hours=random.randint(8, 18))
            risk_in = RiskInput(is_new_device=False, device_trust_score=80.0)
            out = compute_risk(risk_in)
            _seed_event(db, alice.id, DEVICES["trusted_macbook"],
                        "192.168.1.1", LOCATIONS["new_york"],
                        out.risk_score, out.risk_level, out.factors, ts, "normal_login")

        # ──────────────────────────────────────────────────────────────────────
        # SCENARIO 2: New device login (Bob, new phone, same location)
        # ──────────────────────────────────────────────────────────────────────
        print("[2] Scenario 2: New Device")
        bob = users["bob@demo.com"]
        # Establish history with known device
        _seed_device(db, DEVICES["trusted_macbook"], bob.id, trust_score=60.0, is_trusted=True)
        for i in range(5):
            ts = datetime.utcnow() - timedelta(days=5 - i, hours=9)
            risk_in = RiskInput(is_new_device=False, device_trust_score=60.0)
            out = compute_risk(risk_in)
            _seed_event(db, bob.id, DEVICES["trusted_macbook"],
                        "10.0.0.1", LOCATIONS["london"],
                        out.risk_score, out.risk_level, out.factors, ts, "normal_login")
        # New device login
        _seed_device(db, DEVICES["new_phone"], bob.id, trust_score=0.0, is_trusted=False)
        risk_in = RiskInput(is_new_device=True, device_trust_score=0.0)
        out = compute_risk(risk_in)
        evt = _seed_event(db, bob.id, DEVICES["new_phone"],
                  "10.0.0.2", LOCATIONS["london"],
                  out.risk_score, out.risk_level, out.factors,
                  datetime.utcnow() - timedelta(hours=1), "new_device")
        _seed_alert(db, bob.id, evt.id, "NEW_DEVICE", "MEDIUM",
                    "Login from a new, unrecognized device.")
        print(f"   + New device risk score: {out.risk_score:.1f} ({out.risk_level})")

        # ──────────────────────────────────────────────────────────────────────
        # SCENARIO 3: Bot behavior (Charlie, superhuman typing speed)
        # ──────────────────────────────────────────────────────────────────────
        print("[3] Scenario 3: Bot Behavior")
        charlie = users["charlie@demo.com"]
        _seed_device(db, DEVICES["bot_server"], charlie.id, trust_score=0.0, is_trusted=False)
        risk_in = RiskInput(
            is_new_device=True, device_trust_score=0.0,
            is_bot=True, bot_confidence=0.95,
            is_abnormal_typing=True,
        )
        out = compute_risk(risk_in)
        evt = _seed_event(db, charlie.id, DEVICES["bot_server"],
                  "198.51.100.42", LOCATIONS["moscow"],
                  out.risk_score, out.risk_level, out.factors,
                  datetime.utcnow() - timedelta(minutes=30), "bot_behavior")
        _seed_alert(db, charlie.id, evt.id, "BOT", "CRITICAL",
                    "Bot-like behavior detected: uniform 28ms keystroke intervals.")
        print(f"   + Bot risk score: {out.risk_score:.1f} ({out.risk_level})")

        # Additional historical bot events
        for i in range(4):
            ts = datetime.utcnow() - timedelta(hours=i + 1)
            risk_in2 = RiskInput(is_new_device=False, device_trust_score=0.0,
                                is_bot=True, bot_confidence=0.90)
            out2 = compute_risk(risk_in2)
            _seed_event(db, charlie.id, DEVICES["bot_server"],
                       "198.51.100.42", LOCATIONS["moscow"],
                       out2.risk_score, out2.risk_level, out2.factors, ts, "bot_behavior")

        # ──────────────────────────────────────────────────────────────────────
        # SCENARIO 4: Geo-velocity / VPN anomaly (Diana, impossible travel)
        # ──────────────────────────────────────────────────────────────────────
        print("[4] Scenario 4: Geo-Velocity Anomaly")
        diana = users["diana@demo.com"]
        _seed_device(db, DEVICES["vpn_device"], diana.id, trust_score=30.0, is_trusted=False)
        # First login: Tokyo
        t1 = datetime.utcnow() - timedelta(hours=3)
        risk_in = RiskInput(is_new_device=False, device_trust_score=30.0)
        out1 = compute_risk(risk_in)
        _seed_event(db, diana.id, DEVICES["vpn_device"],
                   "203.0.113.1", LOCATIONS["tokyo"],
                   out1.risk_score, out1.risk_level, out1.factors, t1, "normal_login")
        # Second login: New York 3 hours later (10,800 km apart = 3600 km/h > MAX)
        t2 = datetime.utcnow() - timedelta(minutes=5)
        risk_in2 = RiskInput(
            is_new_device=False, device_trust_score=30.0,
            geo_anomaly=True, geo_distance_km=10_838.0,
        )
        out2 = compute_risk(risk_in2)
        evt2 = _seed_event(db, diana.id, DEVICES["vpn_device"],
                   "203.0.113.99", LOCATIONS["new_york"],
                   out2.risk_score, out2.risk_level, out2.factors, t2, "geo_anomaly")
        _seed_alert(db, diana.id, evt2.id, "GEO_VELOCITY", "CRITICAL",
                    "Impossible travel: Tokyo → New York in 3h (10,838 km at 3,612 km/h).")
        print(f"   + Geo anomaly risk score: {out2.risk_score:.1f} ({out2.risk_level})")

        # ── Extra historical events for trend charts ───────────────────────────
        print("\n[*] Adding historical trend data...")
        all_users = list(users.values())
        for i in range(20):
            u = random.choice(all_users)
            score = random.uniform(5, 95)
            level = "LOW" if score < 25 else "MEDIUM" if score < 50 else "HIGH" if score < 75 else "CRITICAL"
            ts = datetime.utcnow() - timedelta(hours=random.randint(1, 72))
            _seed_event(db, u.id, DEVICES["trusted_macbook"],
                       f"10.{random.randint(0,255)}.{random.randint(0,255)}.1",
                       random.choice(list(LOCATIONS.values())),
                       score, level, [], ts, "historical")

        db.commit()
        print("\n[DONE] Seed complete! Demo accounts:")
        for u in DEMO_USERS:
            print(f"   email: {u['email']}  password: {u['password']}")

    finally:
        db.close()


def _seed_device(db, device_id, user_id, trust_score=50.0, is_trusted=False):
    existing = db.query(M.Device).filter(
        M.Device.device_id == device_id, M.Device.user_id == user_id
    ).first()
    if existing:
        return existing
    dev = M.Device(
        device_id=device_id, user_id=user_id,
        trust_score=trust_score, is_trusted=is_trusted,
    )
    db.add(dev)
    db.commit()
    db.refresh(dev)
    return dev


def _seed_event(db, user_id, device_id, ip, location, risk_score, risk_level, factors, ts, scenario):
    evt = M.LoginEvent(
        user_id=user_id, device_id=device_id,
        ip_address=ip, location=location,
        risk_score=risk_score, risk_level=risk_level,
        factors=factors, timestamp=ts,
        is_flagged=risk_level in ("HIGH", "CRITICAL"),
        scenario=scenario,
    )
    db.add(evt)
    db.commit()
    db.refresh(evt)
    return evt


def _seed_alert(db, user_id, login_event_id, alert_type, severity, message):
    alert = M.Alert(
        user_id=user_id, login_event_id=login_event_id,
        alert_type=alert_type, severity=severity,
        message=message, details={},
    )
    db.add(alert)
    db.commit()


if __name__ == "__main__":
    seed()
