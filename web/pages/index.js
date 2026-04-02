import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import LocationPicker from '@/components/LocationPicker';
import VisibilityCard from '@/components/VisibilityCard';

const TrackMap = dynamic(() => import('@/components/TrackMap'), { ssr: false });

export default function Home() {
  const [lat, setLat] = useState(null);
  const [lon, setLon] = useState(null);
  const [planet, setPlanet] = useState('mars');
  const [sat, setSat] = useState('ISS');

  const moon = useSWR(lat && lon ? ['moon', lat, lon] : null, () => api.moonWindow(lat, lon));
  const planetWin = useSWR(lat && lon ? ['planet', planet, lat, lon] : null, () =>
    api.planetWindow(planet, lat, lon)
  );
  const satWin = useSWR(lat && lon ? ['satwin', sat, lat, lon] : null, () =>
    api.satelliteWindow(sat, lat, lon, 24)
  );
  const satTrack = useSWR(sat ? ['track', sat] : null, () => api.satelliteTrack(sat, 1, 60));

  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000', []);

  return (
    <div className="container">
      <header className="top">
        <div>
          <div className="eyebrow">LUNA v1.0.0</div>
          <h1>Sky Window</h1>
          <p className="muted">Moon, planets, satellites · visibility, rise/set, best time.</p>
        </div>
        <div className="pill">API: {apiBase}</div>
      </header>

      <LocationPicker
        onChange={(la, lo) => {
          setLat(la);
          setLon(lo);
        }}
      />

      <div className="card">
        <div className="row">
          <label className="field">
            <span>Planet</span>
            <select value={planet} onChange={(e) => setPlanet(e.target.value)}>
              {['mercury', 'venus', 'mars', 'jupiter', 'saturn'].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Satellite (name or NORAD)</span>
            <input value={sat} onChange={(e) => setSat(e.target.value)} placeholder="ISS or NORAD ID" />
          </label>
        </div>
      </div>

      <div className="grid">
        <VisibilityCard title="Moon" data={moon.data} loading={moon.isLoading} />
        <VisibilityCard title={`Planet: ${planet}`} data={planetWin.data} loading={planetWin.isLoading} />
        <VisibilityCard title={`Satellite: ${sat}`} data={satWin.data} loading={satWin.isLoading} />
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Satellite track (next pass)</h3>
          <span className="muted small">First 60 minutes, 1-min step</span>
        </div>
        <TrackMap track={satTrack.data} loading={satTrack.isLoading} />
      </div>
    </div>
  );
}
