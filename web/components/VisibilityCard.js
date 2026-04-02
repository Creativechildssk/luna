import SummaryBlock from './SummaryBlock';

export default function VisibilityCard({ title, data, loading }) {
  if (loading) {
    return (
      <div className="card">
        <div className="card-head">
          <h3>{title}</h3>
          <span className="badge">...</span>
        </div>
        <div className="muted small">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card">
        <div className="card-head">
          <h3>{title}</h3>
          <span className="badge">--</span>
        </div>
        <div className="muted small">Awaiting coordinates.</div>
      </div>
    );
  }

  const badgeColor =
    data.visibility_state === 'visible'
      ? 'var(--success)'
      : data.visibility_state === 'rising_soon' || data.visibility_state === 'setting_soon'
      ? 'var(--warn)'
      : 'var(--muted)';

  return (
    <div className="card">
      <div className="card-head">
        <h3>{title}</h3>
        <span className="badge" style={{ background: badgeColor, color: '#0c1117' }}>
          {data.visibility_state ?? '--'}
        </span>
      </div>
      <SummaryBlock
        items={[
          ['Visible now', data.visible_now ? 'Yes' : 'No'],
          ['Rises in', data.rises_in ?? '—'],
          ['Sets in', data.sets_in ?? '—'],
          ['Best local', data.best_observation_time_local ?? '—'],
          ['Duration', data.visible_duration_minutes ? `${data.visible_duration_minutes} min` : '—'],
          ['Status', data.status_message ?? '—'],
          ['Phase', data.phase_hint ?? '—'],
          ['Night?', data.is_night ? 'Yes' : 'No'],
          [
            'Direction',
            data.position
              ? `${data.position.direction_label ?? data.position.direction} · Az ${data.position.azimuth}°, Alt ${data.position.altitude}°`
              : '—',
          ],
        ]}
      />
    </div>
  );
}
