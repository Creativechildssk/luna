# Getting Started

## Local setup

### Backend
```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend
```bash
cd web
npm install
npm run dev -- --host --port 3000
```

Set `VITE_API_BASE=http://localhost:8000` for local development.

## Docker
```bash
docker compose up -d --build
```

## First places to visit
- backend docs: `/docs`
- main repository docs: [docs/getting-started.md](../docs/getting-started.md)
