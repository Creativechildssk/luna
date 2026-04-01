from datetime import datetime, timezone


def to_local_time(utc_iso: str) -> str:
    """
    Convert an ISO8601 UTC timestamp to local time ISO8601 (with offset).
    Accepts strings with optional trailing 'Z'.
    """
    # Normalize trailing Z to +00:00 for fromisoformat compatibility
    if utc_iso.endswith("Z"):
        utc_iso = utc_iso.replace("Z", "+00:00")

    dt = datetime.fromisoformat(utc_iso)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)

    return dt.astimezone().isoformat()
