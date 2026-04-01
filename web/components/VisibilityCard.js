export default function VisibilityCard({ title, data }) {
  if (!data) return null;
  const badgeColor =
    data.visibility_state === 'visible'
      ? 'var(--success)'
      : data.visibility_state === 'rising_soon'
      ? 'var(--warn)'
      : data.visibility_state === 'setting_soon'
      ? 'var(--warn)'
      : 'var(--muted)';

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <span className="badge" style={{ background: badgeColor, color: '#0c1117' }}>
          {data.visibility_state}
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        <span className="chip">Rise: {data.rises_in ?? '-'}</span>
        <span className="chip">Set: {data.sets_in ?? '-'}</span>
        <span className="chip">Best: {data.best_observation_time_local ?? '-'}</span>
        <span className="chip">State: {data.status_message ?? '-'}</span>
        <span className="chip">Phase: {data.phase_hint ?? '-'}</span>
        <span className="chip">Night: {data.is_night ? 'Yes' : 'No'}</span>
      </div>
      <div style={{ marginTop: 10 }}>
        <div>Direction: {data.position?.direction_label ?? data.position?.direction}</div>
        <div>
          Az {data.position?.azimuth}°, Alt {data.position?.altitude}°
        </div>
      </div>
    </div>
  );
}
