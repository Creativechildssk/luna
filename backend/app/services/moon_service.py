from datetime import datetime, timedelta, timezone
from typing import Optional
from pathlib import Path
from time import sleep

from skyfield import almanac
from skyfield.api import Loader, Topos

from app.utils.direction import get_direction, get_direction_verbose
from app.utils.time_local import to_local_time

# Use a dedicated data directory to avoid clashes with other processes
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)

loader = Loader(str(DATA_DIR))
ts = loader.timescale()

# Retry to dodge transient Windows file-lock errors during download rename
planets = None
for attempt in range(3):
    try:
        planets = loader("de421.bsp", reload=False)
        break
    except (PermissionError, OSError):
        if attempt == 2:
            raise
        sleep(1)

earth = planets["earth"]
moon = planets["moon"]
sun = planets["sun"]


def _topos(lat: float, lon: float):
    return Topos(latitude_degrees=lat, longitude_degrees=lon)


def _now_timestamp_pair() -> tuple[str, str]:
    """Return (utc_iso, local_iso) using system local timezone."""
    now_utc = datetime.utcnow().replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")
    local_iso = to_local_time(now_utc)
    return now_utc, local_iso


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
        # keep timezone part
        if "Z" in rest:
            return base + "Z"
        if "+" in rest or "-" in rest:
            # split at last + or -
            for sep in ["+", "-"]:
                if sep in rest:
                    tz = sep + rest.split(sep, 1)[1]
                    return base + tz
        return base
    return iso_str


def _duration_and_midpoint(start_iso: Optional[str], end_iso: Optional[str]) -> tuple[Optional[int], Optional[str]]:
    if not start_iso or not end_iso:
        return None, None
    start = datetime.fromisoformat(start_iso.replace("Z", "+00:00"))
    end = datetime.fromisoformat(end_iso.replace("Z", "+00:00"))
    if end <= start:
        return None, None
    duration_minutes = int(round((end - start).total_seconds() / 60))
    midpoint = start + (end - start) / 2
    return duration_minutes, midpoint.replace(tzinfo=timezone.utc).isoformat()


def _is_night(lat: float, lon: float, time_iso: Optional[str] = None) -> bool:
    """Night heuristic: sun altitude below -6 degrees (civil twilight)."""
    if time_iso:
        dt = datetime.fromisoformat(time_iso.replace("Z", "+00:00"))
        t = ts.from_datetime(dt)
    else:
        t = ts.now()
    site = _topos(lat, lon)
    alt, _, _ = (earth + site).at(t).observe(sun).apparent().altaz()
    return float(alt.degrees) < -6


def _phase_hint() -> str:
    """Basic phase description from current phase angle."""
    angle = almanac.phase_angle(planets, "moon", ts.now()).degrees
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
        return "full moon"
    if angle < 225:
        return "waning gibbous"
    if angle < 270:
        return "waning gibbous"
    if angle == 270:
        return "last quarter"
    return "waning crescent"


def get_moon_position(lat: float, lon: float):
    t = ts.now()

    site = _topos(lat, lon)
    location = earth + site

    astrometric = location.at(t).observe(moon)
    alt, az, distance = astrometric.apparent().altaz()

    altitude = float(alt.degrees)
    azimuth = float(az.degrees)
    distance_km = float(distance.km)

    utc_iso, local_iso = _now_timestamp_pair()
    illumination = float(almanac.fraction_illuminated(planets, "moon", t)) * 100.0

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


def get_next_moonset(
    lat: float, lon: float, search_days: int = 7
):
    """
    Find the next moonset time in UTC within the given search window.
    Returns None if no set is found in that window.
    """
    # also fetch next rise for duration calculation
    next_rise_data = get_next_moonrise(lat, lon, search_days)
    next_rise_iso = next_rise_data.get("next_moonrise_utc")

    t0 = ts.now()
    t1 = t0 + search_days

    site = _topos(lat, lon)
    rise_set_func = almanac.risings_and_settings(planets, moon, site)
    times, events = almanac.find_discrete(t0, t1, rise_set_func)

    next_set_iso = None
    for ti, ev in zip(times, events):
        if ev == 0 and ti.tt > t0.tt:  # ev == 0 => setting
            next_set_iso = ti.utc_iso()
            break

    set_local = to_local_time(next_set_iso) if next_set_iso else None
    minutes_until = _minutes_until(next_set_iso)
    human_until = _format_minutes(minutes_until)

    duration_minutes, best_midpoint_utc = _duration_and_midpoint(next_rise_iso, next_set_iso)
    best_midpoint_utc = _strip_microseconds(_to_utc_z(best_midpoint_utc))
    best_midpoint_local = _strip_microseconds(to_local_time(best_midpoint_utc)) if best_midpoint_utc else None

    utc_now, local_now = _now_timestamp_pair()

    return {
        "timestamp_utc": utc_now,
        "timestamp_local": local_now,
        "visible_now": get_moon_visibility(lat, lon)["visible"],
        "next_moonset_utc": _to_utc_z(next_set_iso),
        "next_moonset_local": set_local,
        "minutes_until_set": minutes_until,
        "sets_in": human_until,
        "visibility_duration_minutes": duration_minutes,
        "best_observation_time_utc": best_midpoint_utc,
        "best_observation_time_local": best_midpoint_local,
        "search_window_days": search_days,
    }


def get_moon_visibility(lat: float, lon: float):
    """Return current visibility (above horizon) plus position details."""
    position = get_moon_position(lat, lon)
    altitude = float(position["altitude"])
    visible = bool(altitude > 0)

    position.update(
        {
            "visible": visible,
            "visibility_note": "Above horizon" if visible else "Below horizon",
            "visibility_state": "visible" if visible else "below_horizon",
            "is_night": _is_night(lat, lon),
            "elevation_state": "above_horizon" if visible else "below_horizon",
            "position": {
                "azimuth": position["azimuth"],
                "direction": position["direction"],
                "direction_label": position.get("direction_label"),
                "altitude": position["altitude"],
                "elevation_state": "above_horizon" if visible else "below_horizon",
            },
        }
    )
    return position


def get_moon_window(lat: float, lon: float, search_days: int = 7):
    """
    Unified window combining rise/set info, duration, and best observation time.
    """
    rise = get_next_moonrise(lat, lon, search_days)
    moon_set = get_next_moonset(lat, lon, search_days)
    vis = get_moon_visibility(lat, lon)

    rise_iso = _to_utc_z(rise.get("next_moonrise_utc"))
    set_iso = _to_utc_z(rise.get("next_moonset_utc") or moon_set.get("next_moonset_utc"))

    duration_minutes, best_mid_utc = _duration_and_midpoint(rise_iso, set_iso)
    best_mid_utc = _strip_microseconds(_to_utc_z(best_mid_utc))
    best_mid_local = _strip_microseconds(to_local_time(best_mid_utc)) if best_mid_utc else None
    minutes_until_best = _minutes_until(best_mid_utc) if best_mid_utc else None
    minutes_until_set = moon_set.get("minutes_until_set")

    # short status
    parts = []
    if rise.get("visible_now"):
        parts.append("Moon up now")
    elif rise.get("rises_in"):
        parts.append(f"Rises {rise.get('rises_in')}")
    if moon_set.get("sets_in"):
        parts.append(f"Sets {moon_set.get('sets_in')}")
    if best_mid_local:
        parts.append(f"Best ~{best_mid_local}")
    status_message = "; ".join(parts)

    # visibility state enum
    minutes_until_rise = rise.get("minutes_until_rise")
    minutes_until_set = moon_set.get("minutes_until_set")
    if rise.get("visible_now"):
        visibility_state = "visible"
    elif minutes_until_rise is not None and minutes_until_rise <= 120:
        visibility_state = "rising_soon"
    elif minutes_until_set is not None and minutes_until_set <= 120:
        visibility_state = "setting_soon"
    else:
        visibility_state = "below_horizon"

    is_night = _is_night(lat, lon, best_mid_utc or rise_iso)

    return {
        "visible_now": rise.get("visible_now"),
        "next_moonrise_local": rise.get("next_moonrise_local"),
        "next_moonrise_utc": rise_iso,
        "next_moonset_local": _strip_microseconds(to_local_time(set_iso)) if set_iso else None,
        "next_moonset_utc": set_iso,
        "visible_duration_minutes": duration_minutes,
        "best_observation_time_local": best_mid_local,
        "best_observation_time_utc": best_mid_utc,
        "minutes_until_best": minutes_until_best,
        "minutes_until_rise": minutes_until_rise if not rise.get("visible_now") else None,
        "rises_in": rise.get("rises_in") if not rise.get("visible_now") else None,
        "minutes_until_set": minutes_until_set,
        "sets_in": moon_set.get("sets_in"),
        "visibility_state": visibility_state,
        "is_night": is_night,
        "phase_hint": _phase_hint(),
        "status_message": status_message,
        "position": {
            "azimuth": vis["azimuth"],
            "direction": vis["direction"],
            "altitude": vis["altitude"],
            "elevation_state": vis["elevation_state"],
        },
    }


def get_next_moonrise(
    lat: float, lon: float, search_days: int = 7
):
    """
    Find the next moonrise time in UTC within the given search window.
    Returns None if no rise is found in that window.
    """
    t0 = ts.now()
    t1 = t0 + search_days

    site = _topos(lat, lon)
    rise_set_func = almanac.risings_and_settings(planets, moon, site)
    times, events = almanac.find_discrete(t0, t1, rise_set_func)

    next_rise_iso = None
    next_set_after_rise_iso = None
    for ti, ev in zip(times, events):
        if ev == 1 and ti.tt > t0.tt:  # ev == 1 => rising
            next_rise_iso = ti.utc_iso()
            # find next set after this rise
            for tj, evj in zip(times, events):
                if evj == 0 and tj.tt > ti.tt:
                    next_set_after_rise_iso = tj.utc_iso()
                    break
            break

    rise_local = _strip_microseconds(to_local_time(next_rise_iso)) if next_rise_iso else None

    minutes_until = _minutes_until(next_rise_iso)
    human_until = _format_minutes(minutes_until)

    duration_minutes, best_midpoint_utc = _duration_and_midpoint(next_rise_iso, next_set_after_rise_iso)
    best_midpoint_utc = _strip_microseconds(_to_utc_z(best_midpoint_utc))
    best_midpoint_local = _strip_microseconds(to_local_time(best_midpoint_utc)) if best_midpoint_utc else None

    utc_now, local_now = _now_timestamp_pair()

    return {
        "timestamp_utc": utc_now,
        "timestamp_local": local_now,
        "visible_now": get_moon_visibility(lat, lon)["visible"],
        "next_moonrise_utc": _to_utc_z(next_rise_iso),
        "next_moonrise_local": rise_local,
        "next_moonset_utc": _to_utc_z(next_set_after_rise_iso),
        "next_moonset_local": _strip_microseconds(to_local_time(next_set_after_rise_iso)) if next_set_after_rise_iso else None,
        "minutes_until_rise": minutes_until,
        "rises_in": human_until,
        "visibility_duration_minutes": duration_minutes,
        "best_observation_time_utc": best_midpoint_utc,
        "best_observation_time_local": best_midpoint_local,
        "search_window_days": search_days,
    }
