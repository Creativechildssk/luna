import { useEffect, useMemo, useRef, useState } from "react";

const MAX_HISTORY = 12;

export default function ARQuickView({ azimuth, altitude, targetLabel, statusText, onClose }) {
  const [heading, setHeading] = useState(null);
  const [pitch, setPitch] = useState(null);
  const [supportMsg, setSupportMsg] = useState("");
  const [orientationEnabled, setOrientationEnabled] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [calibration, setCalibration] = useState({ level: "waiting", text: "Enable compass to begin calibration." });
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const headingRef = useRef(null);
  const pitchRef = useRef(null);
  const historyRef = useRef([]);

  useEffect(() => {
    async function startCam() {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setSupportMsg("Camera API is not available in this browser.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraReady(true);
      } catch (e) {
        setSupportMsg("Camera unavailable: " + e.message);
      }
    }
    startCam();
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function enableOrientation() {
    try {
      if (typeof window === "undefined" || typeof window.DeviceOrientationEvent === "undefined") {
        setSupportMsg("Device orientation is not available in this browser.");
        return;
      }

      if (typeof window.DeviceOrientationEvent.requestPermission === "function") {
        const permission = await window.DeviceOrientationEvent.requestPermission();
        if (permission !== "granted") {
          setSupportMsg("Compass permission was denied.");
          return;
        }
      }

      setOrientationEnabled(true);
      setSupportMsg("");
    } catch (e) {
      setSupportMsg("Compass unavailable: " + e.message);
    }
  }

  useEffect(() => {
    if (!orientationEnabled) {
      return undefined;
    }

    function handleOrient(e) {
      const rawHeading = getHeadingFromEvent(e);
      const rawPitch = getPitchFromEvent(e);

      if (typeof rawHeading === "number") {
        historyRef.current = [...historyRef.current.slice(-(MAX_HISTORY - 1)), rawHeading];
        const nextHeading = smoothCircularValue(headingRef.current, rawHeading, 0.18);
        headingRef.current = nextHeading;
        setHeading(nextHeading);
        setCalibration(getCalibrationState(historyRef.current));
      }

      if (typeof rawPitch === "number") {
        const nextPitch = smoothLinearValue(pitchRef.current, rawPitch, 0.22);
        pitchRef.current = nextPitch;
        setPitch(nextPitch);
      }
    }

    window.addEventListener("deviceorientation", handleOrient, true);
    return () => window.removeEventListener("deviceorientation", handleOrient, true);
  }, [orientationEnabled]);

  const deltaAz = heading != null && azimuth != null ? normalize(azimuth - heading) : null;
  const deltaAlt = altitude != null && pitch != null ? altitude - pitch : altitude != null ? altitude : null;
  const dirText = useMemo(() => {
    if (deltaAz == null) return "";
    if (Math.abs(deltaAz) < 4) return "Heading aligned";
    return deltaAz > 0 ? `Turn right ${Math.abs(deltaAz).toFixed(0)}°` : `Turn left ${Math.abs(deltaAz).toFixed(0)}°`;
  }, [deltaAz]);
  const altText = useMemo(() => {
    if (deltaAlt == null) return "";
    if (Math.abs(deltaAlt) < 4) return "Altitude aligned";
    return deltaAlt > 0 ? `Raise phone ${Math.abs(deltaAlt).toFixed(0)}°` : `Lower phone ${Math.abs(deltaAlt).toFixed(0)}°`;
  }, [deltaAlt]);
  const reticle = useMemo(() => buildReticlePosition(deltaAz, deltaAlt), [deltaAz, deltaAlt]);
  const confidenceTone = calibration.level === "good" ? "text-emerald-300" : calibration.level === "fair" ? "text-amber-200" : "text-red-200";
  const targetName = targetLabel || "Target";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl rounded-2xl overflow-hidden border border-border bg-[#0f1620] shadow-2xl">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-80 object-cover" />
        {!cameraReady && <div className="absolute inset-0 bg-slate-950/70" />}
        <div className="absolute inset-0 pointer-events-none text-white drop-shadow-lg">
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-950/80 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950/90 to-transparent" />

          <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-3">
            <div className="rounded-xl bg-slate-950/60 border border-white/10 px-4 py-3 max-w-[70%]">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-300">AR Guide</div>
              <div className="text-xl font-semibold">{targetName}</div>
              <div className="text-sm text-slate-300">{statusText || "Use the reticle to line up with the target."}</div>
            </div>
            <div className="rounded-xl bg-slate-950/60 border border-white/10 px-3 py-2 text-right">
              <div className="text-xs text-slate-300">Heading</div>
              <div className="text-lg font-semibold">{heading != null ? `${heading.toFixed(0)}°` : "—"}</div>
              <div className={`text-xs ${confidenceTone}`}>Compass {calibration.level}</div>
            </div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="absolute left-1/2 right-1/2 border-t border-dashed border-white/35"
              style={{ transform: `translateY(${pitch != null ? Math.max(-90, Math.min(90, pitch)) * 1.6 : 0}px)` }}
            />
            <div className="absolute w-24 h-24 rounded-full border border-white/40" />
            <div className="absolute w-3 h-3 rounded-full bg-white/70" />
            <div className="absolute w-10 h-px bg-white/50" />
            <div className="absolute w-px h-10 bg-white/50" />
            <div
              className="absolute w-5 h-5 rounded-full border-2 border-[#f6ad55] bg-[#f6ad55]/15 shadow-[0_0_18px_rgba(246,173,85,0.75)]"
              style={{ transform: `translate(${reticle.x}px, ${reticle.y}px)` }}
            />
          </div>

          <div className="absolute bottom-4 left-4 right-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-950/65 border border-white/10 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-slate-300">Horizontal</div>
              <div className="text-lg font-semibold">{dirText || "Waiting for heading"}</div>
              <div className="text-xs text-slate-400">Target azimuth {azimuth != null ? `${azimuth.toFixed(0)}°` : "—"}</div>
            </div>
            <div className="rounded-xl bg-slate-950/65 border border-white/10 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-slate-300">Vertical</div>
              <div className="text-lg font-semibold">{altText || "Waiting for tilt"}</div>
              <div className="text-xs text-slate-400">Target altitude {altitude != null ? `${altitude.toFixed(0)}°` : "—"}</div>
            </div>
            <div className="rounded-xl bg-slate-950/65 border border-white/10 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-slate-300">Calibration</div>
              <div className={`text-sm font-medium ${confidenceTone}`}>{calibration.text}</div>
              <div className="text-xs text-slate-400">Move the phone in a slow figure-8 if the reticle drifts.</div>
            </div>
          </div>
        </div>
        <div className="absolute top-2 right-2 flex gap-2 pointer-events-auto">
          {!orientationEnabled && (
            <button className="px-3 py-1 rounded-lg bg-slate-900/80 text-white border border-border" onClick={enableOrientation}>
              Enable compass
            </button>
          )}
          <button className="px-3 py-1 rounded-lg bg-slate-900/80 text-white border border-border" onClick={onClose}>Close</button>
        </div>
        {supportMsg && <div className="p-3 text-sm text-red-200">{supportMsg}</div>}
      </div>
    </div>
  );
}

function normalize(angle) {
  let a = angle % 360;
  if (a > 180) a -= 360;
  if (a < -180) a += 360;
  return a;
}

function getHeadingFromEvent(event) {
  if (typeof event.webkitCompassHeading === "number") {
    return normalize360(event.webkitCompassHeading);
  }
  if (typeof event.alpha === "number") {
    return normalize360(360 - event.alpha);
  }
  return null;
}

function getPitchFromEvent(event) {
  if (typeof event.beta !== "number") {
    return null;
  }
  return Math.max(-85, Math.min(85, event.beta));
}

function normalize360(value) {
  let angle = value % 360;
  if (angle < 0) angle += 360;
  return angle;
}

function smoothCircularValue(previous, next, factor) {
  if (previous == null) return normalize360(next);
  return normalize360(previous + normalize(next - previous) * factor);
}

function smoothLinearValue(previous, next, factor) {
  if (previous == null) return next;
  return previous + (next - previous) * factor;
}

function getCalibrationState(history) {
  if (history.length < 4) {
    return { level: "waiting", text: "Collecting compass samples..." };
  }

  const deltas = history.slice(1).map((value, index) => Math.abs(normalize(value - history[index])));
  const avgDelta = deltas.reduce((sum, value) => sum + value, 0) / deltas.length;

  if (history.length >= 8 && avgDelta <= 6) {
    return { level: "good", text: "Compass looks stable." };
  }
  if (avgDelta <= 14) {
    return { level: "fair", text: "Compass is usable. Recalibrate if guidance drifts." };
  }
  return { level: "poor", text: "Compass is noisy. Move the phone in a figure-8." };
}

function buildReticlePosition(deltaAz, deltaAlt) {
  const x = deltaAz == null ? 0 : Math.max(-120, Math.min(120, deltaAz * 4));
  const y = deltaAlt == null ? 0 : Math.max(-140, Math.min(140, deltaAlt * -4));
  return { x, y };
}
