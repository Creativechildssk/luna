import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';

function Recenter({ lat, lon, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lon != null) {
      map.setView([lat, lon], zoom ?? 6, { animate: true });
    }
  }, [lat, lon, zoom, map]);
  return null;
}

export default function SkyMapLeaflet({ position, track, userLat, userLon }) {
  const center = userLat != null && userLon != null ? [userLat, userLon] : [0, 0];

  return (
    <div className="h-72 sm:h-80 md:h-96 rounded-lg overflow-hidden border border-border map-container">
      <MapContainer center={center} zoom={userLat != null ? 6 : 2} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Recenter lat={userLat} lon={userLon} zoom={userLat != null ? 6 : 2} />
        {userLat != null && userLon != null && <Marker position={[userLat, userLon]} />}
        {track?.points && (
          <Polyline positions={track.points.map((p) => [p.lat, p.lon])} pathOptions={{ color: '#4fd1c5', weight: 3 }} />
        )}
        {track?.points?.[0] && <Marker position={[track.points[0].lat, track.points[0].lon]} />}
      </MapContainer>
    </div>
  );
}
