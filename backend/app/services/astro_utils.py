from datetime import datetime, timezone
from typing import Optional, Callable

from skyfield import almanac

from app.utils.time_local import to_local_time


# -------- time helpers --------

def now_timestamp_pair() -> tuple[str, str]:
    """Return (utc_iso_Z, local_iso) using system local timezone."""
    now_utc = datetime.utcnow().replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")
    local_iso = to_local_time(now_utc)
    return now_utc, local_iso


def to_utc_z(iso_str: Optional[str]) -> Optional[str]:
    if not iso_str:
        return None
    if iso_str.endswith("Z"):
        return iso_str
    return iso_str.replace("+00:00", "Z")


def strip_microseconds(iso_str: Optional[str]) -> Optional[str]:
    if not iso_str:
        return None
    if "." in iso_str:
        base, rest = iso_str.split(".", 1)
        if "Z" in rest:
            return base + "Z"
        for sep in ["+", "-"]:
            if sep in rest:
                tz = sep + rest.split(sep, 1)[1]
                return base + tz
        return base
    return iso_str


def minutes_until(target_iso: Optional[str]) -> Optional[int]:
    if not target_iso:
        return None
    target = datetime.fromisoformat(target_iso.replace("Z", "+00:00"))
    now = datetime.utcnow().replace(tzinfo=timezone.utc)
    return int(round((target - now).total_seconds() / 60))


def format_minutes(minutes: Optional[int]) -> Optional[str]:
    if minutes is None:
        return None
    sign = "-" if minutes < 0 else ""
    mins = abs(minutes)
    hours, rem = divmod(mins, 60)
    return f"{sign}{hours}h {rem}m" if hours else f"{sign}{rem}m"


def duration_and_midpoint(start_iso: Optional[str], end_iso: Optional[str]) -> tuple[Optional[int], Optional[str]]:
    if not start_iso or not end_iso:
        return None, None
    start = datetime.fromisoformat(start_iso.replace("Z", "+00:00"))
    end = datetime.fromisoformat(end_iso.replace("Z", "+00:00"))
    if end <= start:
        return None, None
    duration_minutes = int(round((end - start).total_seconds() / 60))
    midpoint = start + (end - start) / 2
    return duration_minutes, midpoint.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")


# -------- astro helpers --------

def is_night(ts, earth, sun, site_func: Callable, lat: float, lon: float, time_iso: Optional[str] = None) -> bool:
    """Night heuristic: sun altitude below -6 degrees (civil twilight)."""
    if time_iso:
        dt = datetime.fromisoformat(time_iso.replace("Z", "+00:00"))
        t = ts.from_datetime(dt)
    else:
        t = ts.now()
    site = site_func(lat, lon)
    alt, _, _ = (earth + site).at(t).observe(sun).apparent().altaz()
    return float(alt.degrees) < -6


def phase_hint(ts, ephem, body_key: str) -> str:
    """Basic phase description from phase angle."""
    angle = almanac.phase_angle(ephem, body_key, ts.now()).degrees
    if angle < 45:
        return "waxing crescent"
    if angle < 90:
        return "waxing crescent"
    if angle == 90:
        return "first quarter"
    if angle < 135:
        return "waxing gibbous"
    if angle < 180:
        return "waxing gibbous"
    if angle == 180:
        return "full"
    if angle < 225:
        return "waning gibbous"
    if angle < 270:
        return "waning gibbous"
    if angle == 270:
        return "last quarter"
    return "waning crescent"
