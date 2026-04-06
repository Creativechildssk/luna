import { motion } from "framer-motion";

export default function MoonPhaseVisual({ illumination = 0, phase_hint = "" }) {
  const percent = Math.min(Math.max(illumination, 0), 100);
  const isWaxing = phase_hint.toLowerCase().includes("waxing");

  return (
    <div className="card p-5 flex items-center gap-6">
      <div className="relative w-32 h-32">
        <div className="absolute inset-0 rounded-full bg-slate-900" />
        <motion.div
          key={`${percent}-${isWaxing}`}
          className="absolute inset-0 rounded-full bg-yellow-200"
          style={{
            clipPath: `inset(0% ${isWaxing ? 100 - percent : 0}% 0% ${isWaxing ? 0 : 100 - percent}%)`,
            opacity: 0.92,
          }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.92 }}
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
