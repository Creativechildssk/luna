from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import moon, health, planet, satellite

app = FastAPI(title="LUNA API", version="1.0")

# CORS for local dev/web
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(moon.router, prefix="/moon", tags=["Moon"])
app.include_router(planet.router, prefix="/planet", tags=["Planet"])
app.include_router(satellite.router, prefix="/satellite", tags=["Satellite"])

@app.get("/")
def root():
    return {"message": "🌕 LUNA API is running"}
