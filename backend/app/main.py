from fastapi import FastAPI
from app.api import moon, health, planet, satellite

app = FastAPI(title="LUNA API", version="1.0")

# Include routers
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(moon.router, prefix="/moon", tags=["Moon"])
app.include_router(planet.router, prefix="/planet", tags=["Planet"])
app.include_router(satellite.router, prefix="/satellite", tags=["Satellite"])

@app.get("/")
def root():
    return {"message": "🌕 LUNA API is running"}
