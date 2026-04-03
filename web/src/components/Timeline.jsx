export default function Timeline({ rise, best, set }) {
  const events = [
    { t: rise, label: 'Rise' },
    { t: best, label: 'Best' },
    { t: set, label: 'Set' },
  ].filter((e) => e.t);

  return (
    <div className="card p-4">
      <div className="text-sm text-muted mb-2">Timeline (next window)</div>
      <div className="flex gap-4 overflow-x-auto text-sm">
        {events.map((e) => (
          <div key={e.label} className="min-w-[140px] px-3 py-2 rounded-lg border border-border bg-[#0f1620]">
            <div className="text-muted text-xs uppercase tracking-wide">{e.label}</div>
            <div className="font-semibold">{e.t}</div>
          </div>
        ))}
        {!events.length && <div className="text-muted">No events in window.</div>}
      </div>
    </div>
  );
}
