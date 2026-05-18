import os
import sys
from pathlib import Path

from fastapi.testclient import TestClient

os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("APP_ENV", "test")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.main import app


def test_health_check():
    client = TestClient(app)
    response = client.get("/health/")
    assert response.status_code == 200
    assert response.json().get("status") == "ok"


def test_root_endpoint():
    client = TestClient(app)
    response = client.get("/")
    assert response.status_code == 200
    assert "LUNA API is running" in response.json().get("message", "")
