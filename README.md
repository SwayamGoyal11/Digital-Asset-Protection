# 🛡️ Antigravity AI — Identity Intelligence Platform

<div align="center">

![Platform Banner](https://img.shields.io/badge/Antigravity%20AI-Identity%20Intelligence-6366f1?style=for-the-badge&logo=shield&logoColor=white)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

**Real-time fraud detection via device fingerprinting, behavioral biometrics, and context-aware risk scoring.**

[Features](#-features) · [Architecture](#-architecture) · [Quick Start](#-quick-start) · [API Docs](#-api-reference) · [Contributing](#-contributing)

</div>

---

## 📖 Overview

**Antigravity AI** is a production-grade Identity Intelligence Platform that protects digital assets through multi-layered fraud detection. It analyzes every login and transaction using:

- 🖥️ **Device Fingerprinting** — Detects new / unknown devices in real time
- 🤖 **Behavioral Biometrics** — Identifies bot-like patterns via typing cadence and interaction analysis
- 🌍 **Geo-Velocity Anomaly Detection** — Flags physically-impossible location jumps
- 📊 **Explainable Risk Scoring** — Every decision comes with human-readable reasoning
- 🔗 **Multi-Account Detection** — Surfaces shared infrastructure between accounts
- ⚡ **WebSocket Alerting** — Sub-second push notifications to the dashboard

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 Device Fingerprinting | Canvas, WebGL, font, and hardware-based device IDs |
| 🧠 ML Risk Engine | Isolation Forest + rule-based hybrid scoring |
| 🌐 Geo-Velocity | Haversine distance checks against travel-time thresholds |
| 🤖 Bot Detection | Keystroke dynamics and mouse-movement entropy analysis |
| 📡 Real-time Alerts | WebSocket broadcast to connected dashboard clients |
| 📈 Live Dashboard | Next.js dashboard with animated charts and activity feed |
| 🗄️ SQLite / SQLAlchemy | Zero-config embedded database for rapid prototyping |
| 📝 OpenAPI Docs | Auto-generated Swagger UI at `/docs` |

---

## 🏗️ Architecture

```
Digital asset protection project/
├── backend/                    # FastAPI Python backend
│   ├── main.py                 # Application entry point
│   ├── requirements.txt        # Python dependencies
│   ├── .env                    # Environment variables (git-ignored)
│   ├── api/                    # REST route handlers
│   ├── models/                 # SQLAlchemy ORM + Pydantic schemas
│   ├── db/                     # Database engine & session management
│   ├── detection/              # Fraud detection modules
│   ├── risk_engine/            # Risk scoring orchestrator
│   ├── ml/                     # Machine learning models
│   ├── behavior_profiler/      # Behavioral biometrics
│   ├── alerts/                 # Alert manager & notification system
│   ├── websocket/              # WebSocket connection handler
│   ├── services/               # External service integrations
│   └── seed/                   # Demo data seeding scripts
│
└── frontend/                   # Next.js 14 TypeScript frontend
    ├── app/                    # App Router pages & layouts
    ├── components/             # Reusable React components
    ├── lib/                    # API client, utilities, hooks
    └── types/                  # Shared TypeScript types
```

### Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, Framer Motion |
| **Backend** | FastAPI, Python 3.10+, SQLAlchemy, Pydantic v2 |
| **Database** | SQLite (dev) / PostgreSQL (prod) |
| **ML** | scikit-learn (Isolation Forest), NumPy |
| **Real-time** | WebSockets (native FastAPI) |
| **Auth** | python-jose (JWT), passlib (bcrypt) |

---

## 🚀 Quick Start

### Prerequisites

- **Python** 3.10 or higher
- **Node.js** 18 or higher
- **npm** 9 or higher

### 1. Clone the Repository

```bash
git clone https://github.com/SwayamGoyal11/Digital-Asset-Protection.git
cd Digital-Asset-Protection
```

### 2. Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template and configure
copy .env.example .env      # Windows
# cp .env.example .env      # macOS / Linux

# Start the API server
uvicorn main:app --reload --port 8000
```

> The backend will be available at **http://localhost:8000**
> Interactive API docs: **http://localhost:8000/docs**

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment template
copy .env.local.example .env.local    # Windows
# cp .env.local.example .env.local   # macOS / Linux

# Start the development server
npm run dev
```

> The dashboard will be available at **http://localhost:3000**

### 4. Seed Demo Data (Optional)

```bash
cd backend
python -m seed.demo_seed
```

This seeds four fraud-detection scenarios:
- ✅ **Normal Login** — Baseline trusted session
- 📱 **New Device** — First-seen device fingerprint
- 🤖 **Bot Behavior** — Automated interaction patterns
- ✈️ **Geo-Velocity** — Impossible travel detection

---

## 🌍 Environment Variables

### Backend (`backend/.env`)

```env
# Database
DATABASE_URL=sqlite:///./antigravity.db

# Security
SECRET_KEY=your-super-secret-jwt-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
FRONTEND_URL=http://localhost:3000

# External APIs (optional)
GEOLOCATION_API_KEY=your-api-key
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Platform status |
| `GET` | `/health` | Health check |
| `GET` | `/docs` | Swagger UI |
| `POST` | `/api/auth/login` | Authenticate user |
| `GET` | `/api/sessions` | List all sessions |
| `POST` | `/api/sessions` | Create / score a session |
| `GET` | `/api/alerts` | Retrieve fraud alerts |
| `GET` | `/api/risk/{session_id}` | Get risk breakdown |
| `WS` | `/ws/alerts` | WebSocket alert stream |

Full interactive documentation is available at `http://localhost:8000/docs` when the server is running.

---

## 🧪 Fraud Detection Scenarios

### Geo-Velocity Anomaly
Detects logins from geographically distant locations within an impossibly short time window using Haversine distance calculations.

### Bot Behavior Detection
Analyzes keystroke timing, mouse movement entropy, and interaction cadence to distinguish humans from automation.

### New Device Fingerprinting
Compares canvas rendering, WebGL capabilities, installed fonts, and hardware concurrency to build a stable device ID.

### Multi-Account Detection
Clusters sessions by shared infrastructure (IP ranges, device fingerprints) to surface coordinated fraud rings.

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) first.

```bash
# Fork → Clone → Branch → Commit → PR
git checkout -b feature/your-feature-name
git commit -m "feat: add your feature"
git push origin feature/your-feature-name
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- [FastAPI](https://fastapi.tiangolo.com/) — Modern Python web framework
- [Next.js](https://nextjs.org/) — React framework for production
- [scikit-learn](https://scikit-learn.org/) — Machine learning in Python
- [Framer Motion](https://www.framer.com/motion/) — Animation library for React

---

<div align="center">
Built with ❤️ by <a href="https://github.com/SwayamGoyal11">SwayamGoyal11</a>
</div>
