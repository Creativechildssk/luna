from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from app.db import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    identifier = Column(String, index=True)  # satellite NORAD or name
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    threshold_minutes = Column(Integer, default=10)
    callback_url = Column(String, nullable=False)
    secret = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_notified_at = Column(DateTime, nullable=True)
    active = Column(Boolean, default=True)
