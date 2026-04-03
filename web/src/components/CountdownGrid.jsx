import StatCard from './StatCard';

export default function CountdownGrid({ data, fmtTime }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard label="Next Rise" value={data?.rises_in} sub={fmtTime(data?.next_moonrise_local || data?.next_rise_local)} />
      <StatCard label="Next Set" value={data?.sets_in} sub={fmtTime(data?.next_moonset_local || data?.next_set_local)} />
      <StatCard label="Best View" value={formatMinutes(data?.minutes_until_best)} sub={fmtTime(data?.best_observation_time_local)} />
      <StatCard label="Duration" value={formatDuration(data?.visible_duration_minutes)} sub="Visibility window" />
    </div>
  );
}

function formatMinutes(mins) {
  if (mins === null || mins === undefined) return '—';
  const sign = mins < 0 ? '-' : '';
  const abs = Math.abs(mins);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return sign + (h ? `${h}h ${m}m` : `${m}m`);
}

function formatDuration(mins) {
  if (!mins) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}
