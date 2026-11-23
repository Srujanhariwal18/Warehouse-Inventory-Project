# Warehouse Inventory Management System

Modern, enterprise-grade warehouse management platform built with Spring Boot 3 (Java 21), React 19, Clerk Authentication, and PostgreSQL / Supabase.

---

## Quick Start (Local Development)

You will need **two terminal windows**: one for the backend and one for the frontend.

### Terminal 1: Backend (Spring Boot / Java 21)

```powershell
cd "d:\Projects\Java Project\backend"
.\mvnw.cmd spring-boot:run
```
> **Alternative (Fast start with packaged JAR)**:
> ```powershell
> cd "d:\Projects\Java Project\backend"
> java -jar target\app.jar
> ```

* **API Base URL**: `http://localhost:8080/api/v1`
* **Health Check**: `http://localhost:8080/api/v1/health`
* **Swagger API Docs**: `http://localhost:8080/swagger-ui/index.html`

---

### Terminal 2: Frontend (React 19 + TypeScript + Vite)

```powershell
cd "d:\Projects\Java Project\frontend"
npm run dev
```

* **Frontend UI**: `http://localhost:5173`
* Open `http://localhost:5173` in your browser.

---

## Running with Docker (Backend)

You can build and run the backend container locally or on any cloud container service (Render, Fly.io, Railway, AWS):

```powershell
# Build image
docker build -t warehouse-backend -f backend/Dockerfile backend/

# Run container
docker run -p 8080:8080 --env-file backend/.env warehouse-backend
```

---

## Production Deployment on Render

This project includes a pre-configured [render.yaml](render.yaml) and multi-stage [Dockerfile](backend/Dockerfile):

1. Push your repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com/), select **New +** → **Blueprint** (or **Web Service** with Docker runtime).
3. The backend dynamically binds to Render's `$PORT` and auto-normalizes Supabase pooler connections.
