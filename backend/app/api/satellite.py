from fastapi import APIRouter, Query

from app.services.satellite_service import (
    get_satellite_position,
    get_satellite_window,
    get_satellite_track,
)

router = APIRouter()


@router.get("/position")
def satellite_position(
    identifier: str = Query(..., description="Satellite name or NORAD ID present in satellites.tle"),
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
):
    return get_satellite_position(identifier, lat, lon)


@router.get("/window")
def satellite_window(
    identifier: str = Query(..., description="Satellite name or NORAD ID present in satellites.tle"),
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    hours: int = Query(24, ge=1, le=72, description="Search window in hours"),
):
    return get_satellite_window(identifier, lat, lon, search_hours=hours)


@router.get("/track")
def satellite_track(
    identifier: str = Query(..., description="Satellite name or NORAD ID present in satellites.tle"),
    hours: int = Query(1, ge=1, le=6, description="Track duration in hours"),
    step_sec: int = Query(30, ge=5, le=300, description="Sampling step in seconds"),
):
    return get_satellite_track(identifier, hours=hours, step_sec=step_sec)
