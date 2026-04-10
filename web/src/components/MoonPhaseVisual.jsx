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
    <div className="card p-4 flex flex-col xl:flex-row items-center xl:items-start gap-4 min-h-[180px]">
      <div className="relative w-28 h-28 md:w-32 md:h-32 shrink-0">
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

      <div className="flex-1 min-w-0 text-center xl:text-left">
        <div className="text-xs text-muted uppercase tracking-widest">Phase</div>
        <div className="mt-1 text-base md:text-lg font-semibold leading-snug capitalize text-slate-100">
          {phase_hint || '—'}
        </div>
        <div className="mt-2 text-3xl md:text-4xl leading-none font-bold tracking-tight text-accent">
          {percent.toFixed(0)}%
        </div>
        <div className="mt-1 text-sm md:text-base text-slate-400">illuminated</div>
        <div className="mt-2 text-xs md:text-sm text-slate-500">{hemisphereLabel}</div>
      </div>
    </div>
  );
}
