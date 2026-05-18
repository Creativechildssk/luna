import os
import time

from app.services.data_sync import sync_data


def _as_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except Exception:
        return default


def main() -> None:
    run_once = os.getenv("LUNA_SYNC_RUN_ONCE", "false").strip().lower() == "true"
    interval_seconds = _as_int("LUNA_SYNC_INTERVAL_SECONDS", 3600)
    force_first = os.getenv("LUNA_SYNC_FORCE_FIRST", "false").strip().lower() == "true"

    first = True
    while True:
        result = sync_data(force=force_first and first)
        first = False
        print(result, flush=True)
        if run_once:
            return
        time.sleep(max(60, interval_seconds))


if __name__ == "__main__":
    main()
