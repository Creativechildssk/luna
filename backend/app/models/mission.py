from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text

from app.db import Base


class Mission(Base):
	__tablename__ = "missions"

	id = Column(Integer, primary_key=True, index=True)
	name = Column(String, nullable=False, index=True)
	slug = Column(String, nullable=False, unique=True, index=True)
	description = Column(Text, nullable=True)
	status = Column(String, nullable=False, default="planned")
	mission_type = Column(String, nullable=True)
	launch_datetime = Column(DateTime, nullable=True)
	vehicle_name = Column(String, nullable=True)
	tracking_identifier = Column(String, nullable=True)
	tracking_type = Column(String, nullable=True)
	active = Column(Boolean, default=True, nullable=False)
	created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
	updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
