"""
Bot Detection Module.

Analyzes keystroke intervals and mouse patterns to identify automated/bot behavior.

Signals:
  - Typing speed exceeding human maximum (~15 chars/sec)
  - Uniform inter-key intervals (variance < threshold → robot pattern)
  - Unrealistically fast form fill
  - Linear / non-random mouse trajectories
"""

from __future__ import annotations
import statistics
from typing import List, Optional
from models.schemas import KeystrokeEvent, MouseEvent


# ─── Constants ────────────────────────────────────────────────────────────────

HUMAN_MAX_TYPING_SPEED_CPS = 15.0          # chars per second (world record ~16)
BOT_INTERVAL_VARIANCE_THRESHOLD = 5.0      # ms variance below this = uniform = bot
BOT_MIN_FORM_DURATION_MS = 1_500           # form filled in < 1.5s = suspicious
HUMAN_AVG_INTERVAL_MS = 120.0              # typical inter-keystroke gap
BOT_SPEED_THRESHOLD_MS = 30.0             # interval < 30ms = bot-like


class BotDetectionResult:
    """Container for bot detection signals."""

    def __init__(self):
        self.is_bot: bool = False
        self.confidence: float = 0.0       # 0-1
        self.signals: List[str] = []

    def add_signal(self, signal: str, weight: float = 0.25):
        self.signals.append(signal)
        self.confidence = min(1.0, self.confidence + weight)
        if self.confidence >= 0.5:
            self.is_bot = True


def detect_bot(
    keystrokes: List[KeystrokeEvent],
    mouse_movements: List[MouseEvent],
    form_fill_duration_ms: Optional[float] = None,
) -> BotDetectionResult:
    """
    Run all bot detection heuristics and return a combined result.

    Args:
        keystrokes: List of keystroke events from the frontend.
        mouse_movements: List of mouse position samples.
        form_fill_duration_ms: Total time taken to fill the login form.

    Returns:
        BotDetectionResult with is_bot flag, confidence score, and signals.
    """
    result = BotDetectionResult()

    # ── 1. Form fill duration ─────────────────────────────────────────────────
    if form_fill_duration_ms is not None and form_fill_duration_ms < BOT_MIN_FORM_DURATION_MS:
        result.add_signal(f"Form filled in {form_fill_duration_ms:.0f}ms (< {BOT_MIN_FORM_DURATION_MS}ms)", weight=0.35)

    # ── 2. Keystroke analysis ─────────────────────────────────────────────────
    keydowns = [k for k in keystrokes if k.event_type == "keydown"]
    if len(keydowns) >= 3:
        intervals = _compute_intervals([k.timestamp for k in keydowns])
        _check_keystroke_intervals(intervals, result)

    # ── 3. Typing speed ───────────────────────────────────────────────────────
    if len(keydowns) >= 2:
        duration_sec = (keydowns[-1].timestamp - keydowns[0].timestamp) / 1000.0
        if duration_sec > 0:
            speed_cps = len(keydowns) / duration_sec
            if speed_cps > HUMAN_MAX_TYPING_SPEED_CPS:
                result.add_signal(f"Typing speed {speed_cps:.1f} chars/sec exceeds human maximum", weight=0.4)

    # ── 4. Mouse movement analysis ────────────────────────────────────────────
    if len(mouse_movements) >= 5:
        _check_mouse_movements(mouse_movements, result)

    return result


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _compute_intervals(timestamps: List[float]) -> List[float]:
    """Compute consecutive time differences in ms."""
    return [timestamps[i + 1] - timestamps[i] for i in range(len(timestamps) - 1)]


def _check_keystroke_intervals(intervals: List[float], result: BotDetectionResult):
    """Check if keystroke intervals are suspiciously uniform or fast."""
    if not intervals:
        return

    avg = statistics.mean(intervals)
    try:
        variance = statistics.variance(intervals)
    except statistics.StatisticsError:
        variance = 0.0

    # Extremely fast average interval
    if avg < BOT_SPEED_THRESHOLD_MS:
        result.add_signal(f"Avg keystroke interval {avg:.1f}ms (< {BOT_SPEED_THRESHOLD_MS}ms)", weight=0.4)

    # Suspiciously uniform intervals (low variance)
    if variance < BOT_INTERVAL_VARIANCE_THRESHOLD and avg < HUMAN_AVG_INTERVAL_MS:
        result.add_signal(f"Keystroke variance {variance:.2f}ms (< {BOT_INTERVAL_VARIANCE_THRESHOLD}ms) – uniform pattern", weight=0.35)


def _check_mouse_movements(movements: List[MouseEvent], result: BotDetectionResult):
    """Detect unnaturally linear or absent mouse movement."""
    xs = [m.x for m in movements]
    ys = [m.y for m in movements]

    # Check if mouse barely moved (possible headless browser)
    x_range = max(xs) - min(xs)
    y_range = max(ys) - min(ys)
    if x_range < 10 and y_range < 10:
        result.add_signal("Mouse movement range < 10px (stationary / headless)", weight=0.3)
        return

    # Check linearity: compute direction changes
    direction_changes = 0
    for i in range(1, len(movements) - 1):
        dx1 = movements[i].x - movements[i - 1].x
        dy1 = movements[i].y - movements[i - 1].y
        dx2 = movements[i + 1].x - movements[i].x
        dy2 = movements[i + 1].y - movements[i].y
        # Cross product ≈ 0 means perfectly straight
        cross = abs(dx1 * dy2 - dy1 * dx2)
        if cross > 50:
            direction_changes += 1

    linearity_ratio = direction_changes / max(len(movements) - 2, 1)
    if linearity_ratio < 0.05:
        result.add_signal("Mouse path is unnaturally linear (< 5% direction changes)", weight=0.25)
