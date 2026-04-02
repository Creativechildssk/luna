import { useEffect, useState } from 'react';

export default function LocationPicker({ onChange }) {
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!navigator.geolocation) return;
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude.toFixed(6));
        setLon(longitude.toFixed(6));
        onChange(latitude, longitude);
        setBusy(false);
        setMessage('Auto-detected from browser');
      },
      (err) => {
        setBusy(false);
        setMessage(err.message);
      },
      { enableHighAccuracy: true, timeout: 4000 }
    );
  }, [onChange]);

  return (
    <div className="card">
      <div className="row">
        <label className="field">
          <span>Latitude</span>
          <input
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="e.g. 11.553447"
            inputMode="decimal"
          />
        </label>
        <label className="field">
          <span>Longitude</span>
          <input
            value={lon}
            onChange={(e) => setLon(e.target.value)}
            placeholder="e.g. 76.132094"
            inputMode="decimal"
          />
        </label>
      </div>
      <div className="row">
        <button
          onClick={() => {
            setMessage('');
            onChange(parseFloat(lat), parseFloat(lon));
          }}
          disabled={!lat || !lon}
        >
          Use location
        </button>
        <button
          onClick={() => {
            if (!navigator.geolocation) {
              setMessage('Geolocation not available.');
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
                setMessage('Refreshed from browser');
              },
              (err) => {
                setMessage(err.message);
                setBusy(false);
              },
              { enableHighAccuracy: true, timeout: 5000 }
            );
          }}
          disabled={busy}
        >
          {busy ? 'Locating...' : 'Locate me'}
        </button>
      </div>
      {message && <div className="muted small">{message}</div>}
    </div>
  );
}
