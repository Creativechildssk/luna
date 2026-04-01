from fastapi import APIRouter, Query

from app.services.moon_service import (
    get_moon_position,
    get_moon_visibility,
    get_next_moonrise,
    get_next_moonset,
    get_moon_window,
)

router = APIRouter()


@router.get("/position")
def moon_position(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
):
    result = get_moon_position(lat, lon)
    return result


@router.get("/visibility")
def moon_visibility(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
):
    return get_moon_visibility(lat, lon)


@router.get("/next-rise")
def moon_next_rise(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    days: int = Query(7, ge=1, le=14, description="Search window in days"),
):
    return get_next_moonrise(lat, lon, search_days=days)


@router.get("/next-set")
def moon_next_set(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    days: int = Query(7, ge=1, le=14, description="Search window in days"),
):
    return get_next_moonset(lat, lon, search_days=days)


@router.get("/window")
def moon_window(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    days: int = Query(7, ge=1, le=14, description="Search window in days"),
):
    return get_moon_window(lat, lon, search_days=days)
