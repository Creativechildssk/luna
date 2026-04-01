# LUNA  
Location-Based Lunar & Space Observation Engine

## Overview
LUNA is an open-source platform that helps anyone—especially students—observe the Moon and space missions from Earth with precision. It turns time + location + orbital data into simple, actionable guidance: “Look here, at this time.”

## Vision
LUNA is the foundation for a student-powered global observation network and a stepping stone toward future systems from WFD DeepTech Labs, including satellite tracking and deep-space observation.

## Features (current)
- Real-time Moon position (altitude, azimuth)
- Location-based observation (lat/long input)
- Direction guidance (N, NE, E, etc.)
- UTC-based timing
- API-first architecture
- Fully open-source

## Planned features
- Next moonrise / visibility prediction
- Space mission tracking (e.g., Artemis flyby)
- Flutter mobile app with alerts (“Look now!”)
- Multi-user observation network
- Camera integration (AR-style guidance)
- Satellite tracking (ISS, CubeSats, future USAT)

## Tech stack
- **Backend:** Python, FastAPI, Skyfield, NumPy
- **Frontend (planned):** Next.js
- **Mobile (planned):** Flutter

## Architecture (conceptual)
User Location + UTC Time  
        ↓  
Sky Engine (Moon position via Skyfield)  
        ↓  
Mission Engine (events & trajectories)  
        ↓  
Projection Layer  
        ↓  
Output → “Where & When to Look”

## Project structure
```
luna/
├── backend/   # FastAPI core engine
├── mobile/    # Flutter app
├── web/       # Next.js dashboard
├── data/      # Mission data
├── docs/      # Documentation
└── examples/  # Student-friendly scripts
```

## Getting started
1) Clone the repo  
   `git clone https://github.com/your-username/luna.git`  
   `cd luna/backend`
2) Install dependencies  
   `pip install -r requirements.txt`
3) Run the server  
   `uvicorn app.main:app`
4) Open API docs  
   http://127.0.0.1:8000/docs

## Example API usage
**GET** `/moon/position?lat=11.5&lon=76.1`

Response:
```json
{
  "timestamp_utc": "2026-03-29T07:07:36",
  "altitude": -39.8,
  "azimuth": 59.37,
  "direction": "NE",
  "distance_km": 385016.25
}
```

## How it works
- Uses UTC as the global time reference.
- Computes Moon position using JPL ephemeris via Skyfield.
- Converts results into altitude (visibility) and azimuth (direction).

## Open-source philosophy
- Free to use
- Free to modify
- Built for learning  
License: MIT

## Contributing
We welcome contributions from students, developers, and astronomy enthusiasts.
1) Fork the repository  
2) Create a new branch  
3) Make your changes  
4) Submit a Pull Request

Good first contributions: improve UI, add mission data, enhance docs, build mobile features.

## Future impact
LUNA aims to make astronomy accessible to every student, build a distributed observation network, and serve as a base for satellite tracking, mission visualization, and deep-tech space systems.

## Built by
WFD DeepTech Labs — building accessible space-tech systems for the future.

## Support
If you find this project useful: star the repo, fork it, and share it. Let's build space-tech together.
