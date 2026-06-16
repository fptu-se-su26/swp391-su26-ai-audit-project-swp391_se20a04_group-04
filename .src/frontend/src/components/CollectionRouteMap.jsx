import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const defaultRoutePoints = [
  [16.0628, 108.2232],
  [16.0685, 108.2197],
  [16.0752, 108.2253],
  [16.0818, 108.2322],
];

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const routeStyle = { color: '#16a34a', weight: 5, opacity: 0.8 };

function ClickToAddPoint({ onAddPoint }) {
  useMapEvents({
    click(e) {
      onAddPoint([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function MapResizeHandler({ center }) {
  const map = useMap();
  useEffect(() => {
    // Ensure the map correctly sizes and recenters when container becomes visible or points change
    const t = setTimeout(() => {
      try {
        map.invalidateSize();
        if (center) map.setView(center, map.getZoom());
      } catch {
        // ignore
      }
    }, 120);
    return () => clearTimeout(t);
  }, [map, center]);
  return null;
}

export default function CollectionRouteMap({
  title = 'Route Map',
  collectorName = 'Collector pending',
  routePoints = defaultRoutePoints,
  setRoutePoints,
  readOnly = false,
}) {
  // Sử dụng trực tiếp prop routePoints thay vì đồng bộ sang state cục bộ
  // để tránh gọi setState trong useEffect gây cascading renders.
  const points = routePoints;

  const updatePoints = (nextPoints) => {
    if (typeof setRoutePoints === 'function') {
      setRoutePoints(nextPoints);
    }
  };

  const handleAddPoint = (point) => {
    updatePoints([...points, point]);
  };

  const handleDragEnd = (index, event) => {
    const { lat, lng } = event.target.getLatLng();
    updatePoints(points.map((item, idx) => (idx === index ? [lat, lng] : item)));
  };

  const handleRemovePoint = (index) => {
    updatePoints(points.filter((_, idx) => idx !== index));
  };

  const handleClearRoute = () => {
    updatePoints([]);
  };

  const center = points.length > 0 ? points[0] : defaultRoutePoints[0];

  return (
    <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <div className="p-5 border-b border-slate-100 dark:border-slate-700">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Map preview</p>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Assigned collector: {collectorName}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Nhấp vào bản đồ để đặt điểm, kéo marker để điều chỉnh và tạo tuyến thu gom.</p>
      </div>

      <div className="h-96">
        <MapContainer center={center} zoom={14} scrollWheelZoom className="h-full w-full">
          <MapResizeHandler center={center} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {!readOnly && <ClickToAddPoint onAddPoint={handleAddPoint} />}
          {points.length > 0 && <Polyline pathOptions={routeStyle} positions={points} />}
          {points.map((point, index) => (
            <Marker
              key={`${point[0]}-${point[1]}-${index}`}
              position={point}
              icon={markerIcon}
              draggable={!readOnly}
              eventHandlers={readOnly ? {} : { dragend: (event) => handleDragEnd(index, event) }}
            >
              <Popup>
                <div className="space-y-2 text-sm">
                  <p>Điểm {index + 1}</p>
                  <p>{point[0].toFixed(5)}, {point[1].toFixed(5)}</p>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemovePoint(index);
                      }}
                      className="mt-2 inline-flex rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                    >
                      Xoá điểm
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="p-5 border-t border-slate-100 dark:border-slate-700">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Route points</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{points.length} marker{points.length === 1 ? '' : 's'} selected.</p>
          </div>
          <button
            type="button"
            onClick={handleClearRoute}
            disabled={readOnly}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            Clear route
          </button>
        </div>

        {points.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Chưa có điểm nào. Nhấp vào bản đồ để thêm điểm dừng.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {points.map((point, index) => (
              <div key={`${point[0]}-${point[1]}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-200">
                <p className="font-semibold">Point {index + 1}</p>
                <p>{point[0].toFixed(5)}, {point[1].toFixed(5)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
