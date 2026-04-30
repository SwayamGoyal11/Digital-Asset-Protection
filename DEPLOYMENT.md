# Deployment

# Deployment

This repository is a monorepo. On Vercel, create two projects from the same
GitHub repository:

- Frontend project with root directory `frontend/`
- Backend project with root directory `backend/`

Keep secrets in the hosting provider's environment variables, not in Git.

## Important Production Notes

- Use hosted Postgres for `DATABASE_URL` in production. The local SQLite file is
  only for development.
- MongoDB Atlas is used as a mirror for users, login events, and alerts.
- Vercel Functions are not suitable for persistent WebSocket connections. Leave
  `NEXT_PUBLIC_WS_URL` unset in production unless you deploy realtime alerts on
  a WebSocket-capable service.

## Backend on Vercel

Create a new Vercel project:

1. Import the GitHub repository.
2. Set the Root Directory to `backend`.
3. Framework Preset: Other.
4. Install Command: `pip install -r requirements.txt`
5. Build Command: leave empty.
6. Output Directory: leave empty.

The backend exposes `backend/app.py`, which imports the FastAPI `app` from
`backend/main.py`.

## Backend Environment

Set these variables on the backend Vercel project:

```env
DATABASE_URL=postgresql+psycopg://<user>:<password>@<host>/<database>?sslmode=require
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

You can get a Postgres URL from Neon, Supabase, Railway, Render, or Vercel
Marketplace integrations. Do not use `sqlite:///./antigravity.db` in production.

If you need multiple frontend origins, separate them with commas:

```env
FRONTEND_URL=https://your-frontend-domain.vercel.app,http://localhost:3000
```

## Frontend on Vercel

Create another Vercel project:

1. Import the same GitHub repository.
2. Set the Root Directory to `frontend`.
3. Framework Preset: Next.js.
4. Install Command: `npm install`
5. Build Command: `npm run build`
6. Output Directory: leave empty.

## Frontend Environment

Set these variables on the frontend Vercel project after the backend deploys:

```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.vercel.app/api
```

Do not set `NEXT_PUBLIC_WS_URL` on Vercel unless you have a separate realtime
provider or WebSocket-capable backend.

## Local Development

Backend:

```bash
cd backend
uvicorn main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm run dev
```
