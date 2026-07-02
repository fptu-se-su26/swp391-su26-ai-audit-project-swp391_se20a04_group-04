import { useEffect, useRef, useState, useCallback } from 'react';
import authService from '../services/authService';

const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api/auth', '')
  : 'http://localhost:5001';

// Cache the API key & Google Maps script globally so we only load once
let cachedApiKey = null;
let googleMapsLoadPromise = null;

async function getAuthHeaders() {
  const token = await authService.getFreshToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function fetchApiKey() {
  if (cachedApiKey) return cachedApiKey;
  try {
    const res = await fetch(`${API_BASE}/api/maps/key`, { headers: await getAuthHeaders() });
    if (!res.ok) throw new Error('Không thể lấy Google Maps API key');
    const data = await res.json();
    cachedApiKey = data.apiKey;
    return cachedApiKey;
  } catch (err) {
    console.error('[GoogleMaps] Lỗi lấy API key:', err);
    return null;
  }
}

function loadGoogleMaps(apiKey) {
  if (googleMapsLoadPromise) return googleMapsLoadPromise;
  if (window.google?.maps) return Promise.resolve();

  googleMapsLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry,marker&language=vi`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Không thể tải Google Maps SDK'));
    document.head.appendChild(script);
  });
  return googleMapsLoadPromise;
}

async function fetchDirections(origin, destination, waypoints) {
  try {
    const params = new URLSearchParams({ origin, destination });
    if (waypoints) params.set('waypoints', waypoints);
    const res = await fetch(`${API_BASE}/api/maps/directions?${params}`, {
      headers: await getAuthHeaders(),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchGeocode(address) {
  try {
    const params = new URLSearchParams({ address });
    const res = await fetch(`${API_BASE}/api/maps/geocode?${params}`, {
      headers: await getAuthHeaders(),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchReverseGeocode(lat, lng) {
  try {
    const params = new URLSearchParams({ latlng: `${lat},${lng}` });
    const res = await fetch(`${API_BASE}/api/maps/geocode?${params}`, {
      headers: await getAuthHeaders(),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchDistanceMatrix(origins, destinations) {
  try {
    const params = new URLSearchParams({ origins, destinations });
    const res = await fetch(`${API_BASE}/api/maps/distance-matrix?${params}`, {
      headers: await getAuthHeaders(),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchPlaces(query, location) {
  try {
    const params = new URLSearchParams({ query });
    if (location) params.set('location', location);
    params.set('radius', '50000');
    const res = await fetch(`${API_BASE}/api/maps/places?${params}`, {
      headers: await getAuthHeaders(),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const defaultRoutePoints = [
  [16.0628, 108.2232],
  [16.0685, 108.2197],
  [16.0752, 108.2253],
  [16.0818, 108.2322],
];

export default function CollectionRouteMap({
  title = 'Route Map',
  collectorName = 'Collector pending',
  routePoints = defaultRoutePoints,
  setRoutePoints,
  readOnly = false,
  ward = '',
  city = '',
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const infoWindowRef = useRef(null);
  const searchInputRef = useRef(null);

  const [mapReady, setMapReady] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [mapError, setMapError] = useState('');

  const points = routePoints;

  const updatePoints = useCallback((nextPoints) => {
    if (typeof setRoutePoints === 'function') {
      setRoutePoints(nextPoints);
    }
  }, [setRoutePoints]);

  // Initialize map
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const apiKey = await fetchApiKey();
        if (!apiKey || cancelled) {
          if (!cancelled) setMapError('Không thể lấy Google Maps API key.');
          return;
        }
        await loadGoogleMaps(apiKey);
        if (cancelled || !mapContainerRef.current) return;

        const defaultCenter = points.length > 0
          ? { lat: points[0][0], lng: points[0][1] }
          : { lat: 16.0628, lng: 108.2232 };

        const map = new window.google.maps.Map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 14,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: window.google.maps.ControlPosition.TOP_RIGHT,
          },
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'simplified' }],
            },
          ],
        });

        mapRef.current = map;
        infoWindowRef.current = new window.google.maps.InfoWindow();

        // Click to add point in edit mode
        if (!readOnly) {
          map.addListener('click', (e) => {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            updatePoints([...points, [lat, lng]]);
          });
        }

        setMapReady(true);
      } catch (err) {
        console.error('[GoogleMaps] Init error:', err);
        if (!cancelled) setMapError('Không thể khởi tạo Google Maps.');
      }
    }

    init();
    return () => { cancelled = true; };
    // Only init once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-attach click listener when points change (so closure captures latest points)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || readOnly || !mapReady) return;

    const listener = map.addListener('click', (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      updatePoints([...points, [lat, lng]]);
    });

    return () => {
      window.google.maps.event.removeListener(listener);
    };
  }, [points, readOnly, mapReady, updatePoints]);

  // Geocode ward/city to center map
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    if (points.length > 0) return; // Don't recenter if we have points

    const address = [ward, city].filter(Boolean).join(', ');
    if (!address) return;

    let cancelled = false;
    fetchGeocode(address).then((data) => {
      if (cancelled || !data?.results?.[0]) return;
      const loc = data.results[0].geometry.location;
      mapRef.current.setCenter({ lat: loc.lat, lng: loc.lng });
      mapRef.current.setZoom(15);
    });

    return () => { cancelled = true; };
  }, [ward, city, mapReady, points.length]);

  // Update markers and polyline when points change
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    const map = mapRef.current;
    const infoWindow = infoWindowRef.current;

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // Clear existing polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (points.length === 0) {
      setRouteInfo(null);
      return;
    }

    // Create markers
    points.forEach((point, index) => {
      const marker = new window.google.maps.Marker({
        position: { lat: point[0], lng: point[1] },
        map,
        draggable: !readOnly,
        label: {
          text: `${index + 1}`,
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '12px',
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: index === 0 ? '#16a34a' : index === points.length - 1 ? '#dc2626' : '#0ea5e9',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
          scale: 14,
        },
        title: `Điểm ${index + 1}`,
        zIndex: index === 0 ? 1000 : 500,
      });

      marker.addListener('click', () => {
        const contentStr = readOnly
          ? `<div style="padding:4px;min-width:140px">
              <p style="font-weight:600;margin:0 0 4px">Điểm ${index + 1}</p>
              <p style="margin:0;font-size:12px;color:#64748b">${point[0].toFixed(5)}, ${point[1].toFixed(5)}</p>
            </div>`
          : `<div style="padding:4px;min-width:160px">
              <p style="font-weight:600;margin:0 0 4px">Điểm ${index + 1}</p>
              <p style="margin:0 0 8px;font-size:12px;color:#64748b">${point[0].toFixed(5)}, ${point[1].toFixed(5)}</p>
              <button id="gmap-remove-${index}" style="background:#fee2e2;color:#b91c1c;border:1px solid #fecaca;border-radius:8px;padding:4px 10px;font-size:12px;font-weight:600;cursor:pointer">Xoá điểm</button>
            </div>`;
        infoWindow.setContent(contentStr);
        infoWindow.open(map, marker);

        if (!readOnly) {
          // Use setTimeout to allow DOM to render before attaching listener
          setTimeout(() => {
            const btn = document.getElementById(`gmap-remove-${index}`);
            if (btn) {
              btn.onclick = () => {
                infoWindow.close();
                updatePoints(points.filter((_, idx) => idx !== index));
              };
            }
          }, 50);
        }
      });

      if (!readOnly) {
        marker.addListener('dragend', (e) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          updatePoints(points.map((item, idx) => (idx === index ? [lat, lng] : item)));
        });
      }

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (points.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      points.forEach((p) => bounds.extend({ lat: p[0], lng: p[1] }));
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    } else if (points.length === 1) {
      map.setCenter({ lat: points[0][0], lng: points[0][1] });
      map.setZoom(15);
    }

    // Draw route using Directions API if we have 2+ points
    if (points.length >= 2) {
      const origin = `${points[0][0]},${points[0][1]}`;
      const destination = `${points[points.length - 1][0]},${points[points.length - 1][1]}`;
      const waypointStr = points.length > 2
        ? points.slice(1, -1).map((p) => `${p[0]},${p[1]}`).join('|')
        : '';

      fetchDirections(origin, destination, waypointStr).then((data) => {
        if (!data?.routes?.[0]) {
          // Fallback to simple polyline if directions fail
          const path = points.map((p) => ({ lat: p[0], lng: p[1] }));
          polylineRef.current = new window.google.maps.Polyline({
            path,
            geodesic: true,
            strokeColor: '#16a34a',
            strokeOpacity: 0.8,
            strokeWeight: 4,
          });
          polylineRef.current.setMap(map);
          setRouteInfo(null);
          return;
        }

        const route = data.routes[0];
        const leg = route.legs[0];

        // Decode the polyline path
        const decodedPath = window.google.maps.geometry
          ? window.google.maps.geometry.encoding.decodePath(route.overview_polyline.points)
          : null;

        if (decodedPath) {
          polylineRef.current = new window.google.maps.Polyline({
            path: decodedPath,
            geodesic: true,
            strokeColor: '#16a34a',
            strokeOpacity: 0.85,
            strokeWeight: 5,
          });
          polylineRef.current.setMap(map);
        } else {
          // Fallback: use simple polyline from points
          const path = points.map((p) => ({ lat: p[0], lng: p[1] }));
          polylineRef.current = new window.google.maps.Polyline({
            path,
            geodesic: true,
            strokeColor: '#16a34a',
            strokeOpacity: 0.8,
            strokeWeight: 4,
          });
          polylineRef.current.setMap(map);
        }

        // Calculate total distance and duration across all legs
        let totalDistance = 0;
        let totalDuration = 0;
        route.legs.forEach((l) => {
          totalDistance += l.distance.value;
          totalDuration += l.duration.value;
        });

        setRouteInfo({
          distance: totalDistance >= 1000
            ? `${(totalDistance / 1000).toFixed(1)} km`
            : `${totalDistance} m`,
          duration: totalDuration >= 3600
            ? `${Math.floor(totalDuration / 3600)}h ${Math.round((totalDuration % 3600) / 60)} phút`
            : `${Math.round(totalDuration / 60)} phút`,
          startAddress: leg.start_address || '',
          endAddress: route.legs[route.legs.length - 1].end_address || '',
        });
      });

      // Also fetch distance matrix for the full picture
      if (points.length >= 2) {
        const originsStr = `${points[0][0]},${points[0][1]}`;
        const destsStr = `${points[points.length - 1][0]},${points[points.length - 1][1]}`;
        fetchDistanceMatrix(originsStr, destsStr).then((data) => {
          if (data?.rows?.[0]?.elements?.[0]?.status === 'OK') {
            // Distance matrix info is supplementary — directions data is primary
          }
        });
      }
    } else {
      setRouteInfo(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, mapReady, readOnly]);

  // Handle place search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchResults([]);
    try {
      const mapCenter = mapRef.current?.getCenter();
      const location = mapCenter ? `${mapCenter.lat()},${mapCenter.lng()}` : null;
      const data = await fetchPlaces(searchQuery, location);
      if (data?.results) {
        setSearchResults(data.results.slice(0, 5));
      }
    } catch {
      // ignore
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery]);

  const handleSelectPlace = useCallback((place) => {
    const lat = place.geometry.location.lat;
    const lng = place.geometry.location.lng;
    updatePoints([...points, [lat, lng]]);
    setSearchResults([]);
    setSearchQuery('');

    if (mapRef.current) {
      mapRef.current.panTo({ lat, lng });
      mapRef.current.setZoom(15);
    }
  }, [points, updatePoints]);

  const handleClearRoute = () => {
    updatePoints([]);
    setRouteInfo(null);
  };

  if (mapError) {
    return (
      <div className={`rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 relative z-0`}>
        <div className="p-5">
          <p className="text-sm text-rose-600">{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 relative z-0 ${readOnly ? 'collector-route-map--readonly' : ''}`}>
      <div className="p-5 border-b border-slate-100 dark:border-slate-700">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Google Maps</p>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {readOnly ? `Nhân viên: ${collectorName}` : `Assigned collector: ${collectorName}`}
        </p>
        {!readOnly && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Nhấp vào bản đồ để đặt điểm, kéo marker để điều chỉnh và tạo tuyến thu gom.</p>
        )}
      </div>

      {/* Places search bar (edit mode only) */}
      {!readOnly && (
        <div className="px-5 pt-4 pb-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">search</span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                placeholder="Tìm kiếm địa điểm..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              disabled={searchLoading}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {searchLoading ? (
                <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : 'Tìm'}
            </button>
          </div>

          {/* Search results dropdown */}
          {searchResults.length > 0 && (
            <div className="mt-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
              {searchResults.map((place, i) => (
                <button
                  key={place.place_id || i}
                  type="button"
                  onClick={() => handleSelectPlace(place)}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-b-0 flex items-start gap-3"
                >
                  <span className="material-symbols-outlined text-emerald-600 text-base mt-0.5 shrink-0">location_on</span>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white">{place.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{place.formatted_address}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Route info bar */}
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
          {routeInfo.startAddress && (
            <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              {routeInfo.startAddress} → {routeInfo.endAddress}
            </div>
          )}
        </div>
      )}

      {/* Google Map container — keep spinner OUTSIDE mapContainerRef so React never
           tries to removeChild a node that Google Maps has already restructured */}
      <div className="relative h-96">
        {!mapReady && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
            <div className="text-center">
              <span className="inline-block h-8 w-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <p className="mt-3 text-sm text-slate-500">Đang tải Google Maps...</p>
            </div>
          </div>
        )}
        <div className="h-full" ref={mapContainerRef} />
      </div>

      <div className="p-5 border-t border-slate-100 dark:border-slate-700">
        {!readOnly && (
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
        )}

        {points.length === 0 ? (
          <p className={`text-sm text-slate-500 dark:text-slate-400 ${readOnly ? '' : 'mt-4'}`}>Chưa có điểm trên tuyến.</p>
        ) : (
          <div className={`grid gap-3 sm:grid-cols-2 ${readOnly ? '' : 'mt-4'}`}>
            {points.map((point, index) => (
              <div key={`${point[0]}-${point[1]}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-200">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: index === 0 ? '#16a34a' : index === points.length - 1 ? '#dc2626' : '#0ea5e9' }}
                  >
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-semibold">Điểm {index + 1}{index === 0 ? ' (Xuất phát)' : index === points.length - 1 ? ' (Kết thúc)' : ''}</p>
                    <p className="text-xs text-slate-500">{point[0].toFixed(5)}, {point[1].toFixed(5)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
