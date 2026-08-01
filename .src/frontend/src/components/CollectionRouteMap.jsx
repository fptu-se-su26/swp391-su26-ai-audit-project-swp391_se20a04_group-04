import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet marker icons broken by Vite bundler
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const defaultRoutePoints = [
  [16.0628, 108.2232],
  [16.0685, 108.2197],
  [16.0752, 108.2253],
  [16.0818, 108.2322],
];

const normalizeRoutePoints = (points) => {
  if (!Array.isArray(points)) return [];
  return points
    .map((p) => {
      if (!Array.isArray(p) || p.length < 2) return null;
      const lat = Number(p[0]);
      const lng = Number(p[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return [lat, lng];
    })
    .filter(Boolean);
};

function numberedIcon(index, color) {
  return L.divIcon({
    className: '',
    html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;">${index + 1}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

// OSRM public routing — no API key needed
async function fetchOSRMRoute(points) {
  try {
    const coords = points.map(([lat, lng]) => `${lng},${lat}`).join(';');
    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) return null;
    const route = data.routes[0];
    const distM = route.distance;
    const durS = route.duration;
    return {
      polyline: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      distance: distM >= 1000 ? `${(distM / 1000).toFixed(1)} km` : `${Math.round(distM)} m`,
      duration: durS >= 3600
        ? `${Math.floor(durS / 3600)}h ${Math.round((durS % 3600) / 60)} phut`
        : `${Math.round(durS / 60)} phut`,
    };
  } catch {
    return null;
  }
}

// Nominatim free geocoding — no API key needed
async function searchNominatim(query) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
      { headers: { 'Accept-Language': 'vi' } },
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick([e.latlng.lat, e.latlng.lng]) });
  return null;
}

export default function CollectionRouteMap({
  title = 'Route Map',
  collectorName = 'Collector pending',
  routePoints = defaultRoutePoints,
  setRoutePoints,
  readOnly = false,
  ward = '',
  city = '',
}) {
  const points = useMemo(() => normalizeRoutePoints(routePoints), [routePoints]);
  const [routePolyline, setRoutePolyline] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const mapRef = useRef(null);

  const updatePoints = useCallback((next) => {
    if (typeof setRoutePoints === 'function') setRoutePoints(normalizeRoutePoints(next));
  }, [setRoutePoints]);

  useEffect(() => {
    if (points.length < 2) { setRoutePolyline([]); setRouteInfo(null); return; }
    let cancelled = false;
    fetchOSRMRoute(points).then((result) => {
      if (cancelled) return;
      if (result) { setRoutePolyline(result.polyline); setRouteInfo({ distance: result.distance, duration: result.duration }); }
      else { setRoutePolyline(points); setRouteInfo(null); }
    });
    return () => { cancelled = true; };
  }, [points]);

  useEffect(() => {
    if (!mapRef.current || points.length > 0) return;
    const address = [ward, city].filter(Boolean).join(', ');
    if (!address) return;
    searchNominatim(address).then((results) => {
      if (!results[0] || !mapRef.current) return;
      mapRef.current.setView([Number(results[0].lat), Number(results[0].lon)], 14);
    });
  }, [ward, city, points.length]);

  const handleMapClick = useCallback((latlng) => updatePoints([...points, latlng]), [points, updatePoints]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchResults(await searchNominatim(searchQuery));
    setSearchLoading(false);
  }, [searchQuery]);

  const handleSelectPlace = useCallback((place) => {
    const lat = Number(place.lat);
    const lng = Number(place.lon);
    updatePoints([...points, [lat, lng]]);
    setSearchResults([]);
    setSearchQuery('');
    mapRef.current?.setView([lat, lng], 15);
  }, [points, updatePoints]);

  const center = points.length > 0 ? points[0] : [16.0628, 108.2232];

  return (
    <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <div className="p-5 border-b border-slate-100 dark:border-slate-700">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">OpenStreetMap</p>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {readOnly ? `Nhan vien: ${collectorName}` : `Assigned collector: ${collectorName}`}
        </p>
        {!readOnly && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Nhan vao ban do de them diem, nhan marker de xoa.</p>}
      </div>

      {!readOnly && (
        <div className="px-5 pt-4 pb-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">search</span>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                placeholder="Tim kiem dia diem..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
            </div>
            <button type="button" onClick={handleSearch} disabled={searchLoading}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50">
              {searchLoading ? <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Tim'}
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg overflow-hidden relative z-50">
              {searchResults.map((place, i) => (
                <button key={place.place_id || i} type="button" onClick={() => handleSelectPlace(place)}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-b-0 flex items-start gap-3">
                  <span className="material-symbols-outlined text-emerald-600 text-base mt-0.5 shrink-0">location_on</span>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white">{place.display_name?.split(',')[0]}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{place.display_name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {routeInfo && (
        <div className="px-5 py-3 bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-900/50 flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
            <span className="material-symbols-outlined text-base">route</span>
            <span className="font-semibold">{routeInfo.distance}</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
            <span className="material-symbols-outlined text-base">schedule</span>
            <span className="font-semibold">{routeInfo.duration}</span>
          </div>
        </div>
      )}

      <div className="h-96 relative z-0">
        <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }} ref={mapRef}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {!readOnly && <MapClickHandler onMapClick={handleMapClick} />}
          {points.map((point, index) => {
            const color = index === 0 ? '#16a34a' : index === points.length - 1 ? '#dc2626' : '#0ea5e9';
            return (
              <Marker key={`${point[0]}-${point[1]}-${index}`} position={point} icon={numberedIcon(index, color)}
                draggable={!readOnly}
                eventHandlers={readOnly ? {} : {
                  dragend: (e) => {
                    const { lat, lng } = e.target.getLatLng();
                    updatePoints(points.map((p, i) => i === index ? [lat, lng] : p));
                  },
                }}>
                {!readOnly && (
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold">Diem {index + 1}</p>
                      <p className="text-xs text-slate-500">{point[0].toFixed(5)}, {point[1].toFixed(5)}</p>
                      <button onClick={() => updatePoints(points.filter((_, i) => i !== index))}
                        className="mt-2 px-3 py-1 bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold hover:bg-rose-200">
                        Xoa diem
                      </button>
                    </div>
                  </Popup>
                )}
              </Marker>
            );
          })}
          {routePolyline.length > 1 && <Polyline positions={routePolyline} color="#16a34a" weight={5} opacity={0.85} />}
        </MapContainer>
      </div>

      <div className="p-5 border-t border-slate-100 dark:border-slate-700">
        {!readOnly && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Route points</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{points.length} marker{points.length === 1 ? '' : 's'} selected.</p>
            </div>
            <button type="button" onClick={() => { updatePoints([]); setRoutePolyline([]); setRouteInfo(null); }}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              Clear route
            </button>
          </div>
        )}
        {points.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Chua co diem tren tuyen.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {points.map((point, index) => {
              const color = index === 0 ? '#16a34a' : index === points.length - 1 ? '#dc2626' : '#0ea5e9';
              return (
                <div key={`${point[0]}-${point[1]}-${index}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold shrink-0" style={{ backgroundColor: color }}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold">Diem {index + 1}{index === 0 ? ' (Xuat phat)' : index === points.length - 1 ? ' (Ket thuc)' : ''}</p>
                      <p className="text-xs text-slate-500">{point[0].toFixed(5)}, {point[1].toFixed(5)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
