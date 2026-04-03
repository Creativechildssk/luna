from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from skyfield.api import Loader, Topos

from app.utils.direction import get_direction, get_direction_verbose
from app.utils.time_local import to_local_time
from app.services.astro_utils import (
    now_timestamp_pair,
    to_utc_z,
    strip_microseconds,
    minutes_until,
    format_minutes,
    duration_and_midpoint,
    is_night,
)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)

TLE_FILE = DATA_DIR / "satellites.tle"
loader = Loader(str(DATA_DIR))
ts = loader.timescale()
_tle_cache = None
_tle_mtime = None
_ephem_cache = None
EPHEM_NAME = "de421.bsp"
EPHEM_URL = "https://ssd.jpl.nasa.gov/ftp/eph/planets/bsp/de421.bsp"


def _ephem():
    global _ephem_cache
    if _ephem_cache is not None:
        return _ephem_cache
    path = DATA_DIR / EPHEM_NAME
    if not path.exists():
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


def load_tle(force: bool = False):
    global _tle_cache, _tle_mtime
    if TLE_FILE.exists():
        mtime = TLE_FILE.stat().st_mtime
    else:
        mtime = None

    if _tle_cache is not None and not force and _tle_mtime == mtime:
        return _tle_cache

    if not TLE_FILE.exists():
        # fallback to built-in ISS if file missing
        from skyfield.api import EarthSatellite
        iss_tle = (
            "ISS (ZARYA)",
            "1 25544U 98067A   24157.55059028  .00008361  00000+0  15486-3 0  9994",
            "2 25544  51.6413  31.8664 0005517 115.1439 351.7793 15.50337559448135",
        )
        sat = EarthSatellite(iss_tle[1], iss_tle[2], iss_tle[0], ts)
        cache = {
            sat.name.upper().strip(): sat,
            str(sat.model.satnum): sat,
        }
        _tle_cache = cache
        _tle_mtime = mtime
        return _tle_cache

    sats = loader.tle_file(str(TLE_FILE))
    cache = {sat.name.upper().strip(): sat for sat in sats}
    for sat in sats:
        cache[str(sat.model.satnum)] = sat
    _tle_cache = cache
    _tle_mtime = mtime
    return _tle_cache


def _get_sat(identifier: str):
    ident = identifier.strip()
    sats = load_tle()
    key = ident.upper()
    sat = sats.get(key)
    # try reload once if not found (file may have changed)
    if sat is None:
        sats = load_tle(force=True)
        sat = sats.get(key)
    # partial name match if still not found
    if sat is None:
        matches = [s for name, s in sats.items() if not name.isdigit() and key in name]
        if len(matches) == 1:
            sat = matches[0]
    if sat is None:
        available = sorted({k for k in sats.keys() if not k.isdigit()})
        raise ValueError(
            "Satellite not found; use name or NORAD ID present in satellites.tle. "
            f"Available names include: {', '.join(available[:10])}"
        )
    return sat


def _topos(lat: float, lon: float):
    return Topos(latitude_degrees=lat, longitude_degrees=lon)


def _position(sat, lat: float, lon: float):
    t = ts.now()
    site = _topos(lat, lon)
    difference = sat - site
    topocentric = difference.at(t)
    alt, az, distance = topocentric.altaz()

    altitude = float(alt.degrees)
    azimuth = float(az.degrees)
    distance_km = float(distance.km)

    utc_iso, local_iso = now_timestamp_pair()
    return {
        "timestamp_utc": utc_iso,
        "timestamp_local": local_iso,
        "altitude": round(altitude, 2),
        "azimuth": round(azimuth, 2),
        "direction": get_direction(azimuth),
        "direction_label": get_direction_verbose(azimuth),
        "distance_km": round(distance_km, 2),
    }


def get_satellite_position(identifier: str, lat: float, lon: float):
    sat = _get_sat(identifier)
    return _position(sat, lat, lon)


def get_satellite_window(identifier: str, lat: float, lon: float, search_hours: int = 24):
    sat = _get_sat(identifier)
    site = _topos(lat, lon)

    t0 = ts.now()
    t1 = t0 + (search_hours / 24)

    # Approximate rise/set over horizon using above/below 0°
    times, events = sat.find_events(site, t0, t1, altitude_degrees=0.0)

    rise_iso = None
    set_iso = None
    for ti, ev in zip(times, events):
        # ev: 0 rise, 1 culmination, 2 set
        if ev == 0 and rise_iso is None:
            rise_iso = ti.utc_iso()
        if ev == 2 and set_iso is None:
            set_iso = ti.utc_iso()
        if rise_iso and set_iso:
            break

    rise_iso = to_utc_z(rise_iso)
    set_iso = to_utc_z(set_iso)

    rise_local = strip_microseconds(to_local_time(rise_iso)) if rise_iso else None
    set_local = strip_microseconds(to_local_time(set_iso)) if set_iso else None

    minutes_until_rise = minutes_until(rise_iso)
    minutes_until_set = minutes_until(set_iso)
    rises_in = format_minutes(minutes_until_rise)
    sets_in = format_minutes(minutes_until_set)

    duration_minutes, best_mid_utc = duration_and_midpoint(rise_iso, set_iso)
    best_mid_local = strip_microseconds(to_local_time(best_mid_utc)) if best_mid_utc else None
    minutes_until_best = minutes_until(best_mid_utc) if best_mid_utc else None

    pos = _position(sat, lat, lon)
    visible = pos["altitude"] > 0

    if visible:
        visibility_state = "visible"
    elif minutes_until_rise is not None and minutes_until_rise <= 60:
        visibility_state = "rising_soon"
    elif minutes_until_set is not None and minutes_until_set <= 60:
        visibility_state = "setting_soon"
    else:
        visibility_state = "below_horizon"

    # For satellites, "phase_hint" not applicable; return altitude-based note
    status_parts = []
    if visible:
        status_parts.append("Satellite above horizon")
    if rises_in:
        status_parts.append(f"Rises {rises_in}")
    if sets_in:
        status_parts.append(f"Sets {sets_in}")
    if best_mid_local:
        status_parts.append(f"Best ~{best_mid_local}")
    status_message = "; ".join(status_parts)
    is_night_flag = is_night(ts, _earth(), _sun(), _topos, lat, lon, best_mid_utc or rise_iso)

    return {
        "satellite": identifier,
        "visible_now": visible,
        "next_rise_utc": rise_iso,
        "next_rise_local": rise_local,
        "next_set_utc": set_iso,
        "next_set_local": set_local,
        "minutes_until_rise": None if visible else minutes_until_rise,
        "rises_in": None if visible else rises_in,
        "minutes_until_set": minutes_until_set,
        "sets_in": sets_in,
        "visible_duration_minutes": duration_minutes,
        "best_observation_time_utc": best_mid_utc,
        "best_observation_time_local": best_mid_local,
        "minutes_until_best": minutes_until_best,
        "visibility_state": visibility_state,
        "is_night": is_night_flag,
        "phase_hint": None,
        "status_message": status_message,
        "position": {
            "azimuth": pos["azimuth"],
            "direction": pos["direction"],
            "direction_label": pos["direction_label"],
            "altitude": pos["altitude"],
            "elevation_state": "above_horizon" if visible else "below_horizon",
        },
    }


def get_satellite_track(
    identifier: str, hours: int = 1, step_sec: int = 30
):
    """
    Return ground track points for the satellite over the next 'hours'.
    """
    sat = _get_sat(identifier)
    total_seconds = max(60, min(hours * 3600, 6 * 3600))  # cap at 6h for payload size
    step = max(5, min(step_sec, 300))  # 5s..300s
    t0 = ts.now()

    points = []
    for offset in range(0, total_seconds + 1, step):
        t = t0 + (offset / 86400)
        subpoint = sat.at(t).subpoint()
        lat = float(subpoint.latitude.degrees)
        lon = float(subpoint.longitude.degrees)
        alt_km = float(subpoint.elevation.km)
        points.append(
            {
                "timestamp_utc": to_utc_z(t.utc_iso()),
                "lat": round(lat, 4),
                "lon": round(lon, 4),
                "alt_km": round(alt_km, 2),
            }
        )

    current = points[0] if points else None

    return {
        "satellite": identifier,
        "hours": hours,
        "step_sec": step,
        "current": current,
        "points": points,
    }
