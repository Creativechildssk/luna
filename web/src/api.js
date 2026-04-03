const base = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

async function fetchJson(path, params) {
  const url = new URL(base + path);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

export const api = {
  moonWindow: (lat, lon) => fetchJson('/moon/window', { lat, lon }),
  planetWindow: (body, lat, lon) => fetchJson('/planet/window', { body, lat, lon }),
  satelliteWindow: (id, lat, lon, hours = 24) =>
    fetchJson('/satellite/window', { identifier: id, lat, lon, hours }),
  satelliteTrack: (id, hours = 1, step_sec = 60) =>
    fetchJson('/satellite/track', { identifier: id, hours, step_sec }),
  satelliteVisible: (lat, lon, hours = 12, limit = 10) =>
    fetchJson('/satellite/visible', { lat, lon, hours, limit }),
};

export function fmt(val, fallback = '—') {
  if (val === null || val === undefined) return fallback;
  return val;
}
