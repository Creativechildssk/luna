# LUNA Web

Next.js 14 client for the LUNA backend (moon / planets / satellites visibility).

## Setup
```bash
cd web
npm install
npm run dev   # http://localhost:3000
```

Set API base (defaults to `http://localhost:8000`):
```
cp .env.local.example .env.local
echo NEXT_PUBLIC_API_BASE=http://localhost:8000 >> .env.local
```

## Build & run (Docker)
```bash
docker build -t luna-web .
docker run -p 3000:3000 --env NEXT_PUBLIC_API_BASE=http://host.docker.internal:8000 luna-web
```

## Notes
- Geolocation is requested on load (if the browser allows).
- Uses `react-leaflet` for satellite ground track.
- UI is mobile-first with 16-point compass directions from the backend.
