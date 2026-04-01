import { useEffect, useState } from 'react';

export default function LocationPicker({ onChange }) {
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Try geolocation once on mount
    if (!navigator.geolocation) return;
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude.toFixed(6));
        setLon(longitude.toFixed(6));
        onChange(latitude, longitude);
        setBusy(false);
      },
      () => setBusy(false),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="row" style={{ gap: 12 }}>
        <div className="col">
          <label>Latitude</label>
          <input
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="e.g. 11.553447"
            inputMode="decimal"
          />
        </div>
        <div className="col">
          <label>Longitude</label>
          <input
            value={lon}
            onChange={(e) => setLon(e.target.value)}
            placeholder="e.g. 76.132094"
            inputMode="decimal"
          />
        </div>
      </div>
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <button
          onClick={() => onChange(parseFloat(lat), parseFloat(lon))}
          disabled={!lat || !lon}
        >
          Use location
        </button>
        <button
          onClick={() => {
            if (!navigator.geolocation) {
              setError('Geolocation not available in this browser');
              return;
            }
            setBusy(true);
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const { latitude, longitude } = pos.coords;
                setLat(latitude.toFixed(6));
                setLon(longitude.toFixed(6));
                onChange(latitude, longitude);
                setBusy(false);
              },
              (err) => {
                setError(err.message);
                setBusy(false);
              },
              { enableHighAccuracy: true, timeout: 5000 }
            );
          }}
          disabled={busy}
        >
          {busy ? 'Locating…' : 'Locate me'}
        </button>
      </div>
      {error && <div style={{ color: '#f56565', marginTop: 6 }}>{error}</div>}
    </div>
  );
}
