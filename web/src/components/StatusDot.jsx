export default function StatusDot({ status = 'ok', label = 'API', message = '' }) {
  const dotColor = status === 'error' ? 'bg-danger' : status === 'loading' ? 'bg-warn' : 'bg-success';
  const textColor = status === 'error' ? 'text-danger' : status === 'loading' ? 'text-warn' : 'text-success';
  const pulseClass = status === 'loading' ? 'animate-ping' : 'animate-pulse';

  return (
    <div className="inline-flex items-center gap-2 text-sm text-muted" title={message}>
      <span className="relative flex h-3 w-3">
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 ${dotColor} ${pulseClass}`}></span>
        <span className={`relative inline-flex h-3 w-3 rounded-full border border-border ${dotColor}`}></span>
      </span>
      <span className={`font-semibold ${textColor}`}>{label}</span>
    </div>
  );
}
