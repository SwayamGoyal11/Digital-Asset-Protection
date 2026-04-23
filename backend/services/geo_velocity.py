"""
Geo-Velocity Anomaly Detection.

Checks whether a user has traveled an impossible distance between their
last known login location and the current one. Uses the Haversine formula
to compute great-circle distance.

Thresholds:
  - Max plausible speed: 900 km/h (commercial aircraft)
  - If computed speed > threshold → geo-velocity anomaly
"""

from __future__ import annotations
import math
from datetime import datetime
from sqlalchemy.orm import Session
from models.db_models import LoginEvent


EARTH_RADIUS_KM = 6_371.0
MAX_SPEED_KMH   = 900.0        # Fastest commercial transport
MIN_TIME_GAP_HOURS = 0.016     # Ignore checks < 1 minute apart


def check_geo_velocity(
    db: Session,
    user_id: int,
    current_location: dict,
    current_time: datetime,
) -> dict:
    """
    Compare the current login location against the user's most recent login.

    Returns:
        {
            "anomaly": bool,
            "distance_km": float,
            "time_gap_hours": float,
            "implied_speed_kmh": float,
            "last_location": dict | None,
        }
    """
    last_event = (
        db.query(LoginEvent)
        .filter(LoginEvent.user_id == user_id, LoginEvent.location.isnot(None))
        .order_by(LoginEvent.timestamp.desc())
        .first()
    )

    result = {
        "anomaly": False,
        "distance_km": 0.0,
        "time_gap_hours": 0.0,
        "implied_speed_kmh": 0.0,
        "last_location": None,
    }

    if not last_event or not last_event.location:
        return result

    last_loc = last_event.location
    result["last_location"] = last_loc

    lat1, lon1 = last_loc.get("lat", 0.0), last_loc.get("lon", 0.0)
    lat2, lon2 = current_location.get("lat", 0.0), current_location.get("lon", 0.0)

    distance_km = _haversine(lat1, lon1, lat2, lon2)
    time_gap_hours = (current_time - last_event.timestamp).total_seconds() / 3600.0

    result["distance_km"]    = round(distance_km, 2)
    result["time_gap_hours"] = round(time_gap_hours, 4)

    if time_gap_hours < MIN_TIME_GAP_HOURS or distance_km < 1.0:
        return result

    implied_speed = distance_km / time_gap_hours
    result["implied_speed_kmh"] = round(implied_speed, 2)

    if implied_speed > MAX_SPEED_KMH:
        result["anomaly"] = True

    return result


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Compute the great-circle distance (km) between two lat/lon pairs."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi  = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * EARTH_RADIUS_KM * math.asin(math.sqrt(a))
