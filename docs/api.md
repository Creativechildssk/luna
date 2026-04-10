# API Reference

This page gives a quick, practical map of the API surface.

Basic behavior:
- Interactive schema: `/docs`
- Health endpoint: `/health/`
- Primary response style: JSON
- Coordinate inputs: decimal latitude and longitude

## Health

### `GET /health/`
Quick liveness check.

Example response:
```json
{ "status": "ok" }
```

## Moon

### `GET /moon/position`
Query:
- `lat`: float
- `lon`: float

### `GET /moon/visibility`
Query:
- `lat`: float
- `lon`: float

### `GET /moon/next-rise`
Query:
- `lat`: float
- `lon`: float
- `days`: integer, 1 to 14, default 7

### `GET /moon/next-set`
Query:
- `lat`: float
- `lon`: float
- `days`: integer, 1 to 14, default 7

### `GET /moon/window`
Recommended moon endpoint for the dashboard.

Query:
- `lat`: float
- `lon`: float
- `days`: integer, 1 to 14, default 7

Common response fields include:
- `visible_now`
- `visibility_state`
- `rises_in`
- `sets_in`
- `minutes_until_best`
- `best_observation_time_local`
- `illumination_percent`
- `phase_hint`
- `position`

## Planet

### `GET /planet/position`
Query:
- `body`: one of `mercury`, `venus`, `mars`, `jupiter`, `saturn`
- `lat`: float
- `lon`: float

### `GET /planet/window`
Query:
- `body`: supported planet name
- `lat`: float
- `lon`: float
- `days`: integer, 1 to 30, default 7

## Satellite

### `GET /satellite/position`
Query:
- `identifier`: satellite name or NORAD ID present in the TLE file
- `lat`: float
- `lon`: float

### `GET /satellite/window`
Query:
- `identifier`: satellite name or NORAD ID
- `lat`: float
- `lon`: float
- `hours`: integer, 1 to 72, default 24

### `GET /satellite/track`
Query:
- `identifier`: satellite name or NORAD ID
- `hours`: integer, 1 to 6, default 1
- `step_sec`: integer, 5 to 300, default 30

### `GET /satellite/visible`
Lists visible or upcoming satellites for a location.

Query:
- `lat`: float
- `lon`: float
- `hours`: integer, default 12
- `limit`: integer, default 20

## Mission

### `GET /mission`
Query:
- `include_inactive`: boolean, default `false`

### `POST /mission`
Creates a mission.

Payload fields:
- `name`
- `slug`
- `description`
- `status`
- `mission_type`
- `launch_datetime`
- `vehicle_name`
- `tracking_identifier`
- `tracking_type`
- `active`

### `GET /mission/{mission_id}`
Fetches a mission by id.

### `PUT /mission/{mission_id}`
Updates a mission.

### `DELETE /mission/{mission_id}`
Removes or deactivates a mission according to service logic.

### `GET /mission/{mission_id}/track`
Query:
- `hours`: integer, 1 to 6, default 1
- `step_sec`: integer, 5 to 300, default 60

## Alerts

### `GET /alerts/`
Lists active alerts.

### `POST /alerts/`
Creates an alert.

Payload:
- `identifier`
- `lat`
- `lon`
- `threshold_minutes`: integer, 1 to 120
- `callback_url`: valid URL
- `secret`: optional string

### `DELETE /alerts/{alert_id}`
Deactivates an alert.

## Notes for API consumers
- Use `/moon/window`, `/planet/window`, and `/satellite/window` for dashboard views.
- Use `/satellite/track` and `/mission/{id}/track` for path plotting.
- Use `/docs` on a running backend for exact schema details.
