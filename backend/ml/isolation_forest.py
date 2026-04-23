"""
Isolation Forest anomaly detector (ML layer – optional).

Trains on behavioral feature vectors from past login sessions and
scores new sessions as normal (score ≈ 0) or anomalous (score → 1).

The model trains automatically once MIN_SAMPLES sessions are stored.
"""

from __future__ import annotations
import os
import pickle
import numpy as np
from pathlib import Path
from typing import Optional

# sklearn is imported lazily to avoid startup failure if not installed
try:
    from sklearn.ensemble import IsolationForest
    _SKLEARN_AVAILABLE = True
except ImportError:
    _SKLEARN_AVAILABLE = False

MIN_SAMPLES     = 50          # Minimum sessions before training
MODEL_PATH      = Path("ml/model.pkl")
CONTAMINATION   = 0.1         # Expected fraction of anomalies in training set


def score_session(features: dict) -> Optional[float]:
    """
    Score a behavioral feature vector using the trained model.

    Args:
        features: Output of behavior_profiler.extractor.BehaviorFeatures.to_dict()

    Returns:
        Anomaly score in [0, 1] where 1 is most anomalous, or None if model unavailable.
    """
    if not _SKLEARN_AVAILABLE or not MODEL_PATH.exists():
        return None

    model = _load_model()
    if model is None:
        return None

    vector = _features_to_vector(features)
    # IsolationForest returns -1 (anomaly) or +1 (normal)
    raw = model.decision_function([vector])[0]
    # Normalize to [0, 1]: decision_function returns negative for anomalies
    score = max(0.0, min(1.0, (0.5 - raw)))
    return round(score, 4)


def train_model(feature_list: list[dict]):
    """
    (Re)train the Isolation Forest on a list of feature dicts.
    Called by the seed script or a background job.
    """
    if not _SKLEARN_AVAILABLE or len(feature_list) < MIN_SAMPLES:
        return

    X = np.array([_features_to_vector(f) for f in feature_list])
    model = IsolationForest(contamination=CONTAMINATION, random_state=42, n_estimators=100)
    model.fit(X)

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)


def _load_model():
    try:
        with open(MODEL_PATH, "rb") as f:
            return pickle.load(f)
    except Exception:
        return None


def _features_to_vector(features: dict) -> list:
    """Convert feature dict to a fixed-length numeric vector."""
    return [
        features.get("typing_speed_cps", 0.0),
        features.get("avg_keystroke_interval_ms", 0.0),
        features.get("keystroke_variance_ms", 0.0),
        features.get("avg_mouse_speed_px_sec", 0.0),
        features.get("mouse_direction_changes", 0),
        features.get("form_fill_duration_ms", 0.0),
        features.get("key_count", 0),
    ]
