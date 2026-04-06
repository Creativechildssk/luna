import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import alerts, health, mission, moon, planet, satellite
from app.api import satellite_visible
from app.core.config import settings
from app.services.alert_worker import run_alert_worker

app = FastAPI(title=settings.APP_NAME, version=settings.VERSION)

# CORS for local dev/web
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(moon.router, prefix="/moon", tags=["Moon"])
app.include_router(planet.router, prefix="/planet", tags=["Planet"])
app.include_router(satellite.router, prefix="/satellite", tags=["Satellite"])
app.include_router(mission.router, prefix="/mission", tags=["Mission"])
app.include_router(alerts.router, prefix="/alerts", tags=["Alerts"])
app.include_router(satellite_visible.router, prefix="/satellite", tags=["Satellite"])


@app.on_event("startup")
async def startup_event():
    app.state.alert_worker_task = asyncio.create_task(run_alert_worker())

@app.get("/")
def root():
    return {"message": "🌕 LUNA API is running"}
