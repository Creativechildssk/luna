import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import LocationPicker from './components/LocationPicker';
import CountdownGrid from './components/CountdownGrid';
import MoonPhaseVisual from './components/MoonPhaseVisual';
import SkyCompass from './components/SkyCompass';
import SkyMap from './components/SkyMap';
import Timeline from './components/Timeline';
import StatCard from './components/StatCard';
import SelectionBar from './components/SelectionBar';
import SatelliteList from './components/SatelliteList';
import ErrorBanner from './components/ErrorBanner';
import QualityCard from './components/QualityCard';
import ARQuickView from './components/ARQuickView';
import StatusDot from './components/StatusDot';

export default function App() {
  const [lat, setLat] = useState(null);
  const [lon, setLon] = useState(null);
  const [planet, setPlanet] = useState('mars');
  const [sat, setSat] = useState('ISS');
  const [view, setView] = useState('moon'); // moon | planet | satellite
  const [satRange, setSatRange] = useState('today'); // today|tomorrow|week|month
  const [satSearch, setSatSearch] = useState('');
  const [showAR, setShowAR] = useState(false);

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
    queryKey: ['satList', lat, lon, satRange],
    queryFn: () => api.satelliteVisible(
      lat,
      lon,
      satRange === 'today' ? 24 : satRange === 'tomorrow' ? 48 : satRange === 'week' ? 168 : 720,
      10
    ),
    enabled: !!lat && !!lon && view === 'satellite',
    staleTime: 60_000,
  });
  const satTrack = useQuery({
    queryKey: ['satTrack', sat],
    queryFn: () => api.satelliteTrack(sat, 1, 60),
    enabled: !!sat,
    staleTime: 60_000,
  });
  const weather = useQuery({
    queryKey: ['weather', lat, lon],
    queryFn: () => api.weather(lat, lon),
    enabled: !!lat && !!lon,
    staleTime: 15 * 60_000,
  });

  const activeData = view === 'moon' ? moon.data : view === 'planet' ? planetQ.data : satQ.data;
  const activeError = view === 'moon' ? moon.error : view === 'planet' ? planetQ.error : satQ.error;
  const activeRetry = view === 'moon' ? moon.refetch : view === 'planet' ? planetQ.refetch : satQ.refetch;
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

  const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
  const backendStatus = activeError ? 'error' : loading ? 'loading' : 'ok';
  const statusTooltip = activeError
    ? `Backend error: ${activeError.message}`
    : loading
    ? 'Contacting backend…'
    : `Backend OK (${apiBase})`;

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
  const quality = useMemo(() => computeQuality(activeData, weather.data), [activeData, weather.data]);

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
    <div className="max-w-[1400px] mx-auto px-6 py-4 space-y-5 dashboard">
      <header className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-xs text-muted uppercase tracking-wide">LUNA v1.0.0</div>
          <h1 className="text-2xl font-bold">Sky Window</h1>
          <div className="text-sm text-muted">Moon · planets · satellites · visibility and best time to look</div>
        </div>
        <StatusDot status={backendStatus} label="API" message={statusTooltip} />
      </header>

      <div className="card p-2">
        <div className="flex gap-2 overflow-x-auto">
          {[
            { key: 'moon', label: 'Moon' },
            { key: 'planet', label: 'Planets' },
            { key: 'satellite', label: 'Satellites' },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`flex-1 min-w-[100px] px-3 py-2 rounded-lg border border-border text-center ${
                view === tab.key ? 'bg-accent text-slate-900' : 'bg-transparent'
              }`}
              onClick={() => setView(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeError && <ErrorBanner message={`Failed to load data: ${activeError.message}`} onRetry={activeRetry} />}
      {view === 'satellite' && satList.error && (
        <ErrorBanner message={`Satellites list error: ${satList.error.message}`} onRetry={satList.refetch} />
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

      <div className="grid grid-cols-1 md:grid-cols-5 stats-grid gap-3 stats-grid">
        <div className="card p-4 space-y-2">
          <div className="text-sm text-muted">Visibility</div>
          <div className="text-lg font-semibold">{summary.visible ? 'Visible now' : 'Below horizon'}</div>
          <div className="text-sm text-muted">
            Az {fmtDeg(summary.azimuth)}, Alt {fmtDeg(summary.altitude)}, Dir {summary.direction || '—'}
          </div>
          <div className="text-sm text-muted">
            Distance {summary.distance_km ? `${Math.round(summary.distance_km)} km` : '—'}
          </div>
          {summary.azimuth != null && (
            <button
              className="mt-2 text-xs px-3 py-1 rounded-lg border border-border inline-flex items-center gap-1"
              onClick={() => setShowAR(true)}
            >
              📷 AR view
            </button>
          )}
        </div>

        <MoonPhaseVisual illumination={summary.illum} phase_hint={summary.phase || view} />

        <SkyCompass azimuth={summary.azimuth} altitude={summary.altitude} direction={summary.direction} />

        <div className="card p-4 space-y-2">
          <div className="text-sm text-muted">Status</div>
          <div className="text-base">{summary.status || 'Set a location to load data.'}</div>
          <div className="text-xs text-muted">State: {summary.state || '—'}</div>
          <div className="text-xs text-muted">Night? {summary.is_night ? 'Yes' : 'No'}</div>
        </div>

        <QualityCard score={quality.score} label={quality.label} details={quality.details || weatherDetails(weather.data)} />
      </div>

      <CountdownGrid data={activeData} fmtTime={fmtTime} />

      {view === 'satellite' ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 metric-grid">
            <div className="lg:col-span-2">
              <SkyMap position={activeData?.position} track={satTrack.data} userLat={lat} userLon={lon} />
            </div>
            <div className="card p-4 space-y-2">
              <div className="text-sm text-muted mb-1">Satellite data ({sat})</div>
              <div className="text-lg font-semibold">{activeData?.visibility_state || '—'}</div>
              <div className="text-sm text-muted">Rise {activeData?.rises_in || '—'} · Set {activeData?.sets_in || '—'}</div>
              <div className="text-sm text-muted">Alt {fmtDeg(activeData?.position?.altitude)} · Dir {activeData?.position?.direction || '—'}</div>
              <div className="text-sm text-muted">Distance {activeData?.position?.distance_km ? `${Math.round(activeData.position.distance_km)} km` : '—'}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 metric-grid items-start">
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
              <SatelliteList title={`Satellites in next ${satRange}`} list={filteredSatList} onSelect={setSat} loading={satList.isLoading} />
            </div>
            <div className="card p-4 space-y-2">
              <div className="text-sm text-muted">Alerts</div>
              {alerts.isLoading && <div className="text-sm text-muted">Loading…</div>}
              {!alerts.isLoading && (!alerts.data || alerts.data.length === 0) && <div className="text-sm text-muted">None</div>}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard label="Max altitude" value={activeData?.max_altitude_deg != null ? fmtDeg(activeData.max_altitude_deg) : '—'} sub={fmtTime(activeData?.time_of_max_altitude_local)} />
          <StatCard label="Illumination" value={activeData?.illumination_percent ? `${activeData.illumination_percent}%` : '—'} sub={activeData?.phase_hint} />
          <StatCard label="Days until next rise" value={activeData?.days_until_next_rise ?? '—'} />
        </div>
      )}

      {view === 'planet' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard label={`Planet (${planet}) state`} value={planetQ.data?.visibility_state || '—'} sub={`Rise ${planetQ.data?.rises_in || '—'} · Set ${planetQ.data?.sets_in || '—'}`} />
          <StatCard label="Distance" value={planetQ.data?.position?.distance_km ? `${Math.round(planetQ.data.position.distance_km)} km` : '—'} />
          <StatCard label="Altitude now" value={planetQ.data?.position?.altitude != null ? fmtDeg(planetQ.data.position.altitude) : '—'} />
        </div>
      )}

      {loading && <div className="text-sm text-muted">Loading…</div>}

      <footer className="text-sm text-muted pt-4 border-t border-border flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1">
          <span role="img" aria-label="moon">🌙</span>
          LUNA v1.0.0
        </span>
        <span className="text-muted">•</span>
        <span className="inline-flex items-center gap-1">
          <span role="img" aria-label="rocket">🚀</span>
          Powered by WFd DeepTech Labs
        </span>
        <span className="text-muted">•</span>
        <span className="inline-flex items-center gap-1">
          <span role="img" aria-label="cloud">☁️</span>
          Open-Meteo weather
        </span>
      </footer>

      {showAR && (
        <ARQuickView
          azimuth={summary.azimuth}
          altitude={summary.altitude}
          onClose={() => setShowAR(false)}
        />
      )}
    </div>
  );
}

function computeQuality(data, weather) {
  if (!data) return { score: null, label: '', details: '' };
  let score = 0;

  if (data.visible_now) score += 30;
  else if (data.visibility_state === 'rising_soon') score += 15;
  else if (data.visibility_state === 'setting_soon') score += 10;

  if (typeof data.position?.altitude === 'number') {
    score += Math.max(-20, Math.min(30, data.position.altitude));
  }

  if (data.is_night === true) score += 20;
  else score -= 10;

  if (typeof data.illumination_percent === 'number') {
    const illum = data.illumination_percent;
    if (illum >= 30 && illum <= 85) score += 15;
    else score += 5;
  }

  if (typeof data.position?.distance_km === 'number') {
    if (data.position.distance_km < 380000) score += 5;
  }

  const cloud = extractCurrentCloudCover(weather);
  if (cloud != null) {
    if (cloud < 20) score += 15;
    else if (cloud < 50) score += 5;
    else score -= 15;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Poor';
  return { score, label, details: '' };
}

function extractCurrentCloudCover(weather) {
  try {
    if (weather?.current_weather && typeof weather.current_weather.cloudcover === 'number') {
      return weather.current_weather.cloudcover;
    }
    if (weather?.hourly?.cloudcover?.length) return weather.hourly.cloudcover[0];
  } catch (e) {
    return null;
  }
  return null;
}

function weatherDetails(weather) {
  const cloud = extractCurrentCloudCover(weather);
  if (cloud == null) return '';
  const quality = cloud < 20 ? 'Clear sky' : cloud < 50 ? 'Partly cloudy' : 'Cloudy';
  return `${quality} • Cloud cover ${cloud}%`;
}

function fmtDeg(val) {
  if (val === null || val === undefined) return '—';
  return `${val}°`;
}


