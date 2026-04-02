export default function SummaryBlock({ items }) {
  return (
    <div className="summary">
      {items.map(([label, value]) => (
        <div key={label} className="summary-row">
          <div className="muted small">{label}</div>
          <div>{value}</div>
        </div>
      ))}
    </div>
  );
}
