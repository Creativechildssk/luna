import { useState } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import LocationPicker from '@/components/LocationPicker';
import VisibilityCard from '@/components/VisibilityCard';
import TrackMap from '@/components/TrackMap';

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
    api.satelliteWindow(sat, lat, lon, 12)
  );
  const satTrack = useSWR(sat ? ['sattrack', sat] : null, () => api.satelliteTrack(sat, 1, 60));

  return (
    <div className="container">
      <h1>LUNA Sky</h1>
      <p style={{ color: 'var(--muted)' }}>Mobile-first sky window for Moon, planets, and satellites.</p>

      <LocationPicker onChange={(la, lo) => {
        setLat(la);
        setLon(lo);
      }} />

      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <label>Planet</label>
          <select value={planet} onChange={(e) => setPlanet(e.target.value)}>
            {['mercury','venus','mars','jupiter','saturn'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <label>Satellite</label>
          <input value={sat} onChange={(e) => setSat(e.target.value)} placeholder="ISS or NORAD ID" />
        </div>
      </div>

      <div className="row">
        <div className="col"><VisibilityCard title="Moon" data={moon.data} /></div>
        <div className="col"><VisibilityCard title={`Planet: ${planet}`} data={planetWin.data} /></div>
        <div className="col"><VisibilityCard title={`Satellite: ${sat}`} data={satWin.data} /></div>
      </div>

      <div style={{ marginTop: 12 }}>
        <TrackMap track={satTrack.data} />
      </div>
    </div>
  );
}
