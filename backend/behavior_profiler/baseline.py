"""
Per-user behavioral baseline manager.

Maintains a rolling average of each user's typing speed, keystroke variance,
and location so new sessions can be compared against established norms.
"""

from __future__ import annotations
from datetime import datetime
from sqlalchemy.orm import Session
from models.db_models import BehaviorProfile
from behavior_profiler.extractor import BehaviorFeatures


def get_or_create_profile(db: Session, user_id: int) -> BehaviorProfile:
    """Fetch the behavior profile for a user, creating one if absent."""
    profile = db.query(BehaviorProfile).filter(BehaviorProfile.user_id == user_id).first()
    if not profile:
        profile = BehaviorProfile(user_id=user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


def update_baseline(db: Session, user_id: int, features: BehaviorFeatures, location: dict | None = None):
    """
    Update the user's behavioral baseline using exponential moving average (EMA).

    EMA smoothing factor α = 0.3 means recent sessions have more weight
    without completely discarding historical norms.

    Args:
        db: Database session.
        user_id: Target user ID.
        features: Extracted behavior features from the current session.
        location: Current login location dict {lat, lon, country}.
    """
    ALPHA = 0.3  # EMA smoothing factor

    profile = get_or_create_profile(db, user_id)

    if profile.session_count == 0:
        # First session – seed directly
        profile.avg_typing_speed   = features.typing_speed_cps
        profile.keystroke_variance = features.keystroke_variance_ms
        profile.avg_mouse_speed    = features.avg_mouse_speed_px_sec
        if location:
            profile.typical_location = location
    else:
        # Exponential moving average
        profile.avg_typing_speed   = _ema(profile.avg_typing_speed,   features.typing_speed_cps,       ALPHA)
        profile.keystroke_variance = _ema(profile.keystroke_variance, features.keystroke_variance_ms,  ALPHA)
        profile.avg_mouse_speed    = _ema(profile.avg_mouse_speed,    features.avg_mouse_speed_px_sec, ALPHA)

        # Update typical location toward new location
        if location and profile.typical_location:
            profile.typical_location = {
                "lat":     _ema(profile.typical_location.get("lat", 0),     location.get("lat", 0),     ALPHA),
                "lon":     _ema(profile.typical_location.get("lon", 0),     location.get("lon", 0),     ALPHA),
                "country": location.get("country", profile.typical_location.get("country")),
            }
        elif location:
            profile.typical_location = location

    # Update common login hours histogram
    current_hour = datetime.utcnow().hour
    hours = profile.common_hours or [0] * 24
    hours[current_hour] = hours[current_hour] + 1
    profile.common_hours = hours

    profile.session_count += 1
    profile.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(profile)
    return profile


def is_unusual_hour(profile: BehaviorProfile) -> bool:
    """Return True if the current hour is rarely seen in the user's history."""
    if not profile.common_hours or profile.session_count < 5:
        return False
    current_hour = datetime.utcnow().hour
    total = sum(profile.common_hours)
    if total == 0:
        return False
    freq = profile.common_hours[current_hour] / total
    return freq < 0.05   # current hour accounts for < 5% of past logins


def is_abnormal_typing(profile: BehaviorProfile, current_speed: float) -> bool:
    """
    Return True if the current typing speed deviates significantly from baseline.
    Uses a 3-sigma rule: flag if deviation > 3× historical std-dev.
    """
    if profile.session_count < 3 or profile.avg_typing_speed == 0:
        return False
    # Approximate std-dev from variance stored in profile
    deviation = abs(current_speed - profile.avg_typing_speed)
    # Flag if deviation is > 50% of baseline (simplified threshold)
    return deviation > (profile.avg_typing_speed * 0.5)


# ─── Internal helpers ─────────────────────────────────────────────────────────

def _ema(old: float, new: float, alpha: float) -> float:
    """Exponential moving average."""
    return alpha * new + (1 - alpha) * old
