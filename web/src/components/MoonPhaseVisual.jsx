import { motion } from "framer-motion";

export default function MoonPhaseVisual({ illumination = 0, phase_hint = "" }) {
  const percent = Math.min(Math.max(illumination, 0), 100);
  const isWaxing = phase_hint.toLowerCase().includes("waxing");

  return (
    <div className="card p-4 flex items-center gap-4">
      <div className="relative w-28 h-28">
        <div className="absolute inset-0 rounded-full bg-slate-900" />
        <motion.div
          key={`${percent}-${isWaxing}`}
          className="absolute inset-0 rounded-full bg-yellow-200"
          style={{
            clipPath: `inset(0% ${isWaxing ? 100 - percent : 0}% 0% ${isWaxing ? 0 : 100 - percent}%)`,
            opacity: 0.9,
          }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.9 }}
          transition={{ duration: 0.6 }}
        />
      </div>
      <div>
        <div className="text-sm text-muted">Phase</div>
        <div className="text-xl font-semibold">{phase_hint || "—"}</div>
        <div className="text-sm text-muted">{percent.toFixed(1)}% illuminated</div>
      </div>
    </div>
  );
}
