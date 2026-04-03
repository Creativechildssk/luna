export default function SatelliteList({ list, onSelect, loading }) {
  return (
    <div className="card p-4">
      <div className="text-sm text-muted mb-2">Satellites in next 12h</div>
      {loading && <div className="text-sm text-muted">Loading…</div>}
      {!loading && (!list || list.length === 0) && <div className="text-sm text-muted">None found (backend may be down or no passes).</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {(list || []).map((sat) => (
          <button
            key={sat.satellite}
            className="text-left border border-border rounded-lg px-3 py-2 bg-[#0f1620] hover:border-accent"
            onClick={() => onSelect && onSelect(sat.satellite)}
          >
            <div className="font-semibold">{sat.satellite}</div>
            <div className="text-xs text-muted">
              {sat.visible_now ? 'Visible now' : sat.rises_in ? `Rises ${sat.rises_in}` : 'No rise in window'}
            </div>
            <div className="text-xs text-muted">
              State: {sat.visibility_state} · Alt {sat.position?.altitude ?? '—'}°
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
