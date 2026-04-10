# LUNA

Full-stack moon/planet/satellite visibility API with web UI.

## Version
# LUNA

LUNA is a full-stack sky visibility platform for moon, planet, satellite, and mission tracking. It combines a FastAPI backend for astronomical calculations with a React web client designed for interactive observation workflows, including AR-assisted pointing and live satellite identification.

Current version: v2.0.0

## What LUNA provides
- Moon visibility windows, rise and set timing, best-view calculation, illumination, and phase context.
- Planet visibility and directional tracking for supported bodies.
- Satellite pass prediction, track plotting, visible-satellite discovery, and alert registration.
- Mission management for tracked spaceflight programs with linked tracking identifiers.
- Browser-based AR guidance using device camera and orientation.
- Responsive PWA web interface optimized for mobile and desktop use.

## v2 highlights
- Refined dashboard layout with clearer visual hierarchy and stronger data emphasis.
- Improved moon phase presentation and viewing score card.
- Live Identify quick tool for matching camera direction to visible satellites.
- Better installability with PWA prompts and offline shell support.
- Formal semantic versioning workflow with automated version bump tooling.

## Architecture summary
- Backend: FastAPI, Skyfield, SQLAlchemy, PostgreSQL or SQLite fallback.
- Frontend: React, Vite, Tailwind CSS, TanStack Query, Framer Motion, Leaflet.
- Infra: Docker Compose with Nginx reverse proxy.
- Data sources: Skyfield ephemerides, CelesTrak TLE data, Open-Meteo weather.

Detailed architecture: [docs/architecture.md](docs/architecture.md)

## Repository layout
- backend/: FastAPI service, astronomical services, models, and API routers.
- web/: React web application and PWA shell.
- docs/: product, architecture, API, and release documentation.
- wiki/: GitHub-ready wiki pages stored in-repo.
- tools/: maintenance scripts, including semantic version bumping.
- data/: sample and mission data.

## Quick start

### Local backend
```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Local web app
```bash
cd web
npm install
npm run dev -- --host --port 3000
```

Set `VITE_API_BASE=http://localhost:8000` for direct local development, or `/api` when fronted by Nginx.

### Docker Compose
```bash
docker compose up -d --build
```

Services:
- backend: internal port 8000
- web: internal port 3000
- nginx: external ports 80 and 443
- db: PostgreSQL 16

More setup guidance: [docs/getting-started.md](docs/getting-started.md)

## API surface
Primary route groups:
- `/health`
- `/moon`
- `/planet`
- `/satellite`
- `/mission`
- `/alerts`

Interactive OpenAPI docs are available from the running backend at `/docs`.

Full API guide: [docs/api.md](docs/api.md)

## Deployment notes
- The default stack is designed for Docker Compose deployment.
- TLS can be terminated by Nginx with mounted Let's Encrypt certificates.
- AWS builds can use custom Python package mirrors through `PIP_INDEX_URL`, `PIP_EXTRA_INDEX_URL`, and `PIP_TRUSTED_HOST`.

Recommended deployment reference: [docs/release-process.md](docs/release-process.md)

## Documentation index
- [docs/getting-started.md](docs/getting-started.md)
- [docs/architecture.md](docs/architecture.md)
- [docs/api.md](docs/api.md)
- [docs/versioning.md](docs/versioning.md)
- [docs/release-process.md](docs/release-process.md)
- [CONTRIBUTING.md](CONTRIBUTING.md)

## Semantic versioning policy
LUNA uses semantic versioning:
- `major` (`X.0.0`): breaking API or compatibility changes.
- `minor` (`X.Y.0`): backward-compatible feature additions.
- `fix` (`X.Y.Z`): backward-compatible bug fixes.

FastAPI-aligned interpretation:
- If an endpoint contract changes incompatibly, bump major.
- If an endpoint or field is added without breaking existing clients, bump minor.
- If behavior is corrected without changing the contract, bump fix.

## Automated version bumping
Use the repository script to update all tracked version locations together:

```bash
python tools/version_bump.py --part major
python tools/version_bump.py --part minor
python tools/version_bump.py --part fix
```

Set an explicit version:

```bash
python tools/version_bump.py --set 2.1.3
```

Preview a bump without writing files:

```bash
python tools/version_bump.py --part minor --dry-run
```

Script reference: [tools/version_bump.py](tools/version_bump.py)

## Release workflow
1. Run backend and frontend verification.
2. Bump the version with `tools/version_bump.py`.
3. Commit using a release message such as `release: v2.1.0`.
4. Create and push a Git tag: `git tag v2.1.0` and `git push origin v2.1.0`.
5. Publish release notes and update the GitHub Wiki if needed.

Detailed process: [docs/release-process.md](docs/release-process.md)

## GitHub Wiki content
The repository includes a `wiki/` directory with pages prepared for GitHub Wiki publication:
- [wiki/Home.md](wiki/Home.md)
- [wiki/Getting-Started.md](wiki/Getting-Started.md)
- [wiki/Architecture.md](wiki/Architecture.md)
- [wiki/API-Overview.md](wiki/API-Overview.md)
- [wiki/Releases-and-Versioning.md](wiki/Releases-and-Versioning.md)

## Credits
- Skyfield
- Open-Meteo
- CelesTrak
- WFd DeepTech Labs
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
