from fastapi import APIRouter, Query

from app.services.planet_service import (
    get_planet_position,
    get_planet_window,
)

router = APIRouter()


@router.get("/position")
def planet_position(
    body: str = Query(..., description="Planet name (mercury, venus, mars, jupiter, saturn)"),
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
):
    return get_planet_position(body, lat, lon)


@router.get("/window")
def planet_window(
    body: str = Query(..., description="Planet name (mercury, venus, mars, jupiter, saturn)"),
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    days: int = Query(7, ge=1, le=30, description="Search window in days"),
):
    return get_planet_window(body, lat, lon, search_days=days)
