"""
Explainable AI layer for the risk engine.

Transforms raw RiskOutput factors into human-readable explanations
with color severity hints for the dashboard.
"""

from __future__ import annotations
from typing import List
from risk_engine.scorer import RiskOutput


SEVERITY_COLORS = {
    "LOW":      "#22c55e",   # green
    "MEDIUM":   "#f59e0b",   # amber
    "HIGH":     "#ef4444",   # red
    "CRITICAL": "#a855f7",   # purple
}


def build_explanation(output: RiskOutput) -> dict:
    """
    Build a fully explainable response object from a RiskOutput.

    Returns:
        {
            "risk_score": float,
            "risk_level": str,
            "color": str (hex),
            "summary": str,
            "factors": [{"reason": str, "impact": float, "percentage": float}],
        }
    """
    total_impact = sum(f["impact"] for f in output.factors) or 1.0

    enriched_factors = [
        {
            "reason":     f["reason"],
            "impact":     f["impact"],
            "percentage": round((f["impact"] / total_impact) * 100, 1),
        }
        for f in output.factors
    ]

    # Sort by impact descending for display
    enriched_factors.sort(key=lambda x: x["impact"], reverse=True)

    summary = _build_summary(output.risk_level, enriched_factors)

    return {
        "risk_score": round(output.risk_score, 2),
        "risk_level": output.risk_level,
        "color":      SEVERITY_COLORS.get(output.risk_level, "#64748b"),
        "summary":    summary,
        "factors":    enriched_factors,
    }


def _build_summary(risk_level: str, factors: List[dict]) -> str:
    if not factors:
        return "No significant risk indicators detected."

    top = factors[0]["reason"]
    count = len(factors)

    messages = {
        "LOW":      f"Login appears normal. Primary observation: {top}.",
        "MEDIUM":   f"Moderate risk detected. Primary factor: {top}. ({count} indicator{'s' if count > 1 else ''} flagged)",
        "HIGH":     f"High risk login. Primary factor: {top}. Immediate review recommended.",
        "CRITICAL": f"CRITICAL risk. {top} and {count - 1} other factor(s). Login should be blocked.",
    }
    return messages.get(risk_level, "Unknown risk level.")
