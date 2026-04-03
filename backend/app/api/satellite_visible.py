from fastapi import APIRouter, Query
from app.services.satellite_service import load_tle, _window_for_sat

router = APIRouter()


@router.get("/visible")
def list_visible(lat: float, lon: float, hours: int = 12, limit: int = 20):
    sats = load_tle()
    results = []
    for ident, sat in sats.items():
        # skip numeric duplicates when name already present
        if ident.isdigit():
            continue
        try:
            win = _window_for_sat(sat, ident, lat, lon, search_hours=hours)
        except Exception:
            continue
        results.append(win)
    # Sort: visible first, then soonest rise
    results.sort(
        key=lambda r: (
            0 if r.get("visible_now") else 1,
            r.get("minutes_until_rise") if r.get("minutes_until_rise") is not None else 1e9,
        )
    )
    return results[:limit]
