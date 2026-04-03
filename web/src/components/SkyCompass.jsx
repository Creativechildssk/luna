export default function SkyCompass({ azimuth, altitude, direction }) {
  const az = typeof azimuth === "number" ? azimuth % 360 : null;
  const alt = typeof altitude === "number" ? altitude : null;
  const markerX = az != null ? 50 + 40 * Math.sin((az * Math.PI) / 180) : 50;
  const markerY = az != null ? 50 - 40 * Math.cos((az * Math.PI) / 180) : 50;

  return (
    <div className="card p-4 flex items-center gap-4">
      <div className="text-sm text-muted w-20">Direction</div>
      <svg viewBox="0 0 100 100" className="w-24 h-24">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#3b4252" strokeWidth="2" />
        <text x="50" y="12" textAnchor="middle" fontSize="8" fill="#8899a6">N</text>
        <text x="50" y="98" textAnchor="middle" fontSize="8" fill="#8899a6">S</text>
        <text x="5" y="53" textAnchor="start" fontSize="8" fill="#8899a6">W</text>
        <text x="95" y="53" textAnchor="end" fontSize="8" fill="#8899a6">E</text>
        {az != null && (
          <line x1="50" y1="50" x2={markerX} y2={markerY} stroke="#4fd1c5" strokeWidth="3" strokeLinecap="round" />
        )}
        <circle cx="50" cy="50" r="2" fill="#4fd1c5" />
      </svg>
      <div className="text-sm text-muted">
        <div className="text-lg font-semibold">{direction || (az != null ? `${Math.round(az)}°` : "—")}</div>
        <div>Alt: {alt != null ? `${alt}°` : "—"}</div>
      </div>
    </div>
  );
}
