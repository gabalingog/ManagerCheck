import { useEffect, useRef, useState } from 'react';
import { supabase } from './../../supabaseClient';
import './RestaurantMap.css';
import { useNavigate } from 'react-router-dom';

const PIN_SVG = `
<svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="16" cy="37" rx="6" ry="3" fill="rgba(0,0,0,0.18)"/>
  <path d="M16 0C9.373 0 4 5.373 4 12c0 9 12 25 12 25S28 21 28 12C28 5.373 22.627 0 16 0Z" fill="#2a7a4b"/>
  <circle cx="16" cy="12" r="5" fill="white"/>
</svg>`;

const PIN_SVG_HOVER = `
<svg width="38" height="48" viewBox="0 0 38 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="19" cy="45" rx="7" ry="3" fill="rgba(0,0,0,0.18)"/>
  <path d="M19 0C11.268 0 5 6.268 5 14c0 10.5 14 30 14 30S33 24.5 33 14C33 6.268 26.732 0 19 0Z" fill="#3dab68"/>
  <circle cx="19" cy="14" r="6" fill="white"/>
</svg>`;

const geocodeAddress = (restaurant, maps) => {
    return new Promise((resolve) => {
        const geocoder = new maps.Geocoder();
        const address = `${restaurant.address}, ${restaurant.city}, ${restaurant.state} ${restaurant.zip_code}`;
        geocoder.geocode({ address }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const { lat, lng } = results[0].geometry.location;
                resolve({ lat: lat(), lng: lng() });
            } else {
                resolve(null);
            }
        });
    });
};

const loadGoogleMaps = (apiKey) => {
    return new Promise((resolve, reject) => {
        if (window.google && window.google.maps) return resolve(window.google.maps);
        const existing = document.getElementById('gmap-script');
        if (existing) {
            const poll = setInterval(() => {
                if (window.google && window.google.maps) { clearInterval(poll); resolve(window.google.maps); }
            }, 100);
            setTimeout(() => { clearInterval(poll); reject(new Error('Google Maps timed out')); }, 10000);
            return;
        }
        const script = document.createElement('script');
        script.id = 'gmap-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
        script.async = true;
        script.defer = true;
        script.onload = () => window.google?.maps ? resolve(window.google.maps) : reject(new Error('SDK unavailable'));
        script.onerror = () => reject(new Error('Failed to load Google Maps'));
        document.head.appendChild(script);
    });
};

const MAP_STYLES = [
    { elementType: 'geometry', stylers: [{ color: '#f5f0e8' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#7a6e5f' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#faf8f4' }] },
    { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#c9b99a' }] },
    { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#ae9e8e' }] },
    { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#ede6d8' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#e4dccf' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#a89d8e' }] },
    { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#d4e8d4' }] },
    { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#5a8a5a' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#f0e8d8' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#e8dcc8' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#d4c8b0' }] },
    { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#a89d8e' }] },
    { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#ddd4c0' }] },
    { featureType: 'transit.station', elementType: 'geometry', stylers: [{ color: '#e8e0d0' }] },
    { featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#b8d4e8' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#7a9ab0' }] },
];

export const MapButton = () => {
    const navigate = useNavigate();
    return (
        <button className="map-btn" onClick={() => navigate('/map')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '4px', padding: '11px 22px', letterSpacing: '0.14em', textTransform: 'uppercase', borderRadius: '4px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                <line x1="9" y1="3" x2="9" y2="18"/>
                <line x1="15" y1="6" x2="15" y2="21"/>
            </svg>
            Map of Restaurants
        </button>
    );
};

const RestaurantMap = () => {
    const navigate = useNavigate();
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const enrichedRef = useRef([]);
    const infoWindowRef = useRef(null);
    const hasRun = useRef(false);
    const [status, setStatus] = useState('loading');
    const [pinCount, setPinCount] = useState(0);
    const [zipInput, setZipInput] = useState('');
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [restaurantSearch, setRestaurantSearch] = useState('');
    const [restaurantResults, setRestaurantResults] = useState([]);
    const [showRestaurantDropdown, setShowRestaurantDropdown] = useState(false);

    const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

    const handleZipSearch = () => {
        if (!zipInput.trim() || !mapInstanceRef.current || !window.google) return;
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: zipInput + ', USA' }, (results, status) => {
            if (status === 'OK' && results[0]) {
                mapInstanceRef.current.setCenter(results[0].geometry.location);
                mapInstanceRef.current.setZoom(13);
            }
        });
    };

    const handleRestaurantSearch = (e) => {
        const val = e.target.value;
        setRestaurantSearch(val);
        if (!val.trim()) {
            setRestaurantResults([]);
            setShowRestaurantDropdown(false);
            return;
        }
        const matches = enrichedRef.current.filter(r =>
            r.name.toLowerCase().includes(val.toLowerCase())
        );
        setRestaurantResults(matches);
        setShowRestaurantDropdown(true);
    };

    const handleSelectFromSearch = (r) => {
        setRestaurantSearch('');
        setRestaurantResults([]);
        setShowRestaurantDropdown(false);

        if (mapInstanceRef.current && r.latitude && r.longitude) {
            mapInstanceRef.current.setCenter({ lat: Number(r.latitude), lng: Number(r.longitude) });
            mapInstanceRef.current.setZoom(16);
        }

        const ratings = r.restaurant_ratings || [];
        const fields = ['team_environment', 'shift_availability', 'pay', 'staff_workload_ratio'];
        let avg = null;
        if (ratings.length > 0) {
            const total = ratings.reduce((sum, row) => {
                const rowAvg = fields.reduce((s, f) => s + (Number(row[f]) || 0), 0) / fields.length;
                return sum + rowAvg;
            }, 0);
            avg = (total / ratings.length).toFixed(1);
        }
        const recommendCount = ratings.filter(row => row.would_recommend === true).length;
        const recommendPct = ratings.length > 0 ? Math.round((recommendCount / ratings.length) * 100) : null;
        setSelectedRestaurant({ r, avg, recommendPct, reviewCount: ratings.length, ratings });

        const marker = markersRef.current.find(m => m.getTitle() === r.name);
        if (marker && infoWindowRef.current) {
            infoWindowRef.current.open(mapInstanceRef.current, marker);
        }
    };

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        const init = async () => {
            try {
                const { data: ratingRows, error: ratingError } = await supabase
                    .from('restaurant_ratings').select('restaurant_id');
                if (ratingError) throw ratingError;

                const ratedIds = [...new Set(ratingRows.map(r => r.restaurant_id))];
                if (ratedIds.length === 0) { setStatus('ready'); setPinCount(0); return; }

                const { data, error } = await supabase
                    .from('restaurants')
                    .select('id, name, address, city, state, zip_code, latitude, longitude, restaurant_ratings(team_environment, shift_availability, pay, staff_workload_ratio, would_recommend)')
                    .in('id', ratedIds)
                    .order('name', { ascending: true });
                if (error) throw error;

                if (!API_KEY) throw new Error('Missing REACT_APP_GOOGLE_MAPS_API_KEY');
                const maps = await loadGoogleMaps(API_KEY);

                setStatus('geocoding');
                const enriched = [];
                for (const r of data) {
                    if (r.latitude && r.longitude) {
                        enriched.push(r);
                    } else {
                        const coords = await geocodeAddress(r, maps);
                        if (coords) {
                            await supabase.from('restaurants').update({ latitude: coords.lat, longitude: coords.lng }).eq('id', r.id);
                            enriched.push({ ...r, latitude: coords.lat, longitude: coords.lng });
                        } else {
                            enriched.push(r);
                        }
                    }
                }

                enrichedRef.current = enriched;
                setStatus('ready');
                if (!mapRef.current) return;

                const map = new maps.Map(mapRef.current, {
                    center: { lat: 42.3601, lng: -71.0589 },
                    zoom: 13,
                    styles: MAP_STYLES,
                    disableDefaultUI: false,
                    zoomControl: true,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false,
                    clickableIcons: false,
                });
                mapInstanceRef.current = map;

                const bounds = new maps.LatLngBounds();
                const iw = new maps.InfoWindow({ maxWidth: 260 });
                infoWindowRef.current = iw;

                let count = 0;
                enriched.forEach(r => {
                    if (!r.latitude || !r.longitude) return;
                    const pos = { lat: Number(r.latitude), lng: Number(r.longitude) };
                    bounds.extend(pos);

                    const marker = new maps.Marker({
                        position: pos,
                        map,
                        title: r.name,
                        icon: {
                            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(PIN_SVG),
                            scaledSize: new maps.Size(32, 40),
                            anchor: new maps.Point(16, 40),
                        },
                        cursor: 'pointer',
                    });

                    marker.addListener('mouseover', () => marker.setIcon({
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(PIN_SVG_HOVER),
                        scaledSize: new maps.Size(38, 48), anchor: new maps.Point(19, 48),
                    }));
                    marker.addListener('mouseout', () => marker.setIcon({
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(PIN_SVG),
                        scaledSize: new maps.Size(32, 40), anchor: new maps.Point(16, 40),
                    }));

                    marker.addListener('click', () => {
                        const ratings = r.restaurant_ratings || [];
                        const fields = ['team_environment', 'shift_availability', 'pay', 'staff_workload_ratio'];
                        let avg = null;
                        if (ratings.length > 0) {
                            const total = ratings.reduce((sum, row) => {
                                const rowAvg = fields.reduce((s, f) => s + (Number(row[f]) || 0), 0) / fields.length;
                                return sum + rowAvg;
                            }, 0);
                            avg = (total / ratings.length).toFixed(1);
                        }
                        const recommendCount = ratings.filter(row => row.would_recommend === true).length;
                        const recommendPct = ratings.length > 0 ? Math.round((recommendCount / ratings.length) * 100) : null;

                        setSelectedRestaurant({ r, avg, recommendPct, reviewCount: ratings.length, ratings });

                        const starsHtml = avg ? (() => {
                            const numAvg = parseFloat(avg);
                            return [1,2,3,4,5].map(i => {
                                const diff = numAvg - (i - 1);
                                if (diff >= 0.75) return `<span style="font-size:16px;color:#ffd700;">★</span>`;
                                if (diff >= 0.25) return `<span style="font-size:16px;position:relative;display:inline-block;color:#e0e0e0;">★<span style="position:absolute;left:0;width:50%;overflow:hidden;color:#ffd700;">★</span></span>`;
                                return `<span style="font-size:16px;color:#e0e0e0;">★</span>`;
                            }).join('');
                        })() : '';

                        const ratingHtml = avg
                            ? `<div style="display:flex;align-items:center;gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid rgba(60,45,20,0.08);">
                                <div style="display:flex;gap:1px;line-height:1;">${starsHtml}</div>
                                <span style="font-family:'Bebas Neue',sans-serif;font-size:20px;color:#2a7a4b;line-height:1;">${avg}</span>
                                <span style="font-size:11px;color:#a89d8e;font-family:'DM Sans',sans-serif;font-weight:300;">${ratings.length} review${ratings.length !== 1 ? 's' : ''}</span>
                               </div>` : '';

                               const recommendHtml = recommendPct !== null
                               ? `<div style="display:flex;align-items:center;gap:6px;margin-top:8px;">
                                   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${recommendPct >= 60 ? '#2a7a4b' : '#b43c3c'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                       ${recommendPct >= 60
                                           ? '<path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>'
                                           : '<path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>'}
                                   </svg>
                                   <span style="font-size:12px;font-family:'DM Sans',sans-serif;font-weight:400;color:${recommendPct >= 60 ? '#2a7a4b' : '#b43c3c'};">${recommendPct}%</span>
                                   <span style="font-size:12px;font-family:'DM Sans',sans-serif;font-weight:300;color:#7a6e5f;">would recommend</span>
                                  </div>`
                               : '';

                        iw.setContent(`
                            <div style="font-family:'DM Sans',sans-serif;width:220px;padding:0;">
                                <div style="font-size:13px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:#2a7a4b;margin-bottom:5px;">${r.name}</div>
                                <div style="font-size:12px;color:#7a6e5f;line-height:1.6;font-weight:300;word-wrap:break-word;">${r.address}, ${r.city}, ${r.state} ${r.zip_code}</div>
                                ${ratingHtml}${recommendHtml}
                            </div>
                        `);
                        iw.open(map, marker);
                    });

                    markersRef.current.push(marker);
                    count++;
                });

                setPinCount(count);
                if (!bounds.isEmpty()) map.fitBounds(bounds);

            } catch (e) {
                console.error('Map init error:', e);
                setStatus('error');
            }
        };

        init();
        return () => { markersRef.current.forEach(m => m.setMap(null)); markersRef.current = []; };
    }, [API_KEY]);

    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') navigate(-1); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [navigate]);

    return (
        <div className="map-page">
            <div className="map-header">
                <div className="map-header-left">
                    <span className="map-header-title">Rated Restaurants Near You</span>
                    {status === 'ready' && pinCount > 0 && (
                        <span className="map-header-count">{pinCount} locations</span>
                    )}
                </div>

                <div className="map-header-right">
                    <div className="map-restaurant-search-wrap">
                        <input
                            type="text"
                            placeholder="Search restaurants…"
                            className="map-search-input restaurant"
                            value={restaurantSearch}
                            onChange={handleRestaurantSearch}
                            onBlur={() => setTimeout(() => setShowRestaurantDropdown(false), 150)}
                            onFocus={() => restaurantResults.length > 0 && setShowRestaurantDropdown(true)}
                        />
                        {showRestaurantDropdown && (
                            <div className="map-restaurant-dropdown">
                                {restaurantResults.length > 0 ? restaurantResults.map(r => (
                                    <div
                                        key={r.id}
                                        className="map-restaurant-dropdown-item"
                                        onMouseDown={() => handleSelectFromSearch(r)}
                                    >
                                        <span className="map-restaurant-dropdown-name">{r.name}</span>
                                        <span className="map-restaurant-dropdown-address">{r.address}, {r.city}</span>
                                    </div>
                                )) : (
                                    <div className="map-restaurant-dropdown-empty">No results found</div>
                                )}
                            </div>
                        )}
                    </div>

                    <input
                        type="text"
                        placeholder="Search ZIP code"
                        maxLength={5}
                        value={zipInput}
                        onChange={e => setZipInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleZipSearch()}
                        className="map-search-input zip"
                    />
                    <button className="map-btn" onClick={handleZipSearch}>Go</button>
                    <button className="map-close-btn" onClick={() => navigate(-1)}>✕</button>
                </div>
            </div>

            <div className="map-body">
                <div className="map-area">
                    {(status === 'loading' || status === 'geocoding') && (
                        <div className="map-overlay">
                            <div className="map-spinner" />
                            <span className="map-overlay-text">
                                {status === 'geocoding' ? 'Locating restaurants…' : 'Loading map…'}
                            </span>
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="map-overlay">
                            <span className="map-error-icon">⚠️</span>
                            <span className="map-error-text">Couldn't load the map. Check your API key.</span>
                        </div>
                    )}
                    <div ref={mapRef} className="map-canvas" />
                </div>

                <div className={`map-sidebar ${selectedRestaurant ? 'open' : ''}`}>
                    {selectedRestaurant && (() => {
                        const { r, avg, recommendPct, reviewCount, ratings } = selectedRestaurant;
                        const numAvg = avg ? parseFloat(avg) : null;
                        const isPositive = recommendPct !== null && recommendPct >= 60;

                        const fieldLabels = {
                            team_environment: 'Team Environment',
                            shift_availability: 'Shift Availability',
                            pay: 'Pay',
                            staff_workload_ratio: 'Workload',
                        };

                        const categoryAvgs = Object.keys(fieldLabels).map(field => {
                            if (ratings.length === 0) return { label: fieldLabels[field], val: null };
                            const avg = ratings.reduce((s, row) => s + (Number(row[field]) || 0), 0) / ratings.length;
                            return { label: fieldLabels[field], val: avg };
                        });

                        return (
                            <div className="map-sidebar-inner">
                                <button className="map-sidebar-close" onClick={() => setSelectedRestaurant(null)}>✕</button>
                                <div className="map-sidebar-accent" />
                                <div className="map-sidebar-content">

                                    <div>
                                        <div className="map-sidebar-name">{r.name}</div>
                                        <div className="map-sidebar-address">
                                            {r.address}<br />{r.city}, {r.state} {r.zip_code}
                                        </div>
                                    </div>

                                    {numAvg !== null && (
                                        <div className="map-sidebar-rating-box">
                                            <span className="map-sidebar-rating-number">{avg}</span>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div className="map-sidebar-stars">
                                                    {[1,2,3,4,5].map(i => (
                                                        <span key={i} className="map-sidebar-star"
                                                            style={{ color: (numAvg - (i-1)) >= 0.75 ? '#ffd700' : '#e0e0e0' }}>★</span>
                                                    ))}
                                                </div>
                                                <span className="map-sidebar-review-count">
                                                    {reviewCount} review{reviewCount !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {recommendPct !== null && (
                                        <div className={`map-sidebar-recommend ${isPositive ? 'positive' : 'negative'}`}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                                stroke={isPositive ? '#2a7a4b' : '#b43c3c'}
                                                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                {isPositive ? (
                                                    <>
                                                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                                                        <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                                                    </>
                                                ) : (
                                                    <>
                                                        <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
                                                        <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                                                    </>
                                                )}
                                            </svg>
                                            <span className="map-sidebar-recommend-pct">{recommendPct}%</span>
                                            <span className="map-sidebar-recommend-label">would recommend</span>
                                        </div>
                                    )}

                                    {reviewCount > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <span className="map-sidebar-breakdown-title">Breakdown</span>
                                            {categoryAvgs.map(({ label, val }) => (
                                                <div key={label} className="map-sidebar-breakdown-row">
                                                    <div className="map-sidebar-breakdown-label-row">
                                                        <span className="map-sidebar-breakdown-label">{label}</span>
                                                        <span className="map-sidebar-breakdown-val">{val !== null ? val.toFixed(1) : '—'}</span>
                                                    </div>
                                                    <div className="map-sidebar-bar-track">
                                                        <div className="map-sidebar-bar-fill"
                                                            style={{ width: val !== null ? `${(val / 5) * 100}%` : '0%' }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="map-sidebar-divider" />

                                    <button className="map-sidebar-cta" onClick={() => navigate(`/restaurant/${r.id}`)}>
                                        <span className="map-sidebar-cta-label">View Restaurant</span>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                            stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="5" y1="12" x2="19" y2="12"/>
                                            <polyline points="12 5 19 12 12 19"/>
                                        </svg>
                                    </button>

                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
};

export default RestaurantMap;