# Deployment Guide

Architecture: **Frontend → Vercel**, **Backend (Docker) + PostgreSQL → Railway**.

Repo: https://github.com/Sudhanshupandit/My_Project

> The code is already on GitHub. These steps use the Railway and Vercel
> dashboards (no CLI needed). Total time ≈ 10–15 minutes.

---

## 1. Backend + Database on Railway

### 1a. Create the project and database
1. Go to **railway.app → Login** (use *Login with GitHub*).
2. **New Project → Deploy from GitHub repo →** select **`My_Project`**.
   (Authorize Railway to access the repo if prompted.)
3. Railway creates a service from the repo. Open that service →
   **Settings → Source** and set **Root Directory** to `backend`.
   This makes Railway build the backend using its `Dockerfile`
   (pinned via `backend/railway.json`).
4. Back in the project canvas, click **New → Database → Add PostgreSQL**.
   Railway provisions a Postgres instance with a `DATABASE_URL`.

### 1b. Wire the backend to the database
1. Open the **backend service → Variables → New Variable**:
   - **Name:** `DATABASE_URL`
   - **Value:** click the variable picker and choose
     `${{ Postgres.DATABASE_URL }}` (references the Postgres service).
2. Add another variable (set the real value after Vercel is live in step 3):
   - **Name:** `CORS_ORIGINS`  ·  **Value:** `*` (temporarily)
3. The backend redeploys automatically. It listens on Railway's `$PORT`
   (handled by the Dockerfile) and creates tables on startup.

### 1c. Get a public URL
1. Backend service → **Settings → Networking → Generate Domain**.
2. Copy the URL, e.g. `https://my-project-production.up.railway.app`.
3. Verify: open `<backend-url>/docs` — the FastAPI Swagger UI should load.

---

## 2. Frontend on Vercel

1. Go to **vercel.com → Add New → Project** and import **`My_Project`**.
2. Set **Root Directory** to `frontend`.
   Framework preset **Vite** is auto-detected (via `frontend/vercel.json`).
3. Add an **Environment Variable**:
   - **Name:** `VITE_API_URL`
   - **Value:** your Railway backend URL (no trailing slash), e.g.
     `https://my-project-production.up.railway.app`
4. Click **Deploy**. Copy the URL, e.g. `https://my-project.vercel.app`.

---

## 3. Lock CORS to your frontend

1. In Railway → backend service → **Variables**, change:
   - `CORS_ORIGINS` = `https://my-project.vercel.app`
2. Save → the backend redeploys. The API now only accepts your frontend.

---

## 4. Verify end-to-end

- Open the Vercel URL → the dashboard loads.
- Create a product / customer / order → data persists
  (proves frontend → backend → database).
- Refresh → the splash shows, then data reloads from the backend.

---

## Submission checklist

- [x] GitHub repo: https://github.com/Sudhanshupandit/My_Project
- [ ] Live frontend URL (Vercel)
- [ ] Live backend API URL (Railway `<url>/docs`)
- [ ] (Optional) Docker Hub backend image:
      `docker build -t <user>/oms-backend ./backend && docker push <user>/oms-backend`

## Environment variables reference

| Service  | Variable        | Value                                            |
|----------|-----------------|--------------------------------------------------|
| Backend  | `DATABASE_URL`  | `${{ Postgres.DATABASE_URL }}` (Railway ref)     |
| Backend  | `CORS_ORIGINS`  | `https://my-project.vercel.app`                  |
| Frontend | `VITE_API_URL`  | `https://my-project-production.up.railway.app`   |

## Notes / troubleshooting

- **Build uses Docker:** Root Directory `backend` + `backend/railway.json`
  force the Dockerfile builder. If Railway tries Nixpacks, re-check the
  Root Directory is exactly `backend`.
- **Port:** the Dockerfile runs `uvicorn ... --port ${PORT:-8000}`, so it
  binds to Railway's injected `$PORT` automatically.
- **DB scheme:** the backend rewrites `postgres://` → `postgresql://`
  automatically, so any Railway connection string works.
