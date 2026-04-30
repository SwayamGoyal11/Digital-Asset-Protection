"""
VaultX – Identity Intelligence Platform
FastAPI Application Entry Point

Run with:
  uvicorn main:app --reload --port 8000
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from db.database import engine, Base
from db.mongodb import mongo_db
from api.routes import router

load_dotenv(Path(__file__).resolve().parent / ".env")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in FRONTEND_URL.split(",")
    if origin.strip()
]
for local_origin in ("http://localhost:3000", "http://127.0.0.1:3000"):
    if local_origin not in ALLOWED_ORIGINS:
        ALLOWED_ORIGINS.append(local_origin)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create all database tables on startup."""
    # Import all models so SQLAlchemy registers them before create_all
    import models.db_models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    mongo_db.connect()
    mongo_status = "connected" if mongo_db.is_connected else "OFFLINE (SQLite only)"
    print(f"\n{'='*60}")
    print(f"  VaultX – Identity Intelligence Platform")
    print(f"  SQLite:  OK")
    print(f"  MongoDB: {mongo_status}")
    print(f"{'='*60}\n")
    yield
    mongo_db.close()
    print("[BYE] VaultX shutting down")


app = FastAPI(
    title="VaultX – Identity Intelligence Platform",
    description="Real-time fraud detection via device fingerprinting, behavioral biometrics, and risk scoring.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routes ───────────────────────────────────────────────────────────────────
app.include_router(router, prefix="/api")


@app.get("/")
def root():
    return {
        "name":    "VaultX",
        "version": "1.0.0",
        "docs":    "/docs",
        "status":  "operational",
    }


@app.get("/health")
def health():
    mongo_connected = mongo_db.is_connected and mongo_db.ping()
    return {
        "status": "ok",
        "sqlite": "connected",
        "mongodb": "connected" if mongo_connected else "offline",
    }
