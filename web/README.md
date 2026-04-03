# LUNA Web (Vite + React)

Rebuilt front-end concept based on `instructions.md`.

## Stack
- Vite + React 18
- TailwindCSS
- React Query (@tanstack/react-query) for data fetching
- Leaflet / react-leaflet (sky map)
- Framer Motion (micro motion)
- Chart.js ready (react-chartjs-2) if you add charts

## Run
```bash
cd web
npm install
npm run dev   # http://localhost:3000
```

Configure API base:
```
cp .env.example .env
echo VITE_API_BASE=http://localhost:8000 >> .env
```

## Structure (src/)
- `App.jsx` – main layout, uses moon window endpoint
- `api.js` – API helpers
- `components/`
  - `LocationPicker`
  - `CountdownGrid`
  - `StatCard`
  - `MoonPhaseVisual`
  - `SkyMap` (+ `SkyMapLeaflet`)
  - `Timeline`

## Notes
- Best observation time is the peak altitude returned by backend.
- Distance (km) is displayed from backend `position.distance_km`.
- Tailwind config lives in `tailwind.config.cjs`; Vite alias `@` → `src`.
