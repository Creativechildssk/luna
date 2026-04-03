import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function SkyMapLeaflet({ position, track, userLat, userLon }) {
  const center = userLat != null && userLon != null ? [userLat, userLon] : [0, 0];

  return (
    <div className="h-72 rounded-lg overflow-hidden border border-border">
      <MapContainer center={[0, 0]} zoom={2} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {userLat != null && userLon != null && <Marker position={[userLat, userLon]} />}
        {track?.points && (
          <Polyline positions={track.points.map((p) => [p.lat, p.lon])} pathOptions={{ color: '#4fd1c5', weight: 3 }} />
        )}
        {track?.points?.[0] && <Marker position={[track.points[0].lat, track.points[0].lon]} />}
      </MapContainer>
    </div>
  );
}
