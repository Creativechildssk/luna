import { motion } from "framer-motion";

export default function MoonPhaseVisual({ illumination = 0, phase_hint = "", latitude = null }) {
  const percent = Math.min(Math.max(illumination, 0), 100);
  const isWaxing = phase_hint.toLowerCase().includes("waxing");
  const isSouthernHemisphere = typeof latitude === "number" && latitude < 0;
  const hemisphereLabel = isSouthernHemisphere ? "Southern hemisphere" : "Northern hemisphere";
  const shadowWidth = Math.max(0, Math.min(100, 100 - percent));
  const shadowSide = isWaxing
    ? (isSouthernHemisphere ? "right" : "left")
    : (isSouthernHemisphere ? "left" : "right");

  return (
    <div className="card p-5 flex items-center gap-6">
      <div className="relative w-40 h-40 shrink-0">
        <div className="absolute inset-0 rounded-full bg-[#1e2530] shadow-[inset_0_0_30px_rgba(0,0,0,0.45)]" />
        <motion.div
          key={`${percent}-${isWaxing}`}
          className="absolute inset-0 rounded-full bg-yellow-200"
          style={{ opacity: 0.96 }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.95 }}
          transition={{ duration: 0.6 }}
        />
        {shadowWidth > 0 && (
          <motion.div
            key={`shadow-${percent}-${isWaxing}`}
            className="absolute top-0 bottom-0 rounded-full bg-[#0b1119]"
            style={{
              width: `${shadowWidth}%`,
              [shadowSide]: 0,
              boxShadow: shadowSide === "left" ? "10px 0 16px rgba(0,0,0,0.45)" : "-10px 0 16px rgba(0,0,0,0.45)",
            }}
            initial={{ opacity: 0.2 }}
            animate={{ opacity: 0.92 }}
            transition={{ duration: 0.5 }}
          />
        )}
        <div className="absolute inset-0 rounded-full border border-white/20" />
      </div>
      <div className="space-y-1">
        <div className="text-lg text-muted">Phase</div>
        <div className="text-3xl font-semibold capitalize">{phase_hint || "—"}</div>
        <div className="text-lg text-muted">{percent.toFixed(1)}% illuminated</div>
        <div className="text-xs text-muted">{hemisphereLabel}</div>
      </div>
    </div>
  );
}
