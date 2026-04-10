# Architecture

LUNA has a simple split architecture: a FastAPI backend, a React frontend, and a Docker Compose deployment layer.

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
1. The web app sends lat/lon and the selected view to the API.
2. FastAPI delegates calculation work to the relevant service layer.
3. Results are normalized into payloads with position, visibility, timing, and metadata.
4. The frontend renders summary cards, maps, timelines, and AR support using those payloads.

## Deployment flow
1. Nginx accepts incoming traffic.
2. `/api` requests are proxied to the FastAPI backend.
3. Static web traffic is served by the frontend container.
4. The backend communicates with PostgreSQL and local astronomical data volumes.

## Design principles
- Keep astronomy math in backend services, not frontend components.
- Preserve backward compatibility for API consumers whenever possible.
- Keep the UI focused on observation decisions instead of generic dashboards.
- Keep infrastructure concerns separate from feature logic.

## Related docs
- [docs/getting-started.md](docs/getting-started.md)
- [docs/api.md](docs/api.md)
- [docs/versioning.md](docs/versioning.md)
