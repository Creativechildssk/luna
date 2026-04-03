from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, HttpUrl, Field
from sqlalchemy.orm import Session
from datetime import datetime

from app.db import SessionLocal, engine
from app.models.alert import Alert, Base

Base.metadata.create_all(bind=engine)

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class AlertCreate(BaseModel):
    identifier: str
    lat: float
    lon: float
    threshold_minutes: int = Field(default=10, ge=1, le=120)
    callback_url: HttpUrl
    secret: str | None = None


@router.post("/", response_model=dict)
def create_alert(payload: AlertCreate, db: Session = Depends(get_db)):
    alert = Alert(
        identifier=payload.identifier.strip(),
        lat=payload.lat,
        lon=payload.lon,
        threshold_minutes=payload.threshold_minutes,
        callback_url=str(payload.callback_url),
        secret=payload.secret,
        created_at=datetime.utcnow(),
        active=True,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return {"id": alert.id, "status": "created"}


@router.get("/", response_model=list[dict])
def list_alerts(db: Session = Depends(get_db)):
    alerts = db.query(Alert).filter(Alert.active == True).all()
    return [
        {
            "id": a.id,
            "identifier": a.identifier,
            "lat": a.lat,
            "lon": a.lon,
            "threshold_minutes": a.threshold_minutes,
            "callback_url": a.callback_url,
            "active": a.active,
            "last_notified_at": a.last_notified_at,
        }
        for a in alerts
    ]


@router.delete("/{alert_id}", response_model=dict)
def delete_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.active = False
    db.commit()
    return {"status": "deactivated"}
