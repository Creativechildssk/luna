import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import { useEffect, useMemo } from "react";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";

// Fix default icon paths in bundled builds
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function Recenter({ lat, lon, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lon != null) {
      map.setView([lat, lon], zoom ?? 6, { animate: true });
    }
  }, [lat, lon, zoom, map]);
  return null;
}


function toTimestamp(isoValue) {
  if (!isoValue) return null;
  const ts = Date.parse(isoValue);
  return Number.isNaN(ts) ? null : ts;
}


function splitTrackSegments(points) {
  if (!points?.length) return [];
  const segments = [];
  let current = [points[0]];
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const next = points[i];
    const jump = Math.abs((next.lon ?? 0) - (prev.lon ?? 0));
    if (jump > 120) {
      if (current.length > 1) segments.push(current);
      current = [next];
    } else {
      current.push(next);
    }
  }
  if (current.length > 1) segments.push(current);
  return segments;
}

export default function SkyMapLeaflet({ position, track, userLat, userLon, passWindow }) {
  const center = userLat != null && userLon != null ? [userLat, userLon] : [0, 0];
  const nowTs = Date.now();
  const riseTs = toTimestamp(passWindow?.nextRiseUtc);
  const setTs = toTimestamp(passWindow?.nextSetUtc);

  const allSegments = useMemo(() => splitTrackSegments(track?.points || []), [track?.points]);

  const passPoints = useMemo(() => {
    if (!track?.points?.length) return [];

    if (passWindow?.visibleNow) {
      if (!setTs) return [];
      return track.points.filter((point) => {
        const pointTs = toTimestamp(point.timestamp_utc);
        return pointTs !== null && pointTs >= nowTs && pointTs <= setTs;
      });
    }

    if (riseTs === null || setTs === null) return [];
    return track.points.filter((point) => {
      const pointTs = toTimestamp(point.timestamp_utc);
      return pointTs !== null && pointTs >= riseTs && pointTs <= setTs;
    });
  }, [track?.points, passWindow?.visibleNow, nowTs, riseTs, setTs]);

  const passSegments = useMemo(() => splitTrackSegments(passPoints), [passPoints]);

  return (
    <div className="h-72 sm:h-80 md:h-96 rounded-lg overflow-hidden border border-border map-container">
      <MapContainer center={center} zoom={userLat != null ? 6 : 2} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Recenter lat={userLat} lon={userLon} zoom={userLat != null ? 6 : 2} />
        {userLat != null && userLon != null && <Marker position={[userLat, userLon]} />} 
        {allSegments.map((segment, index) => (
          <Polyline
            key={`track-${index}`}
            positions={segment.map((p) => [p.lat, p.lon])}
            pathOptions={{ color: "#4fd1c5", weight: 2, opacity: 0.45 }}
          />
        ))}
        {passSegments.map((segment, index) => (
          <Polyline
            key={`pass-${index}`}
            positions={segment.map((p) => [p.lat, p.lon])}
            pathOptions={{ color: "#f6ad55", weight: 4, opacity: 0.95 }}
          />
        ))}
        {track?.points?.[0] && <Marker position={[track.points[0].lat, track.points[0].lon]} />}
      </MapContainer>
    </div>
  );
}
