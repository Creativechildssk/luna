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
              className={`min-w-[180px] text-left rounded-xl border px-3 py-2.5 transition-all duration-200 ${
                selected
                  ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-100 shadow-sm shadow-cyan-400/10'
                  : 'border-transparent bg-[#0d1826]/60 text-slate-300 hover:border-slate-600/50 hover:bg-white/[0.03]'
              }`}
            >
              <div className="text-sm font-semibold flex items-center gap-2">
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    item.badge === 'Active'
                      ? 'bg-emerald-400/15 border border-emerald-400/40 text-emerald-300'
                      : 'bg-slate-700/50 border border-slate-600/40 text-slate-400'
                  }`}>
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
