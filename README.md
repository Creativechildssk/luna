# LUNA

Full-stack moon/planet/satellite visibility API with web UI.

## Project Structure
- backend/ — FastAPI + Skyfield, Postgres alerts
- web/ — Vite/React (TanStack Query, Leaflet)
- infra/ — nginx reverse proxy
- docker-compose.yml — backend+web+nginx+postgres stack

## Run locally (no Docker)
### Backend
`ash
cd backend
python -m venv .venv
. .venv/Scripts/activate  # or source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
`
Env vars:
- DATABASE_URL (optional; Postgres). If unset, SQLite fallback.

### Web
`ash
cd web
npm install
npm run dev -- --host --port 3000
`
Set VITE_API_BASE to http://localhost:8000 or /api when fronted by nginx.

## Run with Docker
`ash
cd ~/luna
docker compose up -d --build
`
Services: backend (8000 internal), web (3000 internal), nginx (80/443), postgres (5432).
Certs: mount /etc/letsencrypt for TLS; nginx listens on 443 if certs exist.

## Production endpoint
- Web: https://luna.wfddeeptechlabs.com
- API proxied at /api/*

## Features
- Moon/planet/satellite visibility window (rise/set/best, duration, direction, distance)
- Visibility state, is_night, quality score (cloud cover via Open-Meteo)
- Satellite list/track (CelesTrak TLE), alerts API (Postgres)
- Live countdowns, responsive layout, AR Quick View (camera + heading)
- Error banners, skeleton loaders, compass visual, timeline progress

## AR Quick View
- Access via “📷 AR view” on Visibility card
- Uses device camera + orientation to guide to target az/alt (web, no install)

## Known limitations
- Geolocation blocked on plain HTTP; use HTTPS or enter lat/lon manually
- AR is lightweight (no plane detection); guidance uses compass accuracy

## Deploy notes
- Open SG ports 80/443; Postgres on 5432 internal
- For TLS: sudo certbot certonly --standalone -d <domain> then docker compose up -d
- For AWS package reliability, optionally set pip mirror vars before build:
  - PIP_INDEX_URL (example: your CodeArtifact/simple endpoint)
  - PIP_EXTRA_INDEX_URL (optional fallback)
  - PIP_TRUSTED_HOST (host without protocol)
  Then run docker compose build backend --no-cache.
- Renewal cron example:
  `
  0 3 * * * /usr/bin/certbot renew --quiet --deploy-hook "cd /home/ubuntu/luna && docker compose restart nginx"
  `

## Credits
- Skyfield, Open-Meteo, CelesTrak
- Powered by WFd DeepTech Labs
