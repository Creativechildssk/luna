import { useEffect, useState } from 'react';

export default function LocationPicker({ onChange }) {
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

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
        setMsg('Auto-detected from browser');
      },
      () => setBusy(false),
      { enableHighAccuracy: true, timeout: 4000 }
    );
  }, [onChange]);

  return (
    <div className="card p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-sm text-muted">Latitude</span>
          <input
            className="w-full rounded-lg border border-border bg-[#0f1620] px-3 py-2"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="11.553447"
            inputMode="decimal"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-muted">Longitude</span>
          <input
            className="w-full rounded-lg border border-border bg-[#0f1620] px-3 py-2"
            value={lon}
            onChange={(e) => setLon(e.target.value)}
            placeholder="76.132094"
            inputMode="decimal"
          />
        </label>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button
          className="px-4 py-2 rounded-lg bg-accent text-slate-900 font-semibold"
          onClick={() => onChange(parseFloat(lat), parseFloat(lon))}
          disabled={!lat || !lon}
        >
          Use location
        </button>
        <button
          className="px-4 py-2 rounded-lg border border-border"
          onClick={() => {
            if (!navigator.geolocation) {
              setMsg('Geolocation not available.');
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
                setMsg('Refreshed from browser');
              },
              (err) => {
                setMsg(err.message);
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
      {msg && <div className="text-sm text-muted">{msg}</div>}
    </div>
  );
}
