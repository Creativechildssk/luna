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
    <div className="card p-4 md:p-6 flex items-center justify-between gap-4 md:gap-8 overflow-hidden">
      <div className="relative w-40 h-40 md:w-52 md:h-52 shrink-0">
        <div className="absolute inset-0 rounded-full bg-[#151d28] shadow-[inset_0_0_40px_rgba(0,0,0,0.55)]" />
        <motion.div
          key={`${percent}-${isWaxing}`}
          className="absolute inset-0 rounded-full bg-[#e2ea88]"
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
              boxShadow: shadowSide === "left" ? "12px 0 20px rgba(0,0,0,0.52)" : "-12px 0 20px rgba(0,0,0,0.52)",
            }}
            initial={{ opacity: 0.2 }}
            animate={{ opacity: 0.92 }}
            transition={{ duration: 0.5 }}
          />
        )}
        <div className="absolute inset-0 rounded-full border border-white/18" />
        <div className="absolute inset-0 rounded-full shadow-[0_0_60px_rgba(226,234,136,0.12)]" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-2xl md:text-3xl text-slate-300">Phase:</div>
        <div className="mt-1 text-3xl md:text-5xl font-semibold leading-tight capitalize text-slate-100 break-words">
          {phase_hint || "—"}
        </div>
        <div className="mt-2 md:mt-3 text-6xl md:text-8xl leading-none font-semibold tracking-tight text-slate-300">
          {percent.toFixed(0)}%
        </div>
        <div className="mt-1 text-2xl md:text-4xl text-slate-400">illuminated</div>
        <div className="mt-2 text-xs md:text-sm text-slate-500">{hemisphereLabel}</div>
      </div>
    </div>
  );
}
