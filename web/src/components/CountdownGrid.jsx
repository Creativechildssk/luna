import { useEffect, useState } from "react";
import StatCard from "./StatCard";

export default function CountdownGrid({ data, fmtTime }) {
  const riseCountdown = useCountdown(data?.minutes_until_rise);
  const setCountdown = useCountdown(data?.minutes_until_set);
  const bestCountdown = useCountdown(data?.minutes_until_best);

  const loading = !data;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        label="Next Rise"
        value={riseCountdown ?? data?.rises_in}
        sub={fmtTime(data?.next_moonrise_local || data?.next_rise_local)}
        loading={loading}
      />
      <StatCard
        label="Next Set"
        value={setCountdown ?? data?.sets_in}
        sub={fmtTime(data?.next_moonset_local || data?.next_set_local)}
        loading={loading}
      />
      <StatCard
        label="Best View"
        value={bestCountdown ?? formatMinutes(data?.minutes_until_best)}
        sub={fmtTime(data?.best_observation_time_local)}
        loading={loading}
      />
      <StatCard
        label="Duration"
        value={formatDuration(data?.visible_duration_minutes)}
        sub="Visibility window"
        loading={loading}
      />
    </div>
  );
}

function useCountdown(minutes) {
  const [seconds, setSeconds] = useState(null);

  useEffect(() => {
    if (minutes === null || minutes === undefined) {
      setSeconds(null);
      return undefined;
    }
    const initial = Math.max(0, Math.round(minutes * 60));
    setSeconds(initial);
    const id = setInterval(() => {
      setSeconds((prev) => (prev === null ? prev : Math.max(0, prev - 1)));
    }, 1000);
    return () => clearInterval(id);
  }, [minutes]);

  if (seconds === null) return null;
  return formatSeconds(seconds);
}

function formatSeconds(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatMinutes(mins) {
  if (mins === null || mins === undefined) return "—";
  const sign = mins < 0 ? "-" : "";
  const abs = Math.abs(mins);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return sign + (h ? `${h}h ${m}m` : `${m}m`);
}

function formatDuration(mins) {
  if (!mins && mins !== 0) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}
