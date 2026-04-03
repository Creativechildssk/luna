export default function Timeline({ rise, best, set, fmtTime }) {
  const events = [
    { t: rise, label: 'Rise' },
    { t: best, label: 'Best' },
    { t: set, label: 'Set' },
  ].filter((e) => e.t);

  const parsed = parseTimes(rise, best, set);

  return (
    <div className="card p-4 space-y-3">
      <div className="text-sm text-muted mb-1">Timeline (next window)</div>

      {parsed && (
        <div className="relative h-3 rounded-full bg-slate-700/40 overflow-hidden mb-2">
          <div
            className="absolute left-0 top-0 h-full bg-accent/40"
            style={{ width: `${parsed.progressPct}%` }}
          />
          <Marker label="Rise" left={0} />
          <Marker label="Set" left={100} />
          {parsed.bestPct != null && <Marker label="Best" left={parsed.bestPct} color="#fbbf24" />}
          {parsed.nowPct != null && <Marker label="Now" left={parsed.nowPct} color="#e2e8f0" />}
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto text-sm">
        {events.map((e) => (
          <div key={e.label} className="min-w-[140px] px-3 py-2 rounded-lg border border-border bg-[#0f1620]">
            <div className="text-muted text-xs uppercase tracking-wide">{e.label}</div>
            <div className="font-semibold">{fmtTime ? fmtTime(e.t) : e.t}</div>
          </div>
        ))}
        {!events.length && <div className="text-muted">No events in window.</div>}
      </div>
    </div>
  );
}

function parseTimes(rise, best, set) {
  if (!rise || !set) return null;
  const riseTs = Date.parse(rise);
  const setTs = Date.parse(set);
  if (Number.isNaN(riseTs) || Number.isNaN(setTs) || setTs <= riseTs) return null;
  const now = Date.now();
  const total = setTs - riseTs;
  const nowPct = now >= riseTs && now <= setTs ? ((now - riseTs) / total) * 100 : null;
  const bestPct = best ? ((Date.parse(best) - riseTs) / total) * 100 : null;
  const progressPct = nowPct != null ? nowPct : 0;
  return {
    progressPct: clamp(progressPct, 0, 100),
    nowPct: nowPct != null ? clamp(nowPct, 0, 100) : null,
    bestPct: bestPct != null ? clamp(bestPct, 0, 100) : null,
  };
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function Marker({ label, left, color = '#34d399' }) {
  return (
    <div
      className="absolute -top-2 flex flex-col items-center text-[10px] text-muted"
      style={{ left: `${left}%`, transform: 'translateX(-50%)' }}
    >
      <div
        className="w-2 h-2 rounded-full border border-slate-900"
        style={{ backgroundColor: color }}
      />
      <span className="mt-1">{label}</span>
    </div>
  );
}
