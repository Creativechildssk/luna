from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

from skyfield import almanac
from skyfield.api import Loader, Topos

from app.utils.direction import get_direction, get_direction_verbose
from app.utils.time_local import to_local_time

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)

EPHEM_NAME = "de440s.bsp"
EPHEM_URL = "https://ssd.jpl.nasa.gov/ftp/eph/planets/bsp/de440s.bsp"

loader = Loader(str(DATA_DIR))
ts = loader.timescale()
_ephem_cache = None


def _ephem():
    global _ephem_cache
    if _ephem_cache is not None:
        return _ephem_cache
    path = DATA_DIR / EPHEM_NAME
    if not path.exists():
        # attempt download once
        try:
            loader.download(EPHEM_URL, path)
        except Exception as e:
            raise FileNotFoundError(
                f"Ephemeris {EPHEM_NAME} missing and download failed: {e}. "
                f"Please place it manually in {DATA_DIR}."
            )
    _ephem_cache = loader(str(path))
    return _ephem_cache


def _earth():
    return _ephem()["earth"]


def _sun():
    return _ephem()["sun"]

PLANET_KEYS = {
    "mercury": "mercury",
    "venus": "venus",
    "mars": "mars barycenter",
    "jupiter": "jupiter barycenter",
    "saturn": "saturn barycenter",
}


def _topos(lat: float, lon: float):
    return Topos(latitude_degrees=lat, longitude_degrees=lon)


def _now_timestamp_pair() -> tuple[str, str]:
    now_utc = datetime.utcnow().replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")
    local_iso = to_local_time(now_utc)
    return now_utc, local_iso


def _to_utc_z(iso_str: Optional[str]) -> Optional[str]:
    if not iso_str:
        return None
    if iso_str.endswith("Z"):
        return iso_str
    return iso_str.replace("+00:00", "Z")


def _strip_microseconds(iso_str: Optional[str]) -> Optional[str]:
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


def _minutes_until(target_iso: Optional[str]) -> Optional[int]:
    if not target_iso:
        return None
    target = datetime.fromisoformat(target_iso.replace("Z", "+00:00"))
    now = datetime.utcnow().replace(tzinfo=timezone.utc)
    return int(round((target - now).total_seconds() / 60))


def _format_minutes(minutes: Optional[int]) -> Optional[str]:
    if minutes is None:
        return None
    sign = "-" if minutes < 0 else ""
    mins = abs(minutes)
    hours, rem = divmod(mins, 60)
    return f"{sign}{hours}h {rem}m" if hours else f"{sign}{rem}m"


def _duration_and_midpoint(start_iso: Optional[str], end_iso: Optional[str]) -> tuple[Optional[int], Optional[str]]:
    if not start_iso or not end_iso:
        return None, None
    start = datetime.fromisoformat(start_iso.replace("Z", "+00:00"))
    end = datetime.fromisoformat(end_iso.replace("Z", "+00:00"))
    if end <= start:
        return None, None
    duration_minutes = int(round((end - start).total_seconds() / 60))
    midpoint = start + (end - start) / 2
    return duration_minutes, midpoint.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")


def _is_night(lat: float, lon: float, time_iso: Optional[str] = None) -> bool:
    if time_iso:
        dt = datetime.fromisoformat(time_iso.replace("Z", "+00:00"))
        t = ts.from_datetime(dt)
    else:
        t = ts.now()
    site = _topos(lat, lon)
    alt, _, _ = (_earth() + site).at(t).observe(_sun()).apparent().altaz()
    return float(alt.degrees) < -6


def _phase_hint(body_key: str) -> str:
    # Simple phase descriptor based on phase angle
    angle = almanac.phase_angle(_ephem(), body_key, ts.now()).degrees
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


def _get_body(body: str):
    key = PLANET_KEYS.get(body.lower())
    if not key:
        raise ValueError(f"Unsupported planet '{body}'. Supported: {', '.join(PLANET_KEYS.keys())}")
    return _ephem()[key], key


def get_planet_position(body: str, lat: float, lon: float):
    planet, key = _get_body(body)
    t = ts.now()
    site = _topos(lat, lon)
    location = _earth() + site

    astrometric = location.at(t).observe(planet)
    alt, az, distance = astrometric.apparent().altaz()

    altitude = float(alt.degrees)
    azimuth = float(az.degrees)
    distance_km = float(distance.km)

    utc_iso, local_iso = _now_timestamp_pair()
    illumination = float(almanac.fraction_illuminated(_ephem(), key, t)) * 100.0

    return {
        "timestamp_utc": utc_iso,
        "timestamp_local": local_iso,
        "altitude": round(altitude, 2),
        "azimuth": round(azimuth, 2),
        "direction": get_direction(azimuth),
        "direction_label": get_direction_verbose(azimuth),
        "distance_km": round(distance_km, 2),
        "illumination_percent": round(illumination, 1),
    }


def get_planet_window(body: str, lat: float, lon: float, search_days: int = 7):
    planet, key = _get_body(body)

    t0 = ts.now()
    t1 = t0 + search_days
    site = _topos(lat, lon)
    rise_set_func = almanac.risings_and_settings(_ephem(), planet, site)
    times, events = almanac.find_discrete(t0, t1, rise_set_func)

    rise_iso = None
    set_iso = None
    for ti, ev in zip(times, events):
        if ev == 1 and ti.tt > t0.tt and rise_iso is None:
            rise_iso = ti.utc_iso()
        if ev == 0 and ti.tt > t0.tt and set_iso is None:
            set_iso = ti.utc_iso()
        if rise_iso and set_iso:
            break

    rise_iso = _to_utc_z(rise_iso)
    set_iso = _to_utc_z(set_iso)

    rise_local = _strip_microseconds(to_local_time(rise_iso)) if rise_iso else None
    set_local = _strip_microseconds(to_local_time(set_iso)) if set_iso else None

    minutes_until_rise = _minutes_until(rise_iso)
    minutes_until_set = _minutes_until(set_iso)
    rises_in = _format_minutes(minutes_until_rise)
    sets_in = _format_minutes(minutes_until_set)

    duration_minutes, best_mid_utc = _duration_and_midpoint(rise_iso, set_iso)
    best_mid_local = _strip_microseconds(to_local_time(best_mid_utc)) if best_mid_utc else None
    minutes_until_best = _minutes_until(best_mid_utc) if best_mid_utc else None

    pos = get_planet_position(body, lat, lon)

    if pos["altitude"] > 0:
        visibility_state = "visible"
    elif minutes_until_rise is not None and minutes_until_rise <= 120:
        visibility_state = "rising_soon"
    elif minutes_until_set is not None and minutes_until_set <= 120:
        visibility_state = "setting_soon"
    else:
        visibility_state = "below_horizon"

    is_night = _is_night(lat, lon, best_mid_utc or rise_iso)

    status_parts = []
    if pos["altitude"] > 0:
        status_parts.append(f"{body.title()} up now")
    if rises_in:
        status_parts.append(f"Rises {rises_in}")
    if sets_in:
        status_parts.append(f"Sets {sets_in}")
    if best_mid_local:
        status_parts.append(f"Best ~{best_mid_local}")
    status_message = "; ".join(status_parts)

    return {
        "body": body.lower(),
        "visible_now": pos["altitude"] > 0,
        "next_rise_utc": rise_iso,
        "next_rise_local": rise_local,
        "next_set_utc": set_iso,
        "next_set_local": set_local,
        "minutes_until_rise": None if pos["altitude"] > 0 else minutes_until_rise,
        "rises_in": None if pos["altitude"] > 0 else rises_in,
        "minutes_until_set": minutes_until_set,
        "sets_in": sets_in,
        "visible_duration_minutes": duration_minutes,
        "best_observation_time_utc": best_mid_utc,
        "best_observation_time_local": best_mid_local,
        "minutes_until_best": minutes_until_best,
        "visibility_state": visibility_state,
        "is_night": is_night,
        "phase_hint": _phase_hint(key),
        "status_message": status_message,
        "position": {
            "azimuth": pos["azimuth"],
            "direction": pos["direction"],
            "direction_label": pos["direction_label"],
            "altitude": pos["altitude"],
            "elevation_state": "above_horizon" if pos["altitude"] > 0 else "below_horizon",
            "distance_km": pos.get("distance_km"),
        },
    }
