import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import LocationPicker from './components/LocationPicker';
import CountdownGrid from './components/CountdownGrid';
import MoonPhaseVisual from './components/MoonPhaseVisual';
import SkyMap from './components/SkyMap';
import Timeline from './components/Timeline';
import StatCard from './components/StatCard';

export default function App() {
  const [lat, setLat] = useState(null);
  const [lon, setLon] = useState(null);

  const moon = useQuery({
    queryKey: ['moon', lat, lon],
    queryFn: () => api.moonWindow(lat, lon),
    enabled: lat !== null && lon !== null,
    staleTime: 30_000,
  });

  const loading = moon.isLoading || moon.isFetching;
  const data = moon.data;

  const summary = useMemo(
    () => ({
      visible: data?.visible_now,
      phase: data?.phase_hint,
      illum: data?.illumination_percent,
      direction: data?.position?.direction,
      azimuth: data?.position?.azimuth,
      altitude: data?.position?.altitude,
      distance_km: data?.position?.distance_km,
    }),
    [data]
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">
      <header className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-xs text-muted uppercase tracking-wide">LUNA v1.0.0</div>
          <h1 className="text-2xl font-bold">Sky Window</h1>
          <div className="text-sm text-muted">Moon, planets, satellites · visibility and best time to look</div>
        </div>
        <div className="text-sm text-muted">API: {import.meta.env.VITE_API_BASE || 'http://localhost:8000'}</div>
      </header>

      <LocationPicker
        onChange={(la, lo) => {
          setLat(la);
          setLon(lo);
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="card p-4 space-y-2">
          <div className="text-sm text-muted">Visibility</div>
          <div className="text-lg font-semibold">
            {summary.visible ? 'Visible now' : 'Below horizon'}
          </div>
          <div className="text-sm text-muted">
            Az {summary.azimuth ?? '—'}°, Alt {summary.altitude ?? '—'}°, Dir {summary.direction ?? '—'}
          </div>
          <div className="text-sm text-muted">
            Distance {summary.distance_km ? `${Math.round(summary.distance_km)} km` : '—'}
          </div>
        </div>

        <MoonPhaseVisual illumination={summary.illum} phase_hint={summary.phase} />

        <div className="card p-4 space-y-2">
          <div className="text-sm text-muted">Status</div>
          <div className="text-base">{data?.status_message || 'Set a location to load data.'}</div>
          <div className="text-xs text-muted">State: {data?.visibility_state || '—'}</div>
          <div className="text-xs text-muted">Night? {data?.is_night ? 'Yes' : 'No'}</div>
        </div>
      </div>

      <CountdownGrid data={data} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <SkyMap position={data?.position} />
        <Timeline
          rise={data?.next_moonrise_local}
          best={data?.best_observation_time_local}
          set={data?.next_moonset_local}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard label="Max altitude" value={data?.max_altitude_deg ? `${data.max_altitude_deg}°` : '—'} sub={data?.time_of_max_altitude_local} />
        <StatCard label="Illumination" value={data?.illumination_percent ? `${data.illumination_percent}%` : '—'} sub={data?.phase_hint} />
        <StatCard label="Days until next rise" value={data?.days_until_next_rise ?? '—'} />
      </div>

      {loading && <div className="text-sm text-muted">Loading…</div>}
    </div>
  );
}
