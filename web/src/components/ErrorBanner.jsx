export default function ErrorBanner({ message, onRetry }) {
  return (
    <div className="card p-3 border border-red-500 text-red-200 text-sm flex items-center justify-between gap-3">
      <span>{message}</span>
      {onRetry && (
        <button
          className="px-3 py-1 rounded-lg border border-red-400 text-red-100 hover:bg-red-500/10"
          onClick={onRetry}
        >
          Retry
        </button>
      )}
    </div>
  );
}
