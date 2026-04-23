"""
Antigravity AI – Identity Intelligence Platform
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

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from db.database import engine, Base
from api.routes import router

load_dotenv()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create all database tables on startup."""
    # Import all models so SQLAlchemy registers them before create_all
    import models.db_models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    print("[OK] Database tables created / verified")
    yield
    print("[BYE] Antigravity AI shutting down")


app = FastAPI(
    title="Antigravity AI – Identity Intelligence Platform",
    description="Real-time fraud detection via device fingerprinting, behavioral biometrics, and risk scoring.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routes ───────────────────────────────────────────────────────────────────
app.include_router(router, prefix="/api")


@app.get("/")
def root():
    return {
        "name":    "Antigravity AI",
        "version": "1.0.0",
        "docs":    "/docs",
        "status":  "operational",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
