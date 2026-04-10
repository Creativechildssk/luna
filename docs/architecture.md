# Architecture

LUNA is organized as a service-oriented FastAPI backend with a separate React frontend and a lightweight deployment layer based on Docker Compose and Nginx.

## High-level components

### Backend
- Framework: FastAPI
- Responsibilities:
	- astronomical calculations
	- visibility windows and time-based predictions
	- mission and alert CRUD operations
	- weather-assisted quality scoring inputs

### Frontend
- Framework: React with Vite
- Responsibilities:
	- interactive dashboard rendering
	- query orchestration through TanStack Query
	- map and compass visualization
	- AR camera flow and installable PWA behavior

### Data and persistence
- PostgreSQL is used for alert and mission persistence in the Compose deployment.
- Skyfield ephemeris and TLE files are stored in `backend/app/data`.
- Weather data is fetched from Open-Meteo.

## Backend structure
- `backend/app/main.py`: app bootstrap, middleware, router registration.
- `backend/app/api/`: HTTP route layer.
- `backend/app/services/`: astronomical and domain logic.
- `backend/app/models/`: SQLAlchemy and schema-related models.
- `backend/app/core/`: configuration and shared app settings.
- `backend/app/utils/`: helpers for time, direction, and math.

## Frontend structure
- `web/src/App.jsx`: top-level orchestration and route-like view switching.
- `web/src/components/`: reusable dashboard and visualization components.
- `web/src/api.js`: frontend API access layer.
- `web/src/index.css`: theme and global surface styling.

## Request flow
1. The web app requests observation data using lat/lon and a selected view.
2. FastAPI delegates calculation work to the relevant service layer.
3. Results are normalized into API payloads containing position, visibility state, timing, and metadata.
4. The frontend renders summary cards, maps, timelines, and AR support using those payloads.

## Deployment flow
1. Nginx accepts incoming traffic.
2. `/api` requests are proxied to the FastAPI backend.
3. Static web traffic is served by the frontend container.
4. The backend communicates with PostgreSQL and local astronomical data volumes.

## Design principles
- Keep astronomical computation in backend services, not in the frontend.
- Preserve backward compatibility for API consumers when possible.
- Use the frontend to present a focused observation workflow rather than generic dashboards.
- Isolate infrastructure concerns from feature logic.

## Related docs
- [docs/getting-started.md](docs/getting-started.md)
- [docs/api.md](docs/api.md)
- [docs/versioning.md](docs/versioning.md)
