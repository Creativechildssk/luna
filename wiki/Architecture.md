# Architecture

LUNA uses a split frontend and backend architecture.

## Backend
- FastAPI application
- service-oriented astronomy calculations
- persistence for alerts and missions

## Frontend
- React and Vite
- TanStack Query for data fetching
- Leaflet and custom components for visualization
- PWA and mobile AR support

## Infra
- Docker Compose orchestration
- Nginx reverse proxy
- PostgreSQL database

Detailed architecture doc: [docs/architecture.md](../docs/architecture.md)
