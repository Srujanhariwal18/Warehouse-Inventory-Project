# Warehouse Inventory Management System

Local-first warehouse inventory application built with Spring Boot and React.

## Prerequisites

- Java 21, Maven 3.9+, Node 20+
- A Supabase PostgreSQL project (or local PostgreSQL)
- A Clerk application configured with a JWT template and webhook

## Setup

1. Copy `backend/.env.example` to `backend/.env` and fill database and Clerk settings.
2. Create a Supabase project, then set `SUPABASE_DB_URL` to its JDBC URL and `DB_USERNAME` / `DB_PASSWORD` to database credentials. The Flyway migration creates the schema at startup.
3. In Clerk, create roles in user public metadata as `role: ADMIN` or `role: STAFF`; configure its JWT issuer/JWKS values and a Svix webhook signing secret.
4. Copy `frontend/.env.example` to `frontend/.env`, provide the Clerk publishable key, then run the commands below.

```powershell
cd backend; mvn spring-boot:run
cd frontend; npm install; npm run dev
```

Swagger UI is at `http://localhost:8080/swagger-ui/index.html`. The API is served under `/api/v1`.

## Features delivered

- Atomic stock in/out, negative-stock prevention, low-stock alert de-duplication
- Clerk JWT resource-server integration and a Svix-verified webhook endpoint
- Items, transactions, alerts, dashboard, exports, user role management endpoints
- Flyway PostgreSQL schema and demo data
- Responsive Clerk-enabled React UI with dark mode, barcode/USB scanner input and role-aware navigation
- JUnit service tests for stock rules and alert behavior

### API map

`GET/POST /api/v1/items`, `GET /api/v1/items/barcode/{barcode}`, `GET/POST /api/v1/transactions`, `GET/PATCH /api/v1/alerts`, `GET /api/v1/dashboard`, and admin report downloads at `/api/v1/reports/items.{csv,pdf}` are implemented. Clerk event delivery is received at `/webhooks/clerk`; wire the official Svix verifier before accepting production traffic.

For production, set real Clerk/Supabase secrets in environment variables; never commit `.env` files.
