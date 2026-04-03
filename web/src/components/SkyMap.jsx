import { Suspense, lazy } from 'react';

const LeafletMap = lazy(() => import('./SkyMapLeaflet'));

export default function SkyMap(props) {
  return (
    <div className="card p-4">
      <div className="text-sm text-muted mb-2">Sky map</div>
      <Suspense fallback={<div className="text-sm text-muted">Loading map...</div>}>
        <LeafletMap {...props} />
      </Suspense>
    </div>
  );
}
