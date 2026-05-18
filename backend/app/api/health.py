from fastapi import APIRouter
from app.services.data_sync import data_status

router = APIRouter()

@router.get("/")
def health_check():
    return {"status": "ok"}


@router.get("/data")
def health_data():
    return data_status()
