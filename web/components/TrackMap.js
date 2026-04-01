import dynamic from 'next/dynamic';
import { useMemo } from 'react';

// Leaflet needs window; use dynamic import
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then(m => m.Polyline), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });

export default function TrackMap({ track }) {
  const points = track?.points ?? [];
  const center = useMemo(() => {
    if (!points.length) return [0, 0];
    return [points[0].lat, points[0].lon];
  }, [points]);

  if (!points.length) return <div className="card">No track data</div>;

  return (
    <div className="card">
      <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>Track ({track.satellite})</h3>
        <span className="chip">Points: {points.length}</span>
      </div>
      <div className="map-wrapper">
        <MapContainer center={center} zoom={2} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Polyline
            positions={points.map((p) => [p.lat, p.lon])}
            pathOptions={{ color: '#4fd1c5', weight: 3 }}
          />
          <Marker position={[points[0].lat, points[0].lon]} />
        </MapContainer>
      </div>
    </div>
  );
}
