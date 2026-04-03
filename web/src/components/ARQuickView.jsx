import { useEffect, useState, useRef } from "react";

export default function ARQuickView({ azimuth, altitude, onClose }) {
  const [heading, setHeading] = useState(null);
  const [supportMsg, setSupportMsg] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    async function startCam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (e) {
        setSupportMsg("Camera unavailable: " + e.message);
      }
    }
    startCam();
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    function handleOrient(e) {
      if (e.absolute === false && typeof e.webkitCompassHeading === "number") {
        setHeading(e.webkitCompassHeading);
      } else if (typeof e.alpha === "number") {
        setHeading(360 - e.alpha);
      }
    }
    window.addEventListener("deviceorientation", handleOrient, true);
    return () => window.removeEventListener("deviceorientation", handleOrient, true);
  }, []);

  const deltaAz = heading != null && azimuth != null ? normalize(azimuth - heading) : null;
  const deltaAlt = altitude != null ? altitude : null;
  const dirText = deltaAz != null ? (Math.abs(deltaAz) < 5 ? "On target" : deltaAz > 0 ? `Turn right ${Math.abs(deltaAz).toFixed(0)}°` : `Turn left ${Math.abs(deltaAz).toFixed(0)}°`) : "";
  const altText = deltaAlt != null ? (deltaAlt > 0 ? `Tilt up ${deltaAlt.toFixed(0)}°` : `Tilt down ${Math.abs(deltaAlt).toFixed(0)}°`) : "";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl rounded-2xl overflow-hidden border border-border bg-[#0f1620]">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-80 object-cover" />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-white drop-shadow-lg">
          <div className="text-sm mb-2">Heading: {heading != null ? `${heading.toFixed(0)}°` : '—'}</div>
          <div className="text-2xl font-semibold">Az target {azimuth != null ? `${azimuth.toFixed(0)}°` : '—'}</div>
          <div className="text-lg mt-1">{dirText}</div>
          <div className="text-sm mt-1">{altText}</div>
        </div>
        <div className="absolute top-2 right-2 flex gap-2 pointer-events-auto">
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
