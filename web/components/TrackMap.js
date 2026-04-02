import dynamic from 'next/dynamic';
import { useMemo } from 'react';

// Defer leaflet to client side
const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then((m) => m.Polyline), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((m) => m.Marker), { ssr: false });

export default function TrackMap({ track, loading }) {
  const points = track?.points ?? [];
  const center = useMemo(() => {
    if (!points.length) return [0, 0];
    return [points[0].lat, points[0].lon];
  }, [points]);

  if (loading) return <div className="muted small">Loading...</div>;
  if (!points.length) return <div className="muted small">No track data.</div>;

  return (
    <div className="map">
      <MapContainer center={center} zoom={2} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Polyline positions={points.map((p) => [p.lat, p.lon])} pathOptions={{ color: '#4fd1c5', weight: 3 }} />
        <Marker position={[points[0].lat, points[0].lon]} />
      </MapContainer>
    </div>
  );
}
