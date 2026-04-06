const baseEnv = import.meta.env.VITE_API_BASE || "http://localhost:8000";

function buildUrl(path) {
  // Allow both absolute bases (http...) and relative ("/api").
  if (baseEnv.startsWith("http")) {
    return new URL(path, baseEnv);
  }
  // Relative base: resolve against current origin.
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const base = origin + baseEnv.replace(/\/$/, "") + "/";
  return new URL(path.replace(/^\//, ""), base);
}

async function fetchJson(path, params) {
  const url = buildUrl(path);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    });
  }
  let res;
  try {
    res = await fetch(url.toString());
  } catch (error) {
    throw new Error(`Network error calling ${url.toString()}: ${error.message}`);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

async function sendJson(path, method, body) {
  const url = buildUrl(path);
  let res;
  try {
    res = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw new Error(`Network error calling ${url.toString()}: ${error.message}`);
  }
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
  alerts: () => fetchJson('/alerts'),
  missions: (include_inactive = false) => fetchJson('/mission/', { include_inactive }),
  missionCreate: (payload) => sendJson('/mission/', 'POST', payload),
  missionUpdate: (id, payload) => sendJson(`/mission/${id}`, 'PUT', payload),
  missionDelete: (id) => sendJson(`/mission/${id}`, 'DELETE'),
  missionTrack: (id, hours = 1, step_sec = 60) => fetchJson(`/mission/${id}/track`, { hours, step_sec }),
  weather: async (lat, lon) => {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', lat);
    url.searchParams.set('longitude', lon);
    url.searchParams.set('hourly', 'cloud_cover');
    url.searchParams.set('current', 'cloud_cover');
    url.searchParams.set('forecast_days', '1');
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
};

export function fmt(val, fallback = "—") {
  if (val === null || val === undefined) return fallback;
  return val;
}
