export default function StatCard({ label, value, sub, loading }) {
  return (
    <div className="card p-3">
      <div className="text-sm text-muted">{label}</div>
      <div className="text-xl font-semibold">
        {loading ? <Skeleton width="70%" /> : value ?? "—"}
      </div>
      {sub && <div className="text-xs text-muted mt-1">{loading ? <Skeleton width="50%" /> : sub}</div>}
    </div>
  );
}

function Skeleton({ width = "100%" }) {
  return <div className="bg-slate-700/40 h-4 rounded animate-pulse" style={{ width }} />;
}
