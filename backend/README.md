# LUNA Backend – Developer Handoff (v1.0.0)

FastAPI service for Moon / planet / satellite visibility windows, rise/set countdowns, ground tracks, and illumination.
Stack: Python 3.12, FastAPI, Skyfield.

## Run locally
```bash
cd backend
python -m venv .venv && .venv/Scripts/activate  # or source .venv/bin/activate
pip install -r requirements.txt                 # first run downloads ephemeris if missing
uvicorn app.main:app --reload                   # http://127.0.0.1:8000/docs
```

_Docker files were removed; run locally or add your own containerization later._

## API surface
- `/health` – liveness
- Moon: `/moon/position`, `/moon/visibility`, `/moon/next-rise`, `/moon/next-set`, `/moon/window` (recommended)
- Planet: `/planet/position`, `/planet/window`
- Satellite: `/satellite/position`, `/satellite/window`, `/satellite/track`

All endpoints return UTC (`*_utc`, suffixed `Z`) and server-local (`*_local`) timestamps.

### Window / visibility fields (moon & planets; satellites mirror)
- `visible_now` (bool)
- `next_*rise_utc/local`, `next_*set_utc/local`
- `minutes_until_rise`, `minutes_until_set`, `minutes_until_best`
- Human strings: `rises_in`, `sets_in`
- Durations: `visible_duration_minutes`, `next_visible_duration_minutes`
- Peak: `max_altitude_deg`, `time_of_max_altitude_utc/local` (best observation time = peak altitude)
- Illumination: `illumination_percent`, `phase_hint`
- Night check: `is_night` (sun altitude < -6°)
- Distance: `position.distance_km`
- State: `visibility_state` ∈ {`visible`, `rising_soon`, `setting_soon`, `below_horizon`}
- Status text: `status_message`
- Position: `{ azimuth, altitude, direction, direction_label, elevation_state, distance_km }`
- Extras: `minutes_since_rise` (when visible), `days_until_next_rise`

Edge cases: if no rise/set in the search window, the corresponding fields are `null` and duration is `0`.

## Data dependencies (`app/data`)
- Moon: `de421.bsp` (~10 MB) auto-download with retry for Windows rename locks.
- Planets: `de440s.bsp` (~115 MB) auto-download; place manually if offline.
- Satellites: `satellites.tle` (Two-Line Elements); lookups by name or NORAD ID present in the file.

## Key behaviors
- UTC strings always end with `Z`; local strings use server timezone.
- Direction: 16-point compass via `app/utils/direction.py`.
- Caches live in `app/data`; delete to force re-download.

## Code map
- `app/main.py` – FastAPI app + routers
- `app/api/` – route definitions (moon, planet, satellite, health)
- `app/services/` – astro logic (moon_service, planet_service, satellite_service, astro_utils)
- `app/utils/` – time/direction helpers
- `app/data/` – ephemeris and TLE files (created/downloaded at runtime)

## Common tasks
- Add a satellite: append TLE to `app/data/satellites.tle`; call with its name or NORAD ID.
- Reset caches: remove files under `app/data`; first request re-downloads ephemerides/TLEs.
- Change workers: run uvicorn via your own process manager with `--workers N` (no bundled compose now).

## Known considerations
- Windows file-locks during ephemeris rename can occur; delete `app/data/de421.bsp*` and retry if stuck.
- When no rise occurs in the search window (e.g., polar regions), rise/set fields are `null` and `visibility_state` stays `below_horizon`.
