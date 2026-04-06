import asyncio
import logging
import httpx
from datetime import datetime
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.models.alert import Alert
from app.services.satellite_service import get_satellite_window


logger = logging.getLogger(__name__)
_LAST_ALERT_SIGNATURES: dict[int, str] = {}


async def notify(alert: Alert, payload: dict):
    headers = {}
    if alert.secret:
        headers["X-Luna-Secret"] = alert.secret
    async with httpx.AsyncClient(timeout=10) as client:
        await client.post(alert.callback_url, json=payload, headers=headers)


def _notification_signature(alert: Alert, window: dict) -> str | None:
    if window.get("visible_now"):
        next_set = window.get("next_set_utc")
        if not next_set:
            return f"visible:{alert.identifier}"
        return f"visible:{alert.identifier}:{next_set}"

    next_rise = window.get("next_rise_utc")
    if next_rise is None:
        return None
    return f"rise:{alert.identifier}:{next_rise}"


async def run_alert_worker(interval_seconds: int = 60):
    while True:
        db: Session | None = None
        try:
            db = SessionLocal()
            alerts = db.query(Alert).filter(Alert.active == True).all()
            for alert in alerts:
                try:
                    win = get_satellite_window(alert.identifier, alert.lat, alert.lon, search_hours=24)
                except Exception:
                    logger.exception("Failed to evaluate alert %s", alert.id)
                    continue

                minutes_until_rise = win.get("minutes_until_rise")
                visible_now = win.get("visible_now")
                if minutes_until_rise is None and not visible_now:
                    _LAST_ALERT_SIGNATURES.pop(alert.id, None)
                    continue

                should_notify = False
                note = None
                if visible_now:
                    note = f"{alert.identifier} is visible now."
                    should_notify = True
                elif minutes_until_rise is not None and minutes_until_rise <= alert.threshold_minutes:
                    note = f"{alert.identifier} visible in {minutes_until_rise} minutes."
                    should_notify = True

                if should_notify:
                    signature = _notification_signature(alert, win)
                    if signature and _LAST_ALERT_SIGNATURES.get(alert.id) == signature:
                        continue

                    payload = {
                        "identifier": alert.identifier,
                        "visible_now": visible_now,
                        "minutes_until_rise": minutes_until_rise,
                        "next_rise_utc": win.get("next_rise_utc"),
                        "next_rise_local": win.get("next_rise_local"),
                        "lat": alert.lat,
                        "lon": alert.lon,
                        "message": note,
                    }
                    try:
                        await notify(alert, payload)
                    except Exception:
                        logger.exception("Failed to deliver alert %s", alert.id)
                        continue

                    _LAST_ALERT_SIGNATURES[alert.id] = signature or "delivered"
                    alert.last_notified_at = datetime.utcnow()
                    db.add(alert)
                    db.commit()
                else:
                    _LAST_ALERT_SIGNATURES.pop(alert.id, None)
        except Exception:
            logger.exception("Alert worker loop failed")
        finally:
            try:
                if db is not None:
                    db.close()
            except Exception:
                logger.exception("Failed to close alert worker database session")
        await asyncio.sleep(interval_seconds)
