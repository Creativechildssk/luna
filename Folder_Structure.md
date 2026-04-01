luna/
│
├── backend/                  # FastAPI (core engine)
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── moon.py
│   │   │   ├── mission.py
│   │   │   └── health.py
│   │   │
│   │   ├── core/             # Core configs
│   │   │   ├── config.py
│   │   │   └── time_utils.py
│   │   │
│   │   ├── services/         # Logic layer
│   │   │   ├── moon_service.py
│   │   │   └── mission_service.py
│   │   │
│   │   ├── models/           # Data models (Pydantic)
│   │   │   ├── moon.py
│   │   │   └── mission.py
│   │   │
│   │   ├── utils/            # Helper functions
│   │   │   ├── direction.py
│   │   │   └── math_utils.py
│   │   │
│   │   └── main.py           # FastAPI entry point
│   │
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── mobile/                   # Flutter App
│   ├── lib/
│   │   ├── screens/
│   │   │   └── home_screen.dart
│   │   │
│   │   ├── services/
│   │   │   └── api_service.dart
│   │   │
│   │   ├── models/
│   │   │   └── moon_model.dart
│   │   │
│   │   └── main.dart
│   │
│   ├── pubspec.yaml
│   └── README.md
│
├── web/                      # Next.js Dashboard (optional early)
│   ├── pages/
│   │   └── index.js
│   │
│   ├── components/
│   │   └── MoonCard.js
│   │
│   └── package.json
│
├── data/                     # Static mission data
│   ├── artemis2.json
│   └── sample_locations.json
│
├── docs/                     # Documentation
│   ├── architecture.md
│   ├── api.md
│   └── getting-started.md
│
├── examples/                 # Simple scripts for students
│   └── track_moon.py
│
├── .github/                  # Open-source workflow
│   ├── ISSUE_TEMPLATE.md
│   └── PULL_REQUEST_TEMPLATE.md
│
├── docker-compose.yml
├── README.md
├── CONTRIBUTING.md
└── LICENSE