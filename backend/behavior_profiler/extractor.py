"""
Behavioral biometrics feature extractor.

Converts raw keystroke and mouse event streams into structured
numeric features suitable for risk scoring and ML.
"""

from __future__ import annotations
import statistics
from typing import List, Optional
from models.schemas import KeystrokeEvent, MouseEvent


class BehaviorFeatures:
    """Structured feature set extracted from a login session."""

    def __init__(self):
        self.typing_speed_cps: float = 0.0          # chars per second
        self.avg_keystroke_interval_ms: float = 0.0
        self.keystroke_variance_ms: float = 0.0
        self.avg_mouse_speed_px_sec: float = 0.0
        self.mouse_direction_changes: int = 0
        self.form_fill_duration_ms: float = 0.0
        self.key_count: int = 0

    def to_dict(self) -> dict:
        return self.__dict__


def extract_features(
    keystrokes: List[KeystrokeEvent],
    mouse_movements: List[MouseEvent],
    form_fill_duration_ms: Optional[float] = None,
) -> BehaviorFeatures:
    """
    Extract behavioral biometric features from raw event streams.

    Args:
        keystrokes: All key events captured during the session.
        mouse_movements: Mouse position samples during the session.
        form_fill_duration_ms: Total time (ms) from first to last input.

    Returns:
        BehaviorFeatures populated with computed metrics.
    """
    features = BehaviorFeatures()

    # ── Keystroke features ────────────────────────────────────────────────────
    keydowns = [k for k in keystrokes if k.event_type == "keydown"]
    features.key_count = len(keydowns)

    if len(keydowns) >= 2:
        timestamps = [k.timestamp for k in keydowns]
        duration_sec = (timestamps[-1] - timestamps[0]) / 1000.0

        if duration_sec > 0:
            features.typing_speed_cps = len(keydowns) / duration_sec

        intervals = [timestamps[i + 1] - timestamps[i] for i in range(len(timestamps) - 1)]
        features.avg_keystroke_interval_ms = statistics.mean(intervals)

        if len(intervals) >= 2:
            features.keystroke_variance_ms = statistics.variance(intervals)

    if form_fill_duration_ms is not None:
        features.form_fill_duration_ms = form_fill_duration_ms

    # ── Mouse features ────────────────────────────────────────────────────────
    if len(mouse_movements) >= 2:
        speeds: List[float] = []
        direction_changes = 0

        for i in range(1, len(mouse_movements)):
            prev = mouse_movements[i - 1]
            curr = mouse_movements[i]
            dt = (curr.timestamp - prev.timestamp) / 1000.0  # seconds
            if dt > 0:
                dist = ((curr.x - prev.x) ** 2 + (curr.y - prev.y) ** 2) ** 0.5
                speeds.append(dist / dt)

        if speeds:
            features.avg_mouse_speed_px_sec = statistics.mean(speeds)

        # Count direction changes
        for i in range(1, len(mouse_movements) - 1):
            dx1 = mouse_movements[i].x - mouse_movements[i - 1].x
            dy1 = mouse_movements[i].y - mouse_movements[i - 1].y
            dx2 = mouse_movements[i + 1].x - mouse_movements[i].x
            dy2 = mouse_movements[i + 1].y - mouse_movements[i].y
            if abs(dx1 * dy2 - dy1 * dx2) > 50:
                direction_changes += 1

        features.mouse_direction_changes = direction_changes

    return features
