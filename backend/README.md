# LUNA Backend – Developer Handoff (v1.0.0)

FastAPI service for Moon/planet/satellite visibility windows, rise/set countdowns, and ground tracks.
Stack: Python 3.12, FastAPI, Skyfield.

## Run locally
`ash
cd backend
python -m venv .venv && .venv/Scripts/activate  # or source .venv/bin/activate
pip install -r requirements.txt                 # first call downloads ephemeris if missing
uvicorn app.main:app --reload                   # http://127.0.0.1:8000/docs
`

## Run with Docker
`ash
cd backend
docker compose up --build        # uses backend/docker-compose.yml
`
Persistent ephemeris/TLE cache is mounted at volume luna-data → /app/app/data.

## API surface
- /health – liveness.
- /moon/position – current az/alt/direction.
- /moon/visibility – position + visibility state + illumination hints.
- /moon/next-rise / /moon/next-set.
- /moon/window – **preferred** unified moon response (see fields below).

- /planet/position – current position for a planet.
- /planet/window – rise/set window for a planet.

- /satellite/position – current position from TLE.
- /satellite/window – next visible pass window.
- /satellite/track – ground track polyline for next N hours (capped to 6h).

All endpoints emit both UTC (*_utc, always suffixed Z) and server-local time (*_local).

### Window/visibility fields (moon/planet/satellite)
- isible_now (bool)
- 
ext_*rise_utc/local, 
ext_*set_utc/local
- minutes_until_rise, minutes_until_set, minutes_until_best
- Human strings: 
ises_in, sets_in
- isible_duration_minutes, est_observation_time_utc/local
- isibility_state ∈ {isible, 
ising_soon, setting_soon, elow_horizon}
- is_night – sun altitude < -6° at best time
- status_message – short, user-ready line
- phase_hint – simple moon/planet phase label
- position – { azimuth, altitude, direction (16-point), direction_label, elevation_state }

## Data dependencies (app/data)
- **Moon**: Skyfield loads de421.bsp (~10 MB). Auto-download via Loader; retry logic added for Windows rename locks.
- **Planets**: de440s.bsp (~115 MB). Auto-download from JPL on first use; place manually if offline (pp/data/de440s.bsp).
- **Satellites**: satellites.tle (Two-Line Elements). Lookups by satellite name or NORAD ID present in this file. Update by appending new TLEs.

## Key behaviors
- Time normalization: UTC strings always end with Z; local strings use server timezone.
- Night check: civil-twilight threshold (-6°).
- Direction: 16-point compass via pp/utils/direction.py.
- Ephemeris/TLE cache is in pp/data; keep it on a volume in Docker to avoid re-download.

## Code map
- pp/main.py – FastAPI app + routers.
- pp/api/ – route definitions (moon, planet, satellite, health).
- pp/services/ – astro logic (moon_service, planet_service, satellite_service, astro_utils).
- pp/utils/ – time, direction helpers.
- pp/data/ – ephemeris and TLE files (created at runtime if missing).

## Common tasks
- **Add a satellite**: append its TLE to pp/data/satellites.tle; call endpoints with its name or NORAD ID.
- **Reset caches**: delete files under pp/data (or the Docker volume); first request will re-download ephemerides.
- **Changing worker count**: set env UVICORN_WORKERS in docker-compose or your process manager.

## Known considerations
- Windows can lock ephemeris during rename; loaders already retry. If it persists, delete pp/data/de421.bsp* and retry.
- The root docker-compose.yml at repo top still references a web service that was removed; use ackend/docker-compose.yml or delete the web service entry before running from repo root.
