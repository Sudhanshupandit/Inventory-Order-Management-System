# Deployment Guide

Architecture: **Frontend → Vercel**, **Backend (Docker) + PostgreSQL → Render**.

> Why not "all on Vercel"? Vercel hosts static/serverless frontends only — it
> cannot run a persistent FastAPI server or a managed PostgreSQL database. This
> split is also what the assessment requires.

---

## 0. Push to GitHub (one-time)

Both platforms deploy from a Git repo. From the `Order Management System` folder:

```bash
git init
git add .
git commit -m "Inventory & Order Management System"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

Treat the `Order Management System` folder as the **repo root** (it contains
`backend/`, `frontend/`, `render.yaml`, `docker-compose.yml`).

---

## 1. Backend + Database on Render (Blueprint)

1. Go to **dashboard.render.com → New + → Blueprint**.
2. Connect your GitHub repo. Render auto-detects [`render.yaml`](render.yaml).
   - If the repo root is the parent folder, set the Blueprint's root to
     `Order Management System` when prompted.
3. Click **Apply**. Render creates:
   - `order-management-db` — free PostgreSQL.
   - `order-management-api` — your Dockerized FastAPI backend, with
     `DATABASE_URL` injected automatically from the DB.
4. Wait for the backend to go **Live**, then copy its URL, e.g.
   `https://order-management-api.onrender.com`.
5. Verify: open `<backend-url>/docs` — the FastAPI Swagger UI should load.

> Free Render services sleep after inactivity; the first request after idling
> takes ~30–50s to wake. Free Postgres expires after 30 days.

---

## 2. Frontend on Vercel

1. Go to **vercel.com → Add New → Project** and import the same GitHub repo.
2. Set **Root Directory** to `frontend` (or
   `Order Management System/frontend` if you pushed the parent folder).
   Framework preset: **Vite** (auto-detected via [`vercel.json`](frontend/vercel.json)).
3. Add an **Environment Variable**:
   - `VITE_API_URL` = your Render backend URL (no trailing slash), e.g.
     `https://order-management-api.onrender.com`
4. Click **Deploy**. Copy the resulting URL, e.g. `https://your-app.vercel.app`.

---

## 3. Lock CORS to your frontend

1. In Render → `order-management-api` → **Environment**, set:
   - `CORS_ORIGINS` = `https://your-app.vercel.app`
2. **Save** → the service redeploys. The API now only accepts your frontend.

---

## 4. Verify end-to-end

- Open the Vercel URL → the dashboard loads.
- Create a product / customer / order → data persists (proves frontend → backend → DB).
- Refresh → the 3-second splash shows, then data reloads from the backend.

---

## Submission checklist (per the assessment)

- [ ] GitHub repo link (frontend + backend)
- [ ] Docker Hub image link for the backend
      (`docker build -t <user>/oms-backend ./backend && docker push <user>/oms-backend`)
- [ ] Live frontend URL (Vercel)
- [ ] Live backend API URL (Render, e.g. `<backend-url>/docs`)

## Environment variables reference

| Service  | Variable        | Value                                   |
|----------|-----------------|-----------------------------------------|
| Backend  | `DATABASE_URL`  | auto-injected by Render from the DB     |
| Backend  | `CORS_ORIGINS`  | `https://your-app.vercel.app`           |
| Frontend | `VITE_API_URL`  | `https://order-management-api.onrender.com` |
