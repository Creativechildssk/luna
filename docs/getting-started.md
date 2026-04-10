# Getting Started

If you want to run LUNA quickly, this is the shortest path.

## Prerequisites
- Python 3.12
- Node.js 18+
- npm 9+
- Docker and Docker Compose for containerized development

## Local development

### 1. Start the backend
```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Notes:
- `DATABASE_URL` is optional.
- First run may download astronomical data into `backend/app/data/`.

### 2. Start the web app
```bash
cd web
npm install
npm run dev -- --host --port 3000
```

For local development, set:
```bash
VITE_API_BASE=http://localhost:8000
```

## Docker development
From the repository root:

```bash
docker compose up -d --build
```

The default stack includes:
- `db`: PostgreSQL 16
- `backend`: FastAPI application
- `web`: React/Vite frontend
- `nginx`: reverse proxy and TLS entry point

## AWS build note
If Python package installation is slow or unreliable in cloud builds, define one or more of these before building the backend image:
- `PIP_INDEX_URL`
- `PIP_EXTRA_INDEX_URL`
- `PIP_TRUSTED_HOST`

Then run:
```bash
docker compose build backend --no-cache
```

## Recommended day-to-day flow
1. Start backend.
2. Start web app.
3. Open the backend docs at `http://127.0.0.1:8000/docs`.
4. Open the frontend in the browser and verify target views.
5. Run `npm run build` before merging frontend changes.

## Common issues

### Geolocation does not work
- Browsers often block geolocation on plain HTTP.
- Use HTTPS or enter latitude and longitude manually.

### AR mode feels inaccurate
- Mobile compass and orientation APIs depend on calibration.
- Test on a real phone outdoors when possible, with location permissions enabled.

### Initial backend requests are slow
- Skyfield ephemeris and TLE files may still be downloading.

## Next reading
- [docs/architecture.md](docs/architecture.md)
- [docs/api.md](docs/api.md)
- [CONTRIBUTING.md](../CONTRIBUTING.md)
