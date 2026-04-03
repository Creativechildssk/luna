export default function StatCard({ label, value, sub }) {
  return (
    <div className="card p-3">
      <div className="text-sm text-muted">{label}</div>
      <div className="text-xl font-semibold">{value ?? '—'}</div>
      {sub && <div className="text-xs text-muted mt-1">{sub}</div>}
    </div>
  );
}
