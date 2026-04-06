export default function QualityCard({ score, label, details }) {
  return (
    <div className="card p-4 space-y-2">
      <div className="text-sm text-muted">Viewing score</div>
      <div className="text-2xl font-semibold">{score != null ? `${score}/100` : "—"}</div>
      <div className="text-sm text-muted">{label || ""}</div>
      {details && <div className="text-xs text-muted">{details}</div>}
    </div>
  );
}
