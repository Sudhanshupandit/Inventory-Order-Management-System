# 📦 Inventory & Order Management System

A production-ready, fully containerized **Inventory & Order Management System** that lets businesses manage products, customers, and orders with live inventory tracking. Built with a **React** frontend, a **FastAPI (Python)** backend, and a **PostgreSQL** database — all orchestrated with **Docker Compose**.

---

## ✨ Features

- **Product management** — create, view, update, and delete products (name, SKU, price, stock).
- **Customer management** — register, list, and remove customers with unique-email validation.
- **Order management** — draft multi-item orders, view order details, and cancel orders (which restores stock).
- **Live inventory tracking** — placing an order automatically deducts stock; cancelling restores it.
- **Dashboard** — at-a-glance totals (products, customers, orders, revenue), a **7-day revenue trend chart**, and **low-stock alerts**.
- **Polished UX** — responsive layout (desktop + mobile), **dark / light theme toggle**, themed confirm dialogs, form validation, and clear success/error messages.

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (JavaScript) + Vite |
| Backend | Python · FastAPI · SQLAlchemy |
| Database | PostgreSQL 15 |
| Containerization | Docker · Docker Compose |
| Web server (frontend image) | Nginx |

---

## 📐 Business Rules

- Product SKU/code must be **unique**.
- Customer email must be **unique**.
- Product quantity can **never be negative**.
- Orders **cannot** be placed if inventory is insufficient.
- Creating an order **automatically reduces** available stock.
- The total order amount is **calculated by the backend**.
- All APIs use proper validation, error handling, and HTTP status codes.

---

## 🗂️ Project Structure

```
Order Management System/
├── backend/                # FastAPI application
│   ├── app/
│   │   ├── main.py         # API routes
│   │   ├── crud.py         # Database operations & business logic
│   │   ├── models.py       # SQLAlchemy models
│   │   ├── schemas.py      # Pydantic schemas
│   │   ├── database.py     # DB engine/session
│   │   └── config.py       # Settings (env-driven)
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/               # React + Vite app
│   ├── src/
│   │   ├── components/     # Dashboard, Products, Customers, Orders, ...
│   │   ├── api.js          # API client
│   │   └── index.css       # Design system / theming
│   ├── Dockerfile
│   ├── vercel.json
│   └── .env.example
├── docker-compose.yml      # Orchestrates db + backend + frontend
└── DEPLOYMENT.md           # Step-by-step deployment guide (Vercel + Railway)
```

---

## 🚀 Getting Started (Local, with Docker)

**Prerequisites:** Docker & Docker Compose.

```bash
# From the project root
docker compose up --build
```

This starts three services:

| Service | URL |
|---------|-----|
| Frontend | http://localhost |
| Backend API (Swagger docs) | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |

To stop:

```bash
docker compose down          # keep data
docker compose down -v        # also remove the database volume
```

### Running the frontend on its own (dev mode)

```bash
cd frontend
npm install
npm run dev                    # http://localhost:3000
```

Set `VITE_API_URL` in `frontend/.env` to point at your backend (defaults to `http://localhost:8000`).

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/stats` | Dashboard summary stats |
| POST | `/products` | Create a product |
| GET | `/products` | List all products |
| GET | `/products/{id}` | Get a product |
| PUT | `/products/{id}` | Update a product |
| DELETE | `/products/{id}` | Delete a product |
| POST | `/customers` | Create a customer |
| GET | `/customers` | List all customers |
| GET | `/customers/{id}` | Get a customer |
| DELETE | `/customers/{id}` | Delete a customer |
| POST | `/orders` | Create an order |
| GET | `/orders` | List all orders |
| GET | `/orders/{id}` | Get order details |
| DELETE | `/orders/{id}` | Cancel/delete an order |

Interactive docs are available at `/docs` (Swagger) and `/redoc`.

---

## ⚙️ Environment Variables

**Backend** (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Full Postgres connection string (used in production) |
| `CORS_ORIGINS` | Allowed frontend origin(s), comma-separated (`*` for all) |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` / `POSTGRES_HOST` / `POSTGRES_PORT` | Local/compose fallback when `DATABASE_URL` is unset |

**Frontend** (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Base URL of the backend API |

See `.env.example` in each folder for templates.

---

## ☁️ Deployment

The app deploys as **Frontend → Vercel** and **Backend + PostgreSQL → Railway**.
Full click-by-click instructions are in **[DEPLOYMENT.md](DEPLOYMENT.md)**.

---

## 📄 License

This project was built as a technical assessment.
