import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import LocationPicker from './components/LocationPicker';
import CountdownGrid from './components/CountdownGrid';
import MoonPhaseVisual from './components/MoonPhaseVisual';
import SkyMap from './components/SkyMap';
import Timeline from './components/Timeline';
import StatCard from './components/StatCard';
import SelectionBar from './components/SelectionBar';
import SatelliteList from './components/SatelliteList';

export default function App() {
  const [lat, setLat] = useState(null);
  const [lon, setLon] = useState(null);
  const [planet, setPlanet] = useState('mars');
  const [sat, setSat] = useState('ISS');
  const [view, setView] = useState('moon'); // moon | planet | satellite
  const [satRange, setSatRange] = useState('today'); // today|tomorrow|week|month
  const [satSearch, setSatSearch] = useState('');

  const moon = useQuery({
    queryKey: ['moon', lat, lon],
    queryFn: () => api.moonWindow(lat, lon),
    enabled: lat !== null && lon !== null,
    staleTime: 30_000,
  });
  const planetQ = useQuery({
    queryKey: ['planet', planet, lat, lon],
    queryFn: () => api.planetWindow(planet, lat, lon),
    enabled: !!lat && !!lon && !!planet,
    staleTime: 30_000,
  });
  const satQ = useQuery({
    queryKey: ['sat', sat, lat, lon],
    queryFn: () => api.satelliteWindow(sat, lat, lon, 24),
    enabled: !!lat && !!lon && !!sat,
    staleTime: 30_000,
  });
  const satList = useQuery({
    queryKey: ['satList', lat, lon],
    queryFn: () => api.satelliteVisible(lat, lon, satRange === 'today' ? 24 : satRange === 'tomorrow' ? 48 : satRange === 'week' ? 168 : 720, 10),
    enabled: !!lat && !!lon && view === 'satellite',
    staleTime: 60_000,
  });
  const satTrack = useQuery({
    queryKey: ['satTrack', sat],
    queryFn: () => api.satelliteTrack(sat, 1, 60),
    enabled: !!sat,
    staleTime: 60_000,
  });

  const activeData = view === 'moon' ? moon.data : view === 'planet' ? planetQ.data : satQ.data;
  const activeError = view === 'moon' ? moon.error : view === 'planet' ? planetQ.error : satQ.error;
  const loading =
    (view === 'moon' && (moon.isLoading || moon.isFetching)) ||
    (view === 'planet' && planetQ.isLoading) ||
    (view === 'satellite' && satQ.isLoading);
  const alerts = useQuery({
    queryKey: ['alerts'],
    queryFn: () => api.alerts(),
    enabled: view === 'satellite',
    staleTime: 60_000,
  });

  const filteredSatList =
    view === 'satellite' && satList.data
      ? satList.data.filter((s) => s.satellite.toLowerCase().includes(satSearch.toLowerCase()))
      : [];

  const summary = useMemo(
    () => ({
      visible: activeData?.visible_now,
      phase: activeData?.phase_hint,
      illum: activeData?.illumination_percent,
      direction: activeData?.position?.direction,
      azimuth: activeData?.position?.azimuth,
      altitude: activeData?.position?.altitude,
      distance_km: activeData?.position?.distance_km,
      status: activeData?.status_message,
      state: activeData?.visibility_state,
      is_night: activeData?.is_night,
    }),
    [activeData]
  );

  const fmtTime = (ts) => {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 space-y-4 dashboard">
      <header className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-xs text-muted uppercase tracking-wide">LUNA v1.0.0</div>
          <h1 className="text-2xl font-bold">Sky Window</h1>
          <div className="text-sm text-muted">Moon, planets, satellites · visibility and best time to look</div>
        </div>
        <div className="flex gap-2 items-center">
          <button
            className={`px-3 py-1 rounded-lg border border-border ${view === 'moon' ? 'bg-accent text-slate-900' : ''}`}
            onClick={() => setView('moon')}
          >
            Moon
          </button>
          <button
            className={`px-3 py-1 rounded-lg border border-border ${view === 'planet' ? 'bg-accent text-slate-900' : ''}`}
            onClick={() => setView('planet')}
          >
            Planets
          </button>
          <button
            className={`px-3 py-1 rounded-lg border border-border ${view === 'satellite' ? 'bg-accent text-slate-900' : ''}`}
            onClick={() => setView('satellite')}
          >
            Satellites
          </button>
          <div className="text-sm text-muted">API: {import.meta.env.VITE_API_BASE || 'http://localhost:8000'}</div>
        </div>
      </header>

      {activeError && (
        <div className="card p-3 border border-red-500 text-red-200 text-sm">
          Failed to load data: {activeError.message}
        </div>
      )}
      {view === 'satellite' && satList.error && (
        <div className="card p-3 border border-red-500 text-red-200 text-sm">
          Satellites list error: {satList.error.message}
        </div>
      )}

      <LocationPicker
        onChange={(la, lo) => {
          setLat(la);
          setLon(lo);
        }}
      />

      {(view === 'planet' || view === 'satellite') && (
        <SelectionBar view={view} planet={planet} onPlanetChange={setPlanet} sat={sat} onSatChange={setSat} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 stats-grid">
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

        <MoonPhaseVisual illumination={summary.illum} phase_hint={summary.phase || view} />

        <div className="card p-4 space-y-2">
          <div className="text-sm text-muted">Status</div>
          <div className="text-base">{summary.status || 'Set a location to load data.'}</div>
          <div className="text-xs text-muted">State: {summary.state || '—'}</div>
          <div className="text-xs text-muted">Night? {summary.is_night ? 'Yes' : 'No'}</div>
        </div>
      </div>

      <CountdownGrid data={activeData} fmtTime={fmtTime} />

      {view === 'satellite' ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2">
              <SkyMap position={activeData?.position} track={satTrack.data} userLat={lat} userLon={lon} />
            </div>
            <div className="card p-4 space-y-2">
              <div className="text-sm text-muted mb-1">Satellite data ({sat})</div>
              <div className="text-lg font-semibold">{activeData?.visibility_state || '—'}</div>
              <div className="text-sm text-muted">
                Rise {activeData?.rises_in || '—'} · Set {activeData?.sets_in || '—'}
              </div>
              <div className="text-sm text-muted">Alt {activeData?.position?.altitude ?? '—'}° · Dir {activeData?.position?.direction || '—'}</div>
              <div className="text-sm text-muted">Distance {activeData?.position?.distance_km ? `${Math.round(activeData.position.distance_km)} km` : '—'}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
            <div className="lg:col-span-2 space-y-2">
              <div className="card p-3 flex flex-wrap gap-3 items-center">
                <input
                  className="rounded-lg border border-border bg-[#0f1620] px-3 py-2 flex-1 min-w-[200px]"
                  placeholder="Search satellite by name or NORAD..."
                  value={satSearch}
                  onChange={(e) => setSatSearch(e.target.value)}
                />
                <div className="flex gap-2 text-sm">
                  {['today', 'tomorrow', 'week', 'month'].map((r) => (
                    <button
                      key={r}
                      className={`px-3 py-1 rounded-lg border border-border ${satRange === r ? 'bg-accent text-slate-900' : ''}`}
                      onClick={() => setSatRange(r)}
                    >
                      {r[0].toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <SatelliteList
                title={`Satellites in next ${satRange}`}
                list={filteredSatList}
                onSelect={setSat}
                loading={satList.isLoading}
              />
            </div>
            <div className="card p-4 space-y-2">
              <div className="text-sm text-muted">Alerts</div>
              {alerts.isLoading && <div className="text-sm text-muted">Loading…</div>}
              {!alerts.isLoading && (!alerts.data || alerts.data.length === 0) && (
                <div className="text-sm text-muted">None</div>
              )}
              <div className="space-y-2">
                {(alerts.data || []).map((a) => (
                  <div key={a.id} className="border border-border rounded-lg px-3 py-2 text-sm">
                    <div className="font-semibold">{a.identifier}</div>
                    <div className="text-muted">Thresh: {a.threshold_minutes} min</div>
                    <div className="text-muted">URL: {a.callback_url}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <SkyMap position={activeData?.position} track={view === 'satellite' ? satTrack.data : null} userLat={lat} userLon={lon} />
          <Timeline
            rise={activeData?.next_moonrise_local || activeData?.next_rise_local}
            best={activeData?.best_observation_time_local}
            set={activeData?.next_moonset_local || activeData?.next_set_local}
            fmtTime={fmtTime}
          />
        </div>
      )}

      {view === 'moon' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <StatCard label="Max altitude" value={activeData?.max_altitude_deg ? `${activeData.max_altitude_deg}°` : '—'} sub={fmtTime(activeData?.time_of_max_altitude_local)} />
            <StatCard label="Illumination" value={activeData?.illumination_percent ? `${activeData.illumination_percent}%` : '—'} sub={activeData?.phase_hint} />
            <StatCard label="Days until next rise" value={activeData?.days_until_next_rise ?? '—'} />
          </div>
        </>
      )}

      {view === 'planet' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard label={`Planet (${planet}) state`} value={planetQ.data?.visibility_state || '—'} sub={`Rise ${planetQ.data?.rises_in || '—'} · Set ${planetQ.data?.sets_in || '—'}`} />
          <StatCard label="Distance" value={planetQ.data?.position?.distance_km ? `${Math.round(planetQ.data.position.distance_km)} km` : '—'} />
          <StatCard label="Altitude now" value={planetQ.data?.position?.altitude != null ? `${planetQ.data.position.altitude}°` : '—'} />
        </div>
      )}

      {loading && <div className="text-sm text-muted">Loading…</div>}
    </div>
  );
}
