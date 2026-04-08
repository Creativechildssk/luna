export default function QuickSliderMenu({ items, selectedKey, onSelect }) {
  return (
    <div className="card p-2">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.map((item) => {
          const selected = selectedKey === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              className={`min-w-[180px] text-left rounded-xl border px-3 py-2 transition ${
                selected
                  ? 'border-cyan-300/60 bg-cyan-300/12 text-cyan-100'
                  : 'border-border bg-[#0d1826]/70 text-slate-200 hover:border-cyan-400/40'
              }`}
            >
              <div className="text-sm font-semibold flex items-center gap-2">
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/20 text-slate-300">
                    {item.badge}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 mt-1 leading-snug">{item.description}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
