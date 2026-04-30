# Deployment

Recommended setup:

- Deploy `backend/` as a Python FastAPI service.
- Deploy `frontend/` as a Next.js app.
- Keep secrets in the hosting provider's environment variables, not in Git.

## Backend Environment

Set these variables on your backend host:

```env
DATABASE_URL=sqlite:///./antigravity.db
SECRET_KEY=<long-random-secret>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
FRONTEND_URL=https://your-frontend-domain.vercel.app
GEO_API_URL=http://ip-api.com/json
RISK_THRESHOLD_HIGH=70
RISK_THRESHOLD_MEDIUM=40
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/?appName=Cluster0
MONGO_DB_NAME=vaultx
```

If you need multiple frontend origins, separate them with commas:

```env
FRONTEND_URL=https://your-frontend-domain.vercel.app,http://localhost:3000
```

## Backend Commands

Install:

```bash
pip install -r requirements.txt
```

Start:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

On Windows/local development:

```bash
uvicorn main:app --reload --port 8000
```

## Frontend Environment

Set these variables on your frontend host:

```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.onrender.com/api
NEXT_PUBLIC_WS_URL=wss://your-backend-domain.onrender.com/api
```

## Frontend Commands

Install:

```bash
npm install
```

Build:

```bash
npm run build
```

Start:

```bash
npm start
```
