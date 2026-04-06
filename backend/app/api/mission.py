from datetime import datetime

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db import SessionLocal, engine
from app.models.mission import Base
from app.services.mission_service import (
	create_mission,
	delete_mission,
	get_mission_or_404,
	get_mission_track,
	list_missions,
	serialize_mission,
	update_mission,
)

Base.metadata.create_all(bind=engine)

router = APIRouter()


def get_db():
	db = SessionLocal()
	try:
		yield db
	finally:
		db.close()


class MissionPayload(BaseModel):
	name: str = Field(..., min_length=1, max_length=120)
	slug: str | None = Field(default=None, max_length=140)
	description: str | None = None
	status: str = Field(default="planned", min_length=2, max_length=40)
	mission_type: str | None = Field(default=None, max_length=60)
	launch_datetime: datetime | None = None
	vehicle_name: str | None = Field(default=None, max_length=120)
	tracking_identifier: str | None = Field(default=None, max_length=120)
	tracking_type: str | None = Field(default="satellite", max_length=40)
	active: bool = True


@router.get("/", response_model=list[dict])
def mission_list(
	include_inactive: bool = Query(False, description="Include inactive missions"),
	db: Session = Depends(get_db),
):
	return list_missions(db, include_inactive=include_inactive)


@router.post("/", response_model=dict)
def mission_create(payload: MissionPayload, db: Session = Depends(get_db)):
	return create_mission(db, payload)


@router.get("/{mission_id}", response_model=dict)
def mission_detail(mission_id: int, db: Session = Depends(get_db)):
	return serialize_mission(get_mission_or_404(db, mission_id))


@router.put("/{mission_id}", response_model=dict)
def mission_update(mission_id: int, payload: MissionPayload, db: Session = Depends(get_db)):
	return update_mission(db, mission_id, payload)


@router.delete("/{mission_id}", response_model=dict)
def mission_remove(mission_id: int, db: Session = Depends(get_db)):
	return delete_mission(db, mission_id)


@router.get("/{mission_id}/track", response_model=dict)
def mission_track(
	mission_id: int,
	hours: int = Query(1, ge=1, le=6, description="Track duration in hours"),
	step_sec: int = Query(60, ge=5, le=300, description="Sampling step in seconds"),
	db: Session = Depends(get_db),
):
	return get_mission_track(db, mission_id, hours=hours, step_sec=step_sec)
