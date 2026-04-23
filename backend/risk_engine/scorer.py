"""
Risk Scoring Engine.

Modular, rule-based scorer that combines signals from:
  - Device trust
  - Behavioral biometrics
  - Geo-velocity
  - Multi-account detection
  - Bot detection
  - Login time patterns

Output: risk_score (0–100) clamped, risk_level, and factors list.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import List, Optional

from detection.bot_detector import BotDetectionResult
from models.db_models import BehaviorProfile


@dataclass
class RiskInput:
    """All signals available to the risk scorer."""
    is_new_device:       bool  = False
    device_trust_score:  float = 50.0      # 0-100 (higher = more trusted)

    # Behavior
    is_bot:              bool  = False
    bot_confidence:      float = 0.0       # 0-1
    is_abnormal_typing:  bool  = False
    is_unusual_hour:     bool  = False

    # Location
    geo_anomaly:         bool  = False
    geo_distance_km:     float = 0.0

    # Multi-account
    multi_account:       bool  = False
    multi_account_count: int   = 0

    # ML score (optional, from Isolation Forest)
    ml_anomaly_score:    Optional[float] = None   # 0-1


@dataclass
class RiskOutput:
    risk_score:  float
    risk_level:  str                         # LOW | MEDIUM | HIGH | CRITICAL
    factors:     List[dict] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "risk_score": round(self.risk_score, 2),
            "risk_level": self.risk_level,
            "factors":    self.factors,
        }


# ─── Score weights (additive, raw sum clamped to 0-100) ──────────────────────

_WEIGHTS = {
    "new_device":       30,
    "bot_behavior":     40,
    "abnormal_typing":  20,
    "unusual_hour":     15,
    "geo_velocity":     35,
    "multi_account":    20,
    "untrusted_device": 10,
    "ml_anomaly":       25,
}


def compute_risk(inputs: RiskInput) -> RiskOutput:
    """
    Apply all rules and return a structured RiskOutput.

    Rules are additive – each triggered rule adds its weight to the raw score.
    The raw score is then clamped to [0, 100].
    """
    raw_score = 0.0
    factors: List[dict] = []

    def add(reason: str, impact: float):
        nonlocal raw_score
        raw_score += impact
        factors.append({"reason": reason, "impact": round(impact, 1)})

    # ── Device ───────────────────────────────────────────────────────────────
    if inputs.is_new_device:
        add("New Device", _WEIGHTS["new_device"])

    if not inputs.is_new_device and inputs.device_trust_score < 30:
        add("Untrusted Device", _WEIGHTS["untrusted_device"])

    # ── Bot detection ────────────────────────────────────────────────────────
    if inputs.is_bot:
        scaled = _WEIGHTS["bot_behavior"] * inputs.bot_confidence
        add("Bot-Like Behavior Detected", scaled)

    # ── Behavioral biometrics ────────────────────────────────────────────────
    if inputs.is_abnormal_typing:
        add("Abnormal Typing Pattern", _WEIGHTS["abnormal_typing"])

    # ── Login time ───────────────────────────────────────────────────────────
    if inputs.is_unusual_hour:
        add("Unusual Login Hour", _WEIGHTS["unusual_hour"])

    # ── Geo-velocity ─────────────────────────────────────────────────────────
    if inputs.geo_anomaly:
        label = f"Impossible Travel ({inputs.geo_distance_km:.0f} km)"
        add(label, _WEIGHTS["geo_velocity"])

    # ── Multi-account ────────────────────────────────────────────────────────
    if inputs.multi_account:
        label = f"Multi-Account on Same Device ({inputs.multi_account_count} accounts)"
        add(label, _WEIGHTS["multi_account"])

    # ── ML layer (Isolation Forest) ───────────────────────────────────────────
    if inputs.ml_anomaly_score is not None and inputs.ml_anomaly_score > 0.6:
        scaled = _WEIGHTS["ml_anomaly"] * inputs.ml_anomaly_score
        add("ML Anomaly Score Elevated", scaled)

    # ── Clamp and classify ────────────────────────────────────────────────────
    risk_score = max(0.0, min(100.0, raw_score))
    risk_level = _classify(risk_score)

    return RiskOutput(risk_score=risk_score, risk_level=risk_level, factors=factors)


def _classify(score: float) -> str:
    if score >= 75:
        return "CRITICAL"
    if score >= 50:
        return "HIGH"
    if score >= 25:
        return "MEDIUM"
    return "LOW"
