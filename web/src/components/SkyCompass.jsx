export default function SkyCompass({ azimuth, altitude, direction }) {
  const az = typeof azimuth === "number" ? azimuth % 360 : null;
  const alt = typeof altitude === "number" ? altitude : null;
  const markerX = az != null ? 50 + 45 * Math.sin((az * Math.PI) / 180) : 50;
  const markerY = az != null ? 50 - 45 * Math.cos((az * Math.PI) / 180) : 50;

  return (
    <div className="card p-5 flex items-center gap-6">
      <div className="text-sm text-muted w-24">Direction</div>
      <svg viewBox="0 0 100 100" className="w-32 h-32">
        <circle cx="50" cy="50" r="42" fill="none" stroke="#3b4252" strokeWidth="2" />
        <text x="50" y="10" textAnchor="middle" fontSize="8" fill="#8899a6">N</text>
        <text x="50" y="99" textAnchor="middle" fontSize="8" fill="#8899a6">S</text>
        <text x="6" y="55" textAnchor="start" fontSize="8" fill="#8899a6">W</text>
        <text x="94" y="55" textAnchor="end" fontSize="8" fill="#8899a6">E</text>
        {az != null && (
          <line x1="50" y1="50" x2={markerX} y2={markerY} stroke="#4fd1c5" strokeWidth="4" strokeLinecap="round" />
        )}
        <circle cx="50" cy="50" r="3" fill="#4fd1c5" />
      </svg>
      <div className="text-sm text-muted">
        <div className="text-lg font-semibold">{direction || (az != null ? `${Math.round(az)}°` : "—")}</div>
        <div>Alt: {alt != null ? `${alt}°` : "—"}</div>
      </div>
    </div>
  );
}
