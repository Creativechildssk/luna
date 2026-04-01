# LUNA Backend (v1.0.0)

FastAPI service providing Moon visibility, rise/set, and observation windows.

## Quick start
```bash
pip install -r requirements.txt   # first run downloads ~10MB ephemeris
uvicorn app.main:app --reload
# API docs at http://127.0.0.1:8000/docs
```

## Endpoints
- `GET /moon/position` – current moon position.
- `GET /moon/visibility` – position + visibility state + illumination.
- `GET /moon/next-rise` – next moonrise info.
- `GET /moon/next-set` – next moonset info.
- `GET /moon/window` – unified view (recommended).
- `GET /planet/position` – current position for a planet.
- `GET /planet/window` – rise/set window for a planet.
- `GET /satellite/position` – current position for a satellite.
- `GET /satellite/window` – rise/set window for a satellite.
- `GET /satellite/track` – ground track polyline for next N hours.

All endpoints return both `*_utc` (with `Z`) and `*_local` timestamps (server local).
No timezone parameter is required.

## `/moon/window` response fields (key)
- `visible_now` (bool)
- `next_moonrise_utc`, `next_moonrise_local`
- `next_moonset_utc`, `next_moonset_local`
- `minutes_until_rise`, `rises_in`
- `minutes_until_set`, `sets_in`
- `visible_duration_minutes`
- `best_observation_time_utc`, `best_observation_time_local`, `minutes_until_best`
- `visibility_state` ∈ {`visible`, `rising_soon`, `setting_soon`, `below_horizon`}
- `is_night` (sun altitude < -6° at best observation time)
- `phase_hint` (e.g., “waxing gibbous”)
- `status_message` (short human text)
- `position`: `{ azimuth, direction, altitude, elevation_state }`

`/moon/visibility` also includes the `position` block for quick sky-pointing UI.

## Planets
- Supported `body`: `mercury`, `venus`, `mars`, `jupiter`, `saturn`.
- Uses JPL ephemeris `de440s.bsp`. Place this file in `backend/app/data/de440s.bsp` (manual download: https://ssd.jpl.nasa.gov/ftp/eph/planets/bsp/de440s.bsp). Import will error if missing.

Planet responses mirror the moon window fields (`visible_now`, rise/set, duration, best time, visibility_state, is_night, phase_hint, position).

## Satellites
- Requires a TLE file at `backend/app/data/satellites.tle` (two-line entries). Satellites are looked up by name or NORAD ID present in that file.
- Endpoints: `/satellite/position`, `/satellite/window`.
- Fields mirror the window response: rise/set, visibility_state, is_night, countdowns, position with direction/direction_label.
- `/satellite/track` returns a polyline of `{timestamp_utc, lat, lon, alt_km}` sampled every `step_sec` across `hours` (capped to 6h).

## Notes
- Ephemeris is cached under `app/data` and retried to avoid Windows file locks.
- Local time uses server timezone; UTC is always normalized with trailing `Z`.
- Civil twilight threshold (-6°) is used for `is_night`.
