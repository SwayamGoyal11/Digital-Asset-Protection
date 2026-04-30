"""MongoDB Atlas connection helpers.

MongoDB is an optional mirror for selected SQLite records. If Atlas is
unavailable, the request pipeline continues to use SQLite.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

logger = logging.getLogger("vaultx.mongodb")


class _SafeCollection:
    """Wrap a pymongo collection without letting mirror writes break requests."""

    def __init__(self, owner: "_MongoDB", collection_name: str):
        self._owner = owner
        self._name = collection_name

    @property
    def _col(self):
        return self._owner.db[self._name] if self._owner.db is not None else None

    def insert_one(self, doc: dict):
        if self._col is None:
            return None
        try:
            return self._col.insert_one(doc)
        except Exception as exc:
            logger.error("[MongoDB] insert_one(%s) failed: %s", self._name, exc)
            return None

    def find(self, *args, **kwargs):
        if self._col is None:
            return []
        try:
            return self._col.find(*args, **kwargs)
        except Exception as exc:
            logger.error("[MongoDB] find(%s) failed: %s", self._name, exc)
            return []

    def find_one(self, *args, **kwargs):
        if self._col is None:
            return None
        try:
            return self._col.find_one(*args, **kwargs)
        except Exception as exc:
            logger.error("[MongoDB] find_one(%s) failed: %s", self._name, exc)
            return None

    def count_documents(self, *args, **kwargs):
        if self._col is None:
            return 0
        try:
            return self._col.count_documents(*args, **kwargs)
        except Exception as exc:
            logger.error("[MongoDB] count_documents(%s) failed: %s", self._name, exc)
            return 0

    def update_one(self, *args, **kwargs):
        if self._col is None:
            return None
        try:
            return self._col.update_one(*args, **kwargs)
        except Exception as exc:
            logger.error("[MongoDB] update_one(%s) failed: %s", self._name, exc)
            return None


class _MongoDB:
    """Namespace exposing typed safe-collection accessors."""

    def __init__(self) -> None:
        self.client = None
        self.db = None
        self.db_name = os.getenv("MONGO_DB_NAME", "vaultx").strip() or "vaultx"

    def connect(self) -> bool:
        if self.db is not None:
            return True

        uri = os.getenv("MONGO_URI", "").strip()
        self.db_name = os.getenv("MONGO_DB_NAME", "vaultx").strip() or "vaultx"

        if not uri:
            logger.warning("[MongoDB] MONGO_URI not set; MongoDB mirror disabled.")
            return False

        try:
            from pymongo import MongoClient
            from pymongo.server_api import ServerApi

            self.client = MongoClient(
                uri,
                server_api=ServerApi("1"),
                serverSelectionTimeoutMS=5_000,
                connectTimeoutMS=5_000,
            )
            self.client.admin.command("ping")
            self.db = self.client[self.db_name]
            self._create_indexes()
            logger.info("[MongoDB] Connected to Atlas db=%s", self.db_name)
            print(f"[OK] MongoDB Atlas connected -> db={self.db_name}")
            return True
        except Exception as exc:
            logger.exception("[MongoDB] Connection failed")
            print(f"[WARN] MongoDB unavailable; continuing with SQLite only: {exc}")
            self.client = None
            self.db = None
            return False

    def close(self) -> None:
        if self.client is not None:
            self.client.close()
        self.client = None
        self.db = None

    def ping(self) -> bool:
        if self.client is None:
            return False
        try:
            self.client.admin.command("ping")
            return True
        except Exception as exc:
            logger.error("[MongoDB] ping failed: %s", exc)
            self.close()
            return False

    def _create_indexes(self) -> None:
        if self.db is None:
            return
        self.db.login_events.create_index([("user_id", 1), ("timestamp", -1)])
        self.db.login_events.create_index([("risk_level", 1)])
        self.db.login_events.create_index([("is_flagged", 1)])
        self.db.alerts.create_index([("user_id", 1), ("timestamp", -1)])
        self.db.alerts.create_index([("severity", 1)])
        self.db.alerts.create_index([("is_read", 1)])
        self.db.sessions.create_index([("user_id", 1), ("timestamp", -1)])
        self.db.users.create_index([("sql_id", 1)], unique=True)
        self.db.users.create_index([("email", 1)], unique=True)

    @property
    def login_events(self) -> _SafeCollection:
        return _SafeCollection(self, "login_events")

    @property
    def alerts(self) -> _SafeCollection:
        return _SafeCollection(self, "alerts")

    @property
    def sessions(self) -> _SafeCollection:
        return _SafeCollection(self, "sessions")

    @property
    def users(self) -> _SafeCollection:
        return _SafeCollection(self, "users")

    @property
    def is_connected(self) -> bool:
        return self.db is not None


mongo_db = _MongoDB()
