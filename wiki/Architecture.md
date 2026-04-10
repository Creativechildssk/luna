# Architecture

LUNA keeps things simple: backend API, frontend app, and deployment infrastructure.

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
