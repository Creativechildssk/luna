import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { api } from "../api";

const MAX_HISTORY = 12;
const PLANET_BODIES = ["mercury", "venus", "mars", "jupiter", "saturn"];

export default function ARQuickView({
  azimuth,
  altitude,
  targetLabel,
  statusText,
  userLat,
  userLon,
  targetType,
  targetId,
  liveIdentifyEnabled = true,
  onClose,
}) {
  const [heading, setHeading] = useState(null);
  const [pitch, setPitch] = useState(null);
  const [offsets, setOffsets] = useState({ az: 0, alt: 0 });
  const [compassAccuracy, setCompassAccuracy] = useState(null);
  const [supportMsg, setSupportMsg] = useState("");
  const [orientationEnabled, setOrientationEnabled] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cinemaMode, setCinemaMode] = useState(false);
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
      const screenAngle = getScreenOrientationAngle();
      const rawHeading = getHeadingFromEvent(e, screenAngle);
      const rawPitch = getPitchFromEvent(e, screenAngle);

      if (typeof rawHeading === "number") {
        historyRef.current = [...historyRef.current.slice(-(MAX_HISTORY - 1)), rawHeading];
        const nextHeading = smoothCircularValue(headingRef.current, rawHeading, 0.18);
        headingRef.current = nextHeading;
        setHeading(nextHeading);
        setCalibration(getCalibrationState(historyRef.current));
      }

      if (typeof e.webkitCompassAccuracy === "number") {
        setCompassAccuracy(Math.max(0, e.webkitCompassAccuracy));
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

  const targetLive = useQuery({
    queryKey: ["arTarget", targetType, targetId, userLat, userLon],
    queryFn: async () => {
      if (targetType === "moon") return api.moonPosition(userLat, userLon);
      if (targetType === "planet") return api.planetPosition(targetId, userLat, userLon);
      if (targetType === "satellite") return api.satellitePosition(targetId, userLat, userLon);
      return null;
    },
    enabled: typeof userLat === "number" && typeof userLon === "number" && ["moon", "planet", "satellite"].includes(targetType),
    refetchInterval: targetType === "satellite" ? 2000 : 6000,
    staleTime: 1000,
  });

  const livePos = useMemo(() => extractPosition(targetLive.data), [targetLive.data]);
  const targetAzimuth = livePos?.azimuth ?? azimuth;
  const targetAltitude = livePos?.altitude ?? altitude;

  const rawDeltaAz = heading != null && targetAzimuth != null ? normalize(targetAzimuth - heading) : null;
  const rawDeltaAlt = targetAltitude != null && pitch != null ? targetAltitude - pitch : targetAltitude != null ? targetAltitude : null;
  const deltaAz = rawDeltaAz == null ? null : normalize(rawDeltaAz + offsets.az);
  const deltaAlt = rawDeltaAlt == null ? null : rawDeltaAlt + offsets.alt;
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
  const compassTone = compassAccuracy == null ? "text-slate-300" : compassAccuracy <= 12 ? "text-emerald-300" : compassAccuracy <= 25 ? "text-amber-200" : "text-red-200";
  const targetName = targetLabel || "Target";
  const statusLine = useMemo(() => compactStatus(statusText), [statusText]);
  const liveSat = useQuery({
    queryKey: ["arLiveIdentify", userLat, userLon],
    queryFn: () => api.satelliteVisible(userLat, userLon, 6, 25),
    enabled: liveIdentifyEnabled && typeof userLat === "number" && typeof userLon === "number",
    refetchInterval: 6000,
    staleTime: 5000,
  });
  const liveMoon = useQuery({
    queryKey: ["arLiveMoon", userLat, userLon],
    queryFn: () => api.moonPosition(userLat, userLon),
    enabled: liveIdentifyEnabled && typeof userLat === "number" && typeof userLon === "number",
    refetchInterval: 6000,
    staleTime: 5000,
  });
  const livePlanets = useQueries({
    queries: PLANET_BODIES.map((body) => ({
      queryKey: ["arLivePlanet", body, userLat, userLon],
      queryFn: () => api.planetPosition(body, userLat, userLon),
      enabled: liveIdentifyEnabled && typeof userLat === "number" && typeof userLon === "number",
      refetchInterval: 6000,
      staleTime: 5000,
    })),
  });

  const liveSatMatches = useMemo(() => {
    if (!liveIdentifyEnabled || heading == null || pitch == null || !Array.isArray(liveSat.data)) return [];

    const aimAz = normalize360(heading);
    const aimAlt = pitch;

    return liveSat.data
      .filter((item) => item?.position && typeof item.position.azimuth === "number" && typeof item.position.altitude === "number")
      .map((item) => {
        const satAz = normalize360(item.position.azimuth);
        const satAlt = item.position.altitude;
        return {
          name: item.satellite,
          kind: "satellite",
          state: item.visibility_state,
          visibleNow: item.visible_now,
          angularDistance: angularDistanceDeg(aimAz, aimAlt, satAz, satAlt),
          altitude: satAlt,
        };
      })
      .filter((item) => item.altitude > -5)
      .sort((a, b) => a.angularDistance - b.angularDistance)
      .slice(0, 3);
  }, [heading, pitch, liveSat.data, liveIdentifyEnabled]);

  const liveMoonMatch = useMemo(() => {
    if (!liveIdentifyEnabled || heading == null || pitch == null) return null;
    if (typeof liveMoon.data?.azimuth !== "number" || typeof liveMoon.data?.altitude !== "number") return null;

    const aimAz = normalize360(heading);
    const aimAlt = pitch;
    const moonAz = normalize360(liveMoon.data.azimuth);
    const moonAlt = liveMoon.data.altitude;

    if (moonAlt <= -5) return null;

    return {
      name: "Moon",
      kind: "moon",
      angularDistance: angularDistanceDeg(aimAz, aimAlt, moonAz, moonAlt),
      altitude: moonAlt,
    };
  }, [heading, pitch, liveMoon.data, liveIdentifyEnabled]);

  const livePlanetMatches = useMemo(() => {
    if (!liveIdentifyEnabled || heading == null || pitch == null) return [];

    const aimAz = normalize360(heading);
    const aimAlt = pitch;
    const matches = [];

    for (let i = 0; i < PLANET_BODIES.length; i += 1) {
      const body = PLANET_BODIES[i];
      const payload = livePlanets[i]?.data;
      if (typeof payload?.azimuth !== "number" || typeof payload?.altitude !== "number") continue;
      if (payload.altitude <= -5) continue;

      matches.push({
        name: capitalize(body),
        kind: "planet",
        angularDistance: angularDistanceDeg(aimAz, aimAlt, normalize360(payload.azimuth), payload.altitude),
        altitude: payload.altitude,
      });
    }

    return matches.sort((a, b) => a.angularDistance - b.angularDistance).slice(0, 3);
  }, [heading, pitch, livePlanets, liveIdentifyEnabled]);

  const liveCandidates = useMemo(() => {
    const all = [];
    if (liveMoonMatch) all.push(liveMoonMatch);
    all.push(...livePlanetMatches);
    all.push(...liveSatMatches);
    return all.sort((a, b) => a.angularDistance - b.angularDistance).slice(0, 4);
  }, [liveMoonMatch, livePlanetMatches, liveSatMatches]);

  const bestDetected = useMemo(() => {
    const top = liveCandidates[0];
    if (!top) return null;
    return top.angularDistance <= detectionThreshold(top.kind) ? top : null;
  }, [liveCandidates]);

  const liveHasPlanetError = livePlanets.some((q) => q.error);
  const livePlanetLoading = livePlanets.some((q) => q.isLoading);
  const liveStatusText = !liveIdentifyEnabled
    ? "Live identify is disabled in slider menu."
    : !(typeof userLat === "number" && typeof userLon === "number")
    ? "Live identify needs location access. Set location and try again."
    : liveSat.isLoading || liveMoon.isLoading || livePlanetLoading
    ? "Scanning moon, planets, and satellites..."
    : liveSat.error || liveMoon.error || liveHasPlanetError
    ? "Live identify unavailable right now."
    : bestDetected
    ? `Detected ${bestDetected.name} (${bestDetected.angularDistance.toFixed(1)}° from aim)`
    : "No close sky object match. Could be aircraft, meteor, or distant object.";

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="relative w-screen h-[100dvh] overflow-hidden bg-black text-white">
        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
        {!cameraReady && <div className="absolute inset-0 bg-slate-950/85" />}
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-transparent to-black/70" />

        <div className="absolute inset-0 pointer-events-none">
          {!cinemaMode && (
            <div
              className="absolute left-3 right-3 md:left-6 md:right-6 flex items-start justify-between gap-3"
              style={{ top: "max(12px, env(safe-area-inset-top))" }}
            >
              <div className="rounded-2xl bg-slate-950/62 border border-white/10 px-3 py-2 max-w-[76%]">
                <div className="text-[10px] uppercase tracking-[0.22em] text-slate-300">AR Guide</div>
                <div className="text-xl md:text-2xl font-semibold leading-tight">{targetName}</div>
                <div className="text-xs md:text-sm text-slate-300 leading-snug">{statusLine || "Use the reticle to align with target."}</div>
              </div>

              <div className="rounded-2xl bg-slate-950/62 border border-white/10 px-3 py-2 text-right min-w-[96px]">
                <div className="text-[10px] uppercase tracking-wide text-slate-300">Heading</div>
                <div className="text-lg font-semibold tabular-nums">{heading != null ? `${heading.toFixed(0)}°` : "—"}</div>
                <div className={`text-xs ${confidenceTone}`}>Compass {calibration.level}</div>
                <div className={`text-[11px] ${compassTone}`}>
                  {compassAccuracy == null ? "Sensor quality unknown" : `Accuracy ±${Math.round(compassAccuracy)}°`}
                </div>
              </div>
            </div>
          )}

          {cinemaMode && (
            <div
              className="absolute left-3 rounded-xl bg-slate-950/58 border border-white/10 px-3 py-1.5"
              style={{ top: "max(12px, env(safe-area-inset-top))" }}
            >
              <div className="text-xs text-slate-200">{targetName} · {heading != null ? `${heading.toFixed(0)}°` : "—"}</div>
              {liveIdentifyEnabled && bestDetected && (
                <div className="text-[11px] text-slate-300 mt-0.5">Detected: {bestDetected.name} · {bestDetected.angularDistance.toFixed(1)}°</div>
              )}
            </div>
          )}

          {liveIdentifyEnabled && bestDetected && (
            <div className="absolute left-1/2 -translate-x-1/2 top-[18%] rounded-xl bg-emerald-500/20 border border-emerald-300/45 px-3 py-1.5 text-center shadow-[0_0_20px_rgba(16,185,129,0.22)]">
              <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-100">Detected</div>
              <div className="text-sm font-semibold text-emerald-50">{bestDetected.name}</div>
            </div>
          )}

          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="absolute border-t border-dashed border-white/40 w-[56vw] md:w-[40vw] max-w-[360px]"
              style={{ transform: `translateY(${pitch != null ? Math.max(-90, Math.min(90, pitch)) * 1.45 : 0}px)` }}
            />
            <div className="absolute w-24 h-24 md:w-32 md:h-32 rounded-full border border-white/45" />
            <div className="absolute w-3 h-3 rounded-full bg-white/80" />
            <div className="absolute w-10 h-px bg-white/60" />
            <div className="absolute w-px h-10 bg-white/60" />
            <div
              className="absolute w-5 h-5 rounded-full border-2 border-[#f6ad55] bg-[#f6ad55]/20 shadow-[0_0_20px_rgba(246,173,85,0.78)]"
              style={{ transform: `translate(${reticle.x}px, ${reticle.y}px)` }}
            />
          </div>

          {!cinemaMode && (
            <div
              className="absolute left-3 right-3 md:left-6 md:right-6 grid grid-cols-1 sm:grid-cols-3 gap-2"
              style={{ bottom: "max(12px, env(safe-area-inset-bottom))" }}
            >
              <div className="rounded-xl bg-slate-950/68 border border-white/10 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wide text-slate-300">Horizontal</div>
                <div className="text-base font-semibold leading-tight">{dirText || "Waiting for heading"}</div>
                <div className="text-xs text-slate-400">Az {targetAzimuth != null ? `${targetAzimuth.toFixed(0)}°` : "—"}</div>
              </div>
              <div className="rounded-xl bg-slate-950/68 border border-white/10 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wide text-slate-300">Vertical</div>
                <div className="text-base font-semibold leading-tight">{altText || "Waiting for tilt"}</div>
                <div className="text-xs text-slate-400">Alt {targetAltitude != null ? `${targetAltitude.toFixed(0)}°` : "—"}</div>
              </div>
              <div className="rounded-xl bg-slate-950/68 border border-white/10 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wide text-slate-300">Calibration</div>
                <div className={`text-sm font-medium leading-tight ${confidenceTone}`}>{calibration.text}</div>
                <div className="mt-1 text-[11px] text-slate-400">
                  {targetLive.isFetching ? "Updating target..." : targetLive.error ? "Using last known target" : "Live target sync active"}
                </div>
              </div>

              <div className="rounded-xl bg-slate-950/68 border border-white/10 px-3 py-2 sm:col-span-3">
                <div className="text-[10px] uppercase tracking-wide text-slate-300">Live Identify</div>
                <div className="text-sm font-medium text-slate-100 leading-tight">{liveStatusText}</div>
                {liveIdentifyEnabled && liveCandidates.length > 0 && (
                  <div className="mt-1 text-xs text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
                    {liveCandidates.map((item) => (
                      <span key={`${item.kind}-${item.name}`}>{item.name}: {item.angularDistance.toFixed(1)}°</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div
          className="absolute right-3 md:right-6 flex items-center gap-2 pointer-events-auto"
          style={{ top: "max(12px, env(safe-area-inset-top))" }}
        >
          <button className="px-3 py-2 rounded-xl bg-slate-900/85 text-white border border-white/20 text-sm" onClick={() => setCinemaMode((v) => !v)}>
            {cinemaMode ? "HUD" : "Cinema"}
          </button>
          {!orientationEnabled && (
            <button className="px-3 py-2 rounded-xl bg-slate-900/85 text-white border border-white/20 text-sm" onClick={enableOrientation}>
              Enable compass
            </button>
          )}
          {orientationEnabled && rawDeltaAz != null && rawDeltaAlt != null && (
            <button
              className="px-3 py-2 rounded-xl bg-slate-900/85 text-white border border-white/20 text-sm"
              onClick={() => setOffsets({ az: -rawDeltaAz, alt: -rawDeltaAlt })}
            >
              Set center
            </button>
          )}
          {orientationEnabled && (offsets.az !== 0 || offsets.alt !== 0) && (
            <button
              className="px-3 py-2 rounded-xl bg-slate-900/85 text-white border border-white/20 text-sm"
              onClick={() => setOffsets({ az: 0, alt: 0 })}
            >
              Reset cal
            </button>
          )}
          <button className="px-3 py-2 rounded-xl bg-slate-900/85 text-white border border-white/20 text-sm" onClick={onClose}>Close</button>
        </div>

        {supportMsg && (
          <div
            className="absolute left-3 right-3 md:left-6 md:right-6 pointer-events-none"
            style={{ top: "calc(max(12px, env(safe-area-inset-top)) + 84px)" }}
          >
            <div className="rounded-xl border border-red-300/35 bg-red-900/35 px-3 py-2 text-sm text-red-100">{supportMsg}</div>
          </div>
        )}
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

function getHeadingFromEvent(event, screenAngle = 0) {
  if (typeof event.webkitCompassHeading === "number") {
    return normalize360(event.webkitCompassHeading);
  }
  if (typeof event.alpha === "number") {
    return normalize360(360 - event.alpha + screenAngle);
  }
  return null;
}

function getPitchFromEvent(event, screenAngle = 0) {
  if (typeof event.beta !== "number" && typeof event.gamma !== "number") {
    return null;
  }

  const angle = normalizeRightAngle(screenAngle);
  let pitch;

  if (angle === 90) {
    pitch = typeof event.gamma === "number" ? -event.gamma : event.beta;
  } else if (angle === 270) {
    pitch = typeof event.gamma === "number" ? event.gamma : event.beta;
  } else if (angle === 180) {
    pitch = typeof event.beta === "number" ? -event.beta : null;
  } else {
    pitch = event.beta;
  }

  if (typeof pitch !== "number") return null;
  return Math.max(-85, Math.min(85, pitch));
}

function getScreenOrientationAngle() {
  if (typeof window === "undefined") return 0;
  if (window.screen?.orientation && typeof window.screen.orientation.angle === "number") {
    return window.screen.orientation.angle;
  }
  if (typeof window.orientation === "number") {
    return window.orientation;
  }
  return 0;
}

function normalizeRightAngle(angle) {
  const normalized = normalize360(angle);
  if (normalized >= 315 || normalized < 45) return 0;
  if (normalized < 135) return 90;
  if (normalized < 225) return 180;
  return 270;
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

function compactStatus(statusText) {
  if (!statusText) return "";
  const line = String(statusText).split(/\r?\n/).map((part) => part.trim()).filter(Boolean)[0] || "";
  if (!line) return "";
  return line.length > 92 ? `${line.slice(0, 89)}...` : line;
}

function angularDistanceDeg(az1, alt1, az2, alt2) {
  const a1 = (az1 * Math.PI) / 180;
  const e1 = (alt1 * Math.PI) / 180;
  const a2 = (az2 * Math.PI) / 180;
  const e2 = (alt2 * Math.PI) / 180;

  const sin1 = Math.sin(e1);
  const sin2 = Math.sin(e2);
  const cos1 = Math.cos(e1);
  const cos2 = Math.cos(e2);
  const cosDeltaAz = Math.cos(a1 - a2);
  const cosD = Math.max(-1, Math.min(1, sin1 * sin2 + cos1 * cos2 * cosDeltaAz));
  return (Math.acos(cosD) * 180) / Math.PI;
}

function extractPosition(payload) {
  if (!payload || typeof payload !== "object") return null;

  if (payload.position && typeof payload.position.azimuth === "number" && typeof payload.position.altitude === "number") {
    return {
      azimuth: payload.position.azimuth,
      altitude: payload.position.altitude,
    };
  }

  if (typeof payload.azimuth === "number" && typeof payload.altitude === "number") {
    return {
      azimuth: payload.azimuth,
      altitude: payload.altitude,
    };
  }

  return null;
}

function detectionThreshold(kind) {
  if (kind === "satellite") return 9;
  if (kind === "planet") return 8;
  return 8;
}

function capitalize(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}
