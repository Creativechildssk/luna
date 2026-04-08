import { useEffect, useMemo, useState } from "react";

function normalizeGeoError(err) {
  if (!err) return "Unable to fetch location.";

  // Safari can return opaque CoreLocation errors like kCLErrorDomain error 0.
  if (String(err.message || "").includes("kCLErrorDomain")) {
    return "Safari could not determine your position. Ensure Location Services are enabled for Safari and try again.";
  }

  if (err.code === 1) return "Location permission denied. Allow location access for this site in Safari settings.";
  if (err.code === 2) return "Location unavailable. Check GPS/Wi-Fi and try again.";
  if (err.code === 3) return "Location request timed out. Turn on Precise Location for Safari, keep Wi-Fi/mobile data on, and retry.";

  return err.message || "Unable to fetch location.";
}

function requestCurrentPosition() {
  const strictOptions = { enableHighAccuracy: true, timeout: 25000, maximumAge: 0 };
  const fallbackOptions = { enableHighAccuracy: false, timeout: 12000, maximumAge: 0 };

  function getPosition(options) {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }

  return getPosition(strictOptions).catch(async () => {
    // Fallback if high-accuracy lock is not available quickly.
    return getPosition(fallbackOptions);
  });
}

export default function LocationPicker({ onChange }) {
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const isSecure = typeof window !== "undefined" && (window.isSecureContext || window.location.hostname === "localhost");

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
          🔍<span className="hidden sm:inline"> Apply</span>
        </button>
        <button
          className="px-3 py-2 rounded-lg border border-border inline-flex items-center gap-2 md:mt-6"
          onClick={async () => {
            if (!canUseGeo) {
              setMsg("Geolocation not available in this context.");
              return;
            }
            setBusy(true);
            try {
              const pos = await requestCurrentPosition();
              const { latitude, longitude, accuracy } = pos.coords;

              // Ignore very poor fixes that can place users far away.
              if (typeof accuracy === "number" && accuracy > 2500) {
                setMsg("Location fix is too coarse right now (>2.5 km). Move near open sky and tap Locate again.");
                return;
              }

              setLat(latitude.toFixed(6));
              setLon(longitude.toFixed(6));
              onChange(latitude, longitude);
              const accuracyMsg = typeof accuracy === "number" ? ` (${Math.round(accuracy)} m)` : "";
              setMsg(`Refreshed from browser${accuracyMsg}`);
            } catch (err) {
              setMsg(normalizeGeoError(err));
            } finally {
              setBusy(false);
            }
          }}
          disabled={busy || !canUseGeo}
          title={canUseGeo ? "Use browser location" : "Geolocation blocked on HTTP"}
        >
          {busy ? "⏳" : "🎯"}<span className="hidden sm:inline"> Locate</span>
        </button>
      </div>
      {msg && <div className="text-sm text-muted">{msg}</div>}
    </div>
  );
}
