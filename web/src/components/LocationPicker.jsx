import { useEffect, useMemo, useState } from "react";

export default function LocationPicker({ onChange }) {
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const isSecure = typeof window !== "undefined" && (window.isSecureContext || window.location.hostname === "localhost");

  useEffect(() => {
    if (!isSecure || !navigator.geolocation) return;
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude.toFixed(6));
        setLon(longitude.toFixed(6));
        onChange(latitude, longitude);
        setBusy(false);
        setMsg("Auto-detected from browser");
      },
      (err) => {
        setBusy(false);
        setMsg(err.message);
      },
      { enableHighAccuracy: true, timeout: 4000 }
    );
  }, [onChange, isSecure]);

  useEffect(() => {
    if (!isSecure) {
      setMsg("Browser blocks geolocation on insecure HTTP. Use https or enter lat/lon manually.");
    }
  }, [isSecure]);

  const canUseGeo = useMemo(() => isSecure && typeof navigator !== "undefined" && !!navigator.geolocation, [isSecure]);

  return (
    <div className="card p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end">
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
      <div className="flex gap-2 flex-wrap items-center">
        <button
          className="px-4 py-2 rounded-lg bg-accent text-slate-900 font-semibold inline-flex items-center gap-2 md:mt-6"
          onClick={() => {
            const la = parseFloat(lat);
            const lo = parseFloat(lon);
            if (Number.isFinite(la) && Number.isFinite(lo)) onChange(la, lo);
          }}
          disabled={!lat || !lon}
          title="Apply typed coordinates"
        >
          ?? Apply
        </button>
        <button
          className="px-3 py-2 rounded-lg border border-border inline-flex items-center gap-2 md:mt-6"
          onClick={() => {
            if (!canUseGeo) {
              setMsg("Geolocation not available in this context.");
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
                setMsg("Refreshed from browser");
              },
              (err) => {
                setMsg(err.message);
                setBusy(false);
              },
              { enableHighAccuracy: true, timeout: 5000 }
            );
          }}
          disabled={busy || !canUseGeo}
          title={canUseGeo ? "Use browser location" : "Geolocation blocked on HTTP"}
        >
          {busy ? "? Locating�" : "?? Locate"}
        </button>
      </div>
      {msg && <div className="text-sm text-muted">{msg}</div>}
    </div>
  );
}

