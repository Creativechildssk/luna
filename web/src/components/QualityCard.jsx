export default function QualityCard({ score, label, details }) {
  const color =
    score == null ? '#4b5563'
    : score >= 80 ? '#34d399'
    : score >= 60 ? '#38bdf8'
    : score >= 40 ? '#fbbf24'
    : '#f87171';
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const progress = score != null ? (score / 100) * circumference : 0;

  return (
    <div className="card p-4 flex flex-col gap-2">
      <div className="text-xs text-muted uppercase tracking-widest font-medium">Viewing score</div>
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
            <circle cx="32" cy="32" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            <circle
              cx="32" cy="32" r={radius} fill="none"
              stroke={color} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={score != null ? circumference - progress : circumference}
              style={{ transition: 'stroke-dashoffset 0.7s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold" style={{ color }}>
              {score != null ? score : '—'}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="text-base font-semibold text-slate-100">{label || ''}</div>
          {details && <div className="text-xs text-slate-500 leading-snug">{details}</div>}
        </div>
      </div>
    </div>
  );
}
