"""
Device fingerprint service.

Manages the Device registry per user: first-seen detection, trust scoring,
and multi-device tracking.
"""

from __future__ import annotations
from datetime import datetime
from sqlalchemy.orm import Session
from models.db_models import Device


def get_device(db: Session, device_id: str, user_id: int) -> Device | None:
    """Return the Device record for a (device_id, user_id) pair, or None."""
    return (
        db.query(Device)
        .filter(Device.device_id == device_id, Device.user_id == user_id)
        .first()
    )


def get_or_create_device(
    db: Session,
    device_id: str,
    user_id: int,
    user_agent: str | None = None,
) -> tuple[Device, bool]:
    """
    Fetch an existing device or register a new one.

    Returns:
        (device, is_new) – is_new=True when the device was just created.
    """
    device = get_device(db, device_id, user_id)
    if device:
        device.last_seen = datetime.utcnow()
        db.commit()
        return device, False

    device = Device(
        device_id=device_id,
        user_id=user_id,
        user_agent=user_agent,
        trust_score=0.0,        # New devices start untrusted
        is_trusted=False,
    )
    db.add(device)
    db.commit()
    db.refresh(device)
    return device, True


def get_users_for_device(db: Session, device_id: str) -> list[int]:
    """Return all user IDs that have logged in from the given device_id."""
    rows = db.query(Device.user_id).filter(Device.device_id == device_id).all()
    return [r[0] for r in rows]


def increase_trust(db: Session, device: Device, delta: float = 10.0):
    """Increment device trust score after a successful, low-risk login."""
    device.trust_score = min(100.0, device.trust_score + delta)
    db.commit()
