import asyncio
import httpx
from datetime import datetime
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.models.alert import Alert
from app.services.satellite_service import get_satellite_window


async def notify(alert: Alert, payload: dict):
    headers = {}
    if alert.secret:
        headers["X-Luna-Secret"] = alert.secret
    async with httpx.AsyncClient(timeout=10) as client:
        await client.post(alert.callback_url, json=payload, headers=headers)


async def run_alert_worker(interval_seconds: int = 60):
    while True:
        try:
            db: Session = SessionLocal()
            alerts = db.query(Alert).filter(Alert.active == True).all()
            for alert in alerts:
                try:
                    win = get_satellite_window(alert.identifier, alert.lat, alert.lon, search_hours=24)
                except Exception:
                    continue
                minutes_until_rise = win.get("minutes_until_rise")
                visible_now = win.get("visible_now")
                if minutes_until_rise is None and not visible_now:
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
                    await notify(alert, payload)
                    alert.last_notified_at = datetime.utcnow()
                    db.add(alert)
                    db.commit()
        except Exception:
            pass
        finally:
            try:
                db.close()
            except Exception:
                pass
        await asyncio.sleep(interval_seconds)
