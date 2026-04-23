"""
Multi-Account Detection Service.

Detects when multiple distinct user accounts are being used from the same
device fingerprint — a strong signal for account farming / ban evasion.
"""

from __future__ import annotations
from sqlalchemy.orm import Session
from services.device_service import get_users_for_device


MULTI_ACCOUNT_THRESHOLD = 2   # > this many users on one device = suspicious


def check_multi_account(db: Session, device_id: str, current_user_id: int) -> dict:
    """
    Check whether the device has been used by multiple accounts.

    Args:
        db: Database session.
        device_id: The current device fingerprint.
        current_user_id: The user attempting to log in.

    Returns:
        {
            "detected": bool,
            "user_count": int,
            "other_user_ids": list[int],
        }
    """
    all_user_ids = get_users_for_device(db, device_id)
    other_users  = [uid for uid in all_user_ids if uid != current_user_id]

    return {
        "detected":      len(all_user_ids) > MULTI_ACCOUNT_THRESHOLD,
        "user_count":    len(all_user_ids),
        "other_user_ids": other_users,
    }
