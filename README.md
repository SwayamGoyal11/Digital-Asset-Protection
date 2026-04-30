# 🛡️ VaultX — Identity Intelligence Platform

## 📖 Overview

**VaultX** is a production-grade Identity Intelligence Platform that protects digital assets through multi-layered fraud detection. It silently analyzes every login and transaction using:

- 🖥️ **Device Fingerprinting** — Canvas, WebGL, font, and hardware-based device IDs detect unknown devices in real time
- 🤖 **Behavioral Biometrics** — Keystroke cadence and mouse-movement entropy distinguish humans from bots
- 🌍 **Geo-Velocity Anomaly Detection** — Haversine distance checks flag physically-impossible location jumps
- 📊 **Explainable Risk Scoring** — Every decision comes with human-readable reasoning, not just a score
- 🔗 **Multi-Account Detection** — Surfaces shared infrastructure between accounts to expose fraud rings
- ⚡ **WebSocket Alerting** — Sub-second push notifications to the live dashboard

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 Device Fingerprinting | Stable device IDs from canvas rendering, WebGL, fonts, and hardware |
| 🧠 ML Risk Engine | Isolation Forest + rule-based hybrid scoring |
| 🌐 Geo-Velocity Detection | Real-time impossible travel detection |
| 🤖 Bot Detection | Keystroke dynamics and interaction entropy analysis |
| 📡 Real-time Alerts | WebSocket broadcast to all connected dashboard clients |
| 📈 Live Dashboard | Next.js dashboard with animated charts and live activity feed |
| 📝 Explainable Decisions | Human-readable reasoning attached to every risk score |
| 🗄️ Flexible Database | SQLite for dev, PostgreSQL for production |

---

## 🧪 Fraud Detection Scenarios

VaultX ships with four demo accounts to demonstrate each detection module:

| Account | Scenario | What it triggers |
|---|---|---|
| 🟢 `alice@demo.com` | Normal login | Low risk — trusted device, known location |
| 🟡 `bob@demo.com` | New device | Device fingerprint mismatch alert |
| 🔴 `charlie@demo.com` | Bot simulation | Automated typing cadence flagged by ML model |
| 🟣 `diana@demo.com` | Geo-velocity anomaly | Impossible travel between two distant locations |

### How each module works

**Geo-Velocity Anomaly** — Detects logins from geographically distant locations within an impossibly short time window using Haversine distance calculations against travel-time thresholds.

**Bot Behavior Detection** — Analyzes keystroke timing intervals and mouse-movement entropy. Bots exhibit unnaturally consistent patterns that the Isolation Forest model scores as high-risk.

**New Device Fingerprinting** — Compares canvas rendering, WebGL capabilities, installed fonts, and hardware concurrency to build a stable device ID. Any first-seen device triggers an alert.

**Multi-Account Detection** — Clusters sessions by shared infrastructure (IP ranges, device fingerprints) to surface coordinated fraud rings.

---

## 🏗️ Architecture

```
Digital-Asset-Protection/
├── backend/                    # FastAPI Python backend
│   ├── main.py                 # Application entry point
│   ├── requirements.txt        # Python dependencies
│   ├── api/                    # REST route handlers
│   ├── models/                 # SQLAlchemy ORM + Pydantic schemas
│   ├── db/                     # Database engine & session management
│   ├── detection/              # Fraud detection modules
│   ├── risk_engine/            # Risk scoring orchestrator
│   ├── ml/                     # Isolation Forest ML models
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
| **Backend** | FastAPI, Python 3.10+, Pydantic v2 |
| **Database** | SQLite (dev) / MongoDB Atlas (prod) |
| **ML** | scikit-learn (Isolation Forest), NumPy |
| **Real-time** | Native FastAPI WebSockets |
| **Auth** | python-jose (JWT), passlib (bcrypt) |

---

## 🚀 Quick Start

### Prerequisites

- **Python** 3.10+
- **Node.js** 18+
- **npm** 9+

### 1. Clone

```bash
git clone https://github.com/SwayamGoyal11/Digital-Asset-Protection.git
cd Digital-Asset-Protection
```

### 2. Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # macOS / Linux
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env            # macOS / Linux
# copy .env.example .env        # Windows

# Start the API server
uvicorn main:app --reload --port 8000
```

> API available at **http://localhost:8000**  
> Interactive docs at **http://localhost:8000/docs**

### 3. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local    # macOS / Linux
npm run dev
```

> Dashboard available at **http://localhost:3000**

### 4. Seed Demo Data (Optional)

```bash
cd backend
python -m seed.demo_seed
```

This seeds all four fraud-detection scenarios for immediate testing.

---

## 🌍 Environment Variables

### Backend (`backend/.env`)

```env
# Database
DATABASE_URL=sqlite:///./vaultx.db

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
| `POST` | `/api/sessions` | Create & score a session |
| `GET` | `/api/alerts` | Retrieve fraud alerts |
| `GET` | `/api/risk/{session_id}` | Get full risk breakdown |
| `WS` | `/ws/alerts` | WebSocket alert stream |

Full interactive documentation is available at `http://localhost:8000/docs` when the server is running.

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) first.

```bash
git checkout -b feature/your-feature-name
git commit -m "feat: add your feature"
git push origin feature/your-feature-name
# Then open a Pull Request
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgements

- [FastAPI](https://fastapi.tiangolo.com/) — Modern Python web framework
- [Next.js](https://nextjs.org/) — React framework for production
- [scikit-learn](https://scikit-learn.org/) — Machine learning in Python
- [Framer Motion](https://www.framer.com/motion/) — Animation library for React

