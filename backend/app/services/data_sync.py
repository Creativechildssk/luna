import hashlib
import json
import os
import tempfile
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)

STATE_FILE = DATA_DIR / "sync_state.json"

FILES = {
    "de421": {
        "path": DATA_DIR / "de421.bsp",
        "url": "https://ssd.jpl.nasa.gov/ftp/eph/planets/bsp/de421.bsp",
        "max_age_seconds": int(os.getenv("LUNA_DE421_MAX_AGE_SECONDS", str(30 * 24 * 3600))),
    },
    "de440s": {
        "path": DATA_DIR / "de440s.bsp",
        "url": "https://ssd.jpl.nasa.gov/ftp/eph/planets/bsp/de440s.bsp",
        "max_age_seconds": int(os.getenv("LUNA_DE440S_MAX_AGE_SECONDS", str(30 * 24 * 3600))),
    },
    "satellites_tle": {
        "path": DATA_DIR / "satellites.tle",
        "url": os.getenv("LUNA_TLE_URL", "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle"),
        "max_age_seconds": int(os.getenv("LUNA_TLE_MAX_AGE_SECONDS", str(6 * 3600))),
    },
}


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def _age_seconds(path: Path) -> float | None:
    if not path.exists():
        return None
    return max(0.0, time.time() - path.stat().st_mtime)


def _is_stale(path: Path, max_age_seconds: int) -> bool:
    age = _age_seconds(path)
    if age is None:
        return True
    return age > max_age_seconds


def _validate_text_file(name: str, path: Path) -> None:
    if name != "satellites_tle":
        return
    text = path.read_text(encoding="utf-8", errors="ignore")
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if len(lines) < 3:
        raise ValueError("TLE payload too short")


def _download_atomic(url: str, target: Path, timeout_seconds: int = 45) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(delete=False, dir=target.parent, suffix=".tmp") as tmp:
        tmp_path = Path(tmp.name)
        with urllib.request.urlopen(url, timeout=timeout_seconds) as resp:
            while True:
                chunk = resp.read(1024 * 1024)
                if not chunk:
                    break
                tmp.write(chunk)
    try:
        if tmp_path.stat().st_size == 0:
            raise ValueError("Downloaded file is empty")
        os.replace(tmp_path, target)
    finally:
        if tmp_path.exists():
            tmp_path.unlink(missing_ok=True)


def _load_state() -> dict:
    if not STATE_FILE.exists():
        return {"last_run_utc": None, "files": {}}
    try:
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {"last_run_utc": None, "files": {}}


def _save_state(state: dict) -> None:
    tmp = STATE_FILE.with_suffix(".tmp")
    tmp.write_text(json.dumps(state, indent=2), encoding="utf-8")
    os.replace(tmp, STATE_FILE)


def sync_data(force: bool = False) -> dict:
    state = _load_state()
    out = {"ran_at_utc": _utc_now_iso(), "files": {}}

    for name, meta in FILES.items():
        path = meta["path"]
        url = meta["url"]
        max_age_seconds = meta["max_age_seconds"]
        stale = _is_stale(path, max_age_seconds)
        should_download = force or stale
        file_result = {
            "path": str(path),
            "url": url,
            "exists": path.exists(),
            "stale": stale,
            "updated": False,
            "error": None,
        }
        try:
            if should_download:
                _download_atomic(url, path)
                _validate_text_file(name, path)
                file_result["updated"] = True
            file_result["exists"] = path.exists()
            file_result["age_seconds"] = _age_seconds(path)
            file_result["sha256"] = _sha256(path) if path.exists() else None
            file_result["mtime_utc"] = (
                datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc).isoformat().replace("+00:00", "Z")
                if path.exists()
                else None
            )
        except Exception as exc:
            file_result["error"] = str(exc)
        out["files"][name] = file_result

    state["last_run_utc"] = out["ran_at_utc"]
    state["files"] = out["files"]
    _save_state(state)
    return out


def data_status() -> dict:
    status = {"generated_at_utc": _utc_now_iso(), "files": {}}
    for name, meta in FILES.items():
        path = meta["path"]
        age = _age_seconds(path)
        stale = True if age is None else age > meta["max_age_seconds"]
        status["files"][name] = {
            "path": str(path),
            "exists": path.exists(),
            "age_seconds": age,
            "max_age_seconds": meta["max_age_seconds"],
            "stale": stale,
            "mtime_utc": (
                datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc).isoformat().replace("+00:00", "Z")
                if path.exists()
                else None
            ),
        }
    status["all_fresh"] = all(not item["stale"] for item in status["files"].values())
    return status
