from __future__ import annotations

from datetime import datetime
import re

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.mission import Mission
from app.services.satellite_service import get_satellite_track


def slugify(value: str) -> str:
	slug = re.sub(r"[^a-z0-9]+", "-", value.strip().lower()).strip("-")
	if not slug:
		raise HTTPException(status_code=400, detail="Mission name must contain letters or numbers")
	return slug


def serialize_mission(mission: Mission) -> dict:
	return {
		"id": mission.id,
		"name": mission.name,
		"slug": mission.slug,
		"description": mission.description,
		"status": mission.status,
		"mission_type": mission.mission_type,
		"launch_datetime": mission.launch_datetime.isoformat() if mission.launch_datetime else None,
		"vehicle_name": mission.vehicle_name,
		"tracking_identifier": mission.tracking_identifier,
		"tracking_type": mission.tracking_type,
		"active": mission.active,
		"created_at": mission.created_at.isoformat() if mission.created_at else None,
		"updated_at": mission.updated_at.isoformat() if mission.updated_at else None,
	}


def list_missions(db: Session, include_inactive: bool = False) -> list[dict]:
	query = db.query(Mission)
	if not include_inactive:
		query = query.filter(Mission.active == True)
	missions = query.order_by(Mission.launch_datetime.is_(None), Mission.launch_datetime.asc(), Mission.id.asc()).all()
	return [serialize_mission(mission) for mission in missions]


def get_mission_or_404(db: Session, mission_id: int) -> Mission:
	mission = db.query(Mission).filter(Mission.id == mission_id).first()
	if mission is None:
		raise HTTPException(status_code=404, detail="Mission not found")
	return mission


def ensure_unique_slug(db: Session, slug: str, mission_id: int | None = None) -> None:
	query = db.query(Mission).filter(Mission.slug == slug)
	if mission_id is not None:
		query = query.filter(Mission.id != mission_id)
	if query.first() is not None:
		raise HTTPException(status_code=409, detail="Mission slug already exists")


def create_mission(db: Session, payload) -> dict:
	slug = payload.slug or slugify(payload.name)
	ensure_unique_slug(db, slug)
	mission = Mission(
		name=payload.name.strip(),
		slug=slug,
		description=payload.description,
		status=payload.status,
		mission_type=payload.mission_type,
		launch_datetime=payload.launch_datetime,
		vehicle_name=payload.vehicle_name,
		tracking_identifier=payload.tracking_identifier,
		tracking_type=payload.tracking_type,
		active=payload.active,
	)
	db.add(mission)
	db.commit()
	db.refresh(mission)
	return serialize_mission(mission)


def update_mission(db: Session, mission_id: int, payload) -> dict:
	mission = get_mission_or_404(db, mission_id)
	next_slug = payload.slug or slugify(payload.name)
	ensure_unique_slug(db, next_slug, mission_id=mission.id)

	mission.name = payload.name.strip()
	mission.slug = next_slug
	mission.description = payload.description
	mission.status = payload.status
	mission.mission_type = payload.mission_type
	mission.launch_datetime = payload.launch_datetime
	mission.vehicle_name = payload.vehicle_name
	mission.tracking_identifier = payload.tracking_identifier
	mission.tracking_type = payload.tracking_type
	mission.active = payload.active
	mission.updated_at = datetime.utcnow()

	db.add(mission)
	db.commit()
	db.refresh(mission)
	return serialize_mission(mission)


def delete_mission(db: Session, mission_id: int) -> dict:
	mission = get_mission_or_404(db, mission_id)
	mission.active = False
	mission.updated_at = datetime.utcnow()
	db.add(mission)
	db.commit()
	return {"status": "deactivated", "id": mission.id}


def get_mission_track(db: Session, mission_id: int, hours: int = 1, step_sec: int = 60) -> dict:
	mission = get_mission_or_404(db, mission_id)
	if not mission.tracking_identifier:
		raise HTTPException(status_code=400, detail="Mission does not have a tracking identifier")
	if mission.tracking_type not in (None, "satellite"):
		raise HTTPException(status_code=400, detail="Only satellite tracking is supported right now")

	track = get_satellite_track(mission.tracking_identifier, hours=hours, step_sec=step_sec)
	return {
		"mission": serialize_mission(mission),
		"tracking": track,
	}
