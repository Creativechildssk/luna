const planetOptions = ['mercury', 'venus', 'mars', 'jupiter', 'saturn'];

export default function SelectionBar({ view, planet, onPlanetChange, sat, onSatChange }) {
  return (
    <div className="card p-3 flex flex-wrap gap-3 items-end">
      {view === 'planet' && (
        <div className="flex flex-col gap-1">
          <label className="text-sm text-muted">Planet</label>
          <select
            className="rounded-lg border border-border bg-[#0f1620] px-3 py-2"
            value={planet}
            onChange={(e) => onPlanetChange(e.target.value)}
          >
            {planetOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      )}

      {view === 'satellite' && (
        <div className="flex flex-col gap-1">
          <label className="text-sm text-muted">Satellite (name or NORAD)</label>
          <input
            className="rounded-lg border border-border bg-[#0f1620] px-3 py-2"
            value={sat}
            onChange={(e) => onSatChange(e.target.value)}
            placeholder="ISS or NORAD ID"
          />
        </div>
      )}
    </div>
  );
}
