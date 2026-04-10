export default function StatCard({ label, value, sub, loading, accent }) {
  return (
    <div className={`card p-4 flex flex-col gap-1 ${accent ? 'border-cyan-400/30' : ''}`}>
      <div className="text-xs text-muted uppercase tracking-widest font-medium">{label}</div>
      <div className={`text-2xl font-bold tracking-tight mt-1 leading-none ${accent ? 'text-cyan-300' : 'text-slate-100'}`}>
        {loading ? <Skeleton width="70%" /> : value ?? '—'}
      </div>
      {sub && (
        <div className="text-xs text-slate-500 mt-1.5">
          {loading ? <Skeleton width="50%" /> : sub}
        </div>
      )}
    </div>
  );
}

function Skeleton({ width = '100%' }) {
  return <div className="bg-slate-700/40 h-4 rounded animate-pulse" style={{ width }} />;
}
