export default function SatelliteList({ title, list, onSelect, loading }) {
  return (
    <div className="card p-3 space-y-2">
      <div className="text-sm text-muted">{title}</div>
      {loading && <div className="text-sm text-muted">Loading...</div>}
      {!loading && (!list || list.length === 0) && <div className="text-sm text-muted">None found</div>}
      <div className="divide-y divide-border">
        {(list || []).map((sat) => (
          <button
            key={sat.satellite}
            className="w-full text-left py-2 hover:bg-white/5 rounded-lg px-2"
            onClick={() => onSelect(sat.identifier || sat.satellite)}
          >
            <div className="font-semibold">{sat.satellite}</div>
            <div className="text-xs text-muted">
              State: {sat.visibility_state} • Alt {fmtDeg(sat.position?.altitude)} • Dir {sat.position?.direction || '—'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function fmtDeg(val) {
  if (val === null || val === undefined) return '—';
  return `${val}\u00b0`;
}
