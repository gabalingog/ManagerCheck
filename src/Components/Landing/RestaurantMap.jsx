import { useEffect, useRef, useState } from 'react';
import { supabase } from './../../supabaseClient';
import './RestaurantMap.css';

const PIN_SVG = `
<svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="16" cy="37" rx="6" ry="3" fill="rgba(0,0,0,0.18)"/>
  <path d="M16 0C9.373 0 4 5.373 4 12c0 9 12 25 12 25S28 21 28 12C28 5.373 22.627 0 16 0Z" fill="#2a7a4b"/>
  <circle cx="16" cy="12" r="5" fill="white"/>
</svg>
`;

const PIN_SVG_HOVER = `
<svg width="38" height="48" viewBox="0 0 38 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="19" cy="45" rx="7" ry="3" fill="rgba(0,0,0,0.18)"/>
  <path d="M19 0C11.268 0 5 6.268 5 14c0 10.5 14 30 14 30S33 24.5 33 14C33 6.268 26.732 0 19 0Z" fill="#3dab68"/>
  <circle cx="19" cy="14" r="6" fill="white"/>
</svg>
`;

const geocodeAddress = (restaurant, maps) => {
    return new Promise((resolve) => {
        const geocoder = new maps.Geocoder();
        const address = `${restaurant.address}, ${restaurant.city}, ${restaurant.state} ${restaurant.zip_code}`;
        geocoder.geocode({ address }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const { lat, lng } = results[0].geometry.location;
                resolve({ lat: lat(), lng: lng() });
            } else {
                console.warn('Geocode failed for:', address, status);
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
            // Script tag exists but maps may not be ready yet — poll for it
            const poll = setInterval(() => {
                if (window.google && window.google.maps) {
                    clearInterval(poll);
                    resolve(window.google.maps);
                }
            }, 100);
            // Give up after 10 seconds
            setTimeout(() => {
                clearInterval(poll);
                reject(new Error('Google Maps timed out'));
            }, 10000);
            return;
        }

        const script = document.createElement('script');
        script.id = 'gmap-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            if (window.google && window.google.maps) {
                resolve(window.google.maps);
            } else {
                reject(new Error('Google Maps SDK not available after load'));
            }
        };
        script.onerror = () => reject(new Error('Failed to load Google Maps script'));
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

export const MapButton = ({ onClick }) => (
    <button
        onClick={onClick}
        style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '28px',
            background: 'transparent',
            border: '1px solid rgba(42,122,75,0.4)',
            borderRadius: '4px',
            padding: '11px 22px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px',
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#2a7a4b',
            cursor: 'pointer',
            transition: 'all 0.2s',
        }}
        onMouseOver={e => {
            e.currentTarget.style.background = '#2a7a4b';
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.borderColor = '#2a7a4b';
        }}
        onMouseOut={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#2a7a4b';
            e.currentTarget.style.borderColor = 'rgba(42,122,75,0.4)';
        }}
    >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
            <line x1="9" y1="3" x2="9" y2="18"/>
            <line x1="15" y1="6" x2="15" y2="21"/>
        </svg>
        Map of Restaurants
    </button>
);

const RestaurantMap = ({ onClose }) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const infoWindowRef = useRef(null);
    const hasRun = useRef(false);
    const [status, setStatus] = useState('loading');
    const [pinCount, setPinCount] = useState(0);

    const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

    useEffect(() => {
        // Prevent React StrictMode from running this twice in development
        if (hasRun.current) return;
        hasRun.current = true;
    
        const init = async () => {
            try {
                // 1. Fetch only restaurant IDs that have at least one rating
                const { data: ratingRows, error: ratingError } = await supabase
                    .from('restaurant_ratings')
                    .select('restaurant_id');
    
                if (ratingError) throw ratingError;
    
                const ratedIds = [...new Set(ratingRows.map(r => r.restaurant_id))];
    
                if (ratedIds.length === 0) {
                    setStatus('ready');
                    setPinCount(0);
                    return;
                }
    
                // 2. Fetch only rated restaurants
                const { data, error } = await supabase
                    .from('restaurants')
                    .select('id, name, address, city, state, zip_code, latitude, longitude, restaurant_ratings(team_environment, shift_availability, pay, staff_workload_ratio, would_recommend)')                    .in('id', ratedIds)
                    .order('name', { ascending: true });
                if (error) throw error;
    
                // 3. Load Maps SDK
                if (!API_KEY) throw new Error('Missing REACT_APP_GOOGLE_MAPS_API_KEY');
                const maps = await loadGoogleMaps(API_KEY);
    
                // 4. Geocode any restaurants missing coords
                setStatus('geocoding');
                const enriched = [];
                for (const r of data) {
                    if (r.latitude && r.longitude) {
                        enriched.push(r);
                    } else {
                        const coords = await geocodeAddress(r, maps);
                        if (coords) {
                            await supabase
                                .from('restaurants')
                                .update({ latitude: coords.lat, longitude: coords.lng })
                                .eq('id', r.id);
                            enriched.push({ ...r, latitude: coords.lat, longitude: coords.lng });
                        } else {
                            enriched.push(r);
                        }
                    }
                }
    
                setStatus('ready');
    
                // 5. Init map
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
    
                // 6. Drop pins
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
    
                    marker.addListener('mouseover', () => {
                        marker.setIcon({
                            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(PIN_SVG_HOVER),
                            scaledSize: new maps.Size(38, 48),
                            anchor: new maps.Point(19, 48),
                        });
                    });
                    marker.addListener('mouseout', () => {
                        marker.setIcon({
                            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(PIN_SVG),
                            scaledSize: new maps.Size(32, 40),
                            anchor: new maps.Point(16, 40),
                        });
                    });
                    marker.addListener('click', () => {
                        const ratings = r.restaurant_ratings || [];
                        const fields = ['team_environment','shift_availability','pay','staff_workload_ratio'];
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
                    
                        const starsHtml = avg ? (() => {
                            const numAvg = parseFloat(avg);
                            return [1,2,3,4,5].map(i => {
                                const diff = numAvg - (i - 1);
                                if (diff >= 0.75) {
                                    return `<span style="font-size:16px;color:#ffd700;">★</span>`;
                                } else if (diff >= 0.25) {
                                    return `<span style="font-size:16px;position:relative;display:inline-block;color:#e0e0e0;">★<span style="position:absolute;left:0;width:50%;overflow:hidden;color:#ffd700;">★</span></span>`;
                                } else {
                                    return `<span style="font-size:16px;color:#e0e0e0;">★</span>`;
                                }
                            }).join('');
                        })() : '';
                    
                        const ratingHtml = avg
                            ? `<div style="display:flex;align-items:center;gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid rgba(60,45,20,0.08);">
                                <div style="display:flex;gap:1px;line-height:1;">${starsHtml}</div>
                                <span style="font-family:'Bebas Neue',sans-serif;font-size:20px;color:#2a7a4b;line-height:1;">${avg}</span>
                                <span style="font-size:11px;color:#a89d8e;font-family:'DM Sans',sans-serif;font-weight:300;">${ratings.length} review${ratings.length !== 1 ? 's' : ''}</span>
                              </div>`
                            : '';
                    
                        const recommendHtml = recommendPct !== null
                            ? `<div style="display:flex;align-items:center;gap:6px;margin-top:8px;">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2a7a4b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                <span style="font-size:12px;font-family:'DM Sans',sans-serif;font-weight:400;color:#2a7a4b;">${recommendPct}%</span>
                                <span style="font-size:12px;font-family:'DM Sans',sans-serif;font-weight:300;color:#7a6e5f;">would recommend</span>
                              </div>`
                            : '';
                    
                        iw.setContent(`
                            <div style="font-family:'DM Sans',sans-serif;width:220px;padding:0;">
                                <div style="font-size:13px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:#2a7a4b;margin-bottom:5px;">${r.name}</div>
                                <div style="font-size:12px;color:#7a6e5f;line-height:1.6;font-weight:300;word-wrap:break-word;">${r.address}, ${r.city}, ${r.state} ${r.zip_code}</div>
                                ${ratingHtml}
                                ${recommendHtml}
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
    
        return () => {
            markersRef.current.forEach(m => m.setMap(null));
            markersRef.current = [];
        };
    }, [API_KEY]);

    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <>
            <div
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(30,26,20,0.6)',
                    zIndex: 2000,
                    backdropFilter: 'blur(5px)',
                    WebkitBackdropFilter: 'blur(5px)',
                    animation: 'mapOverlayIn 0.25s ease forwards',
                }}
            />

            <div style={{
                position: 'fixed',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'min(960px, 94vw)',
                height: 'min(640px, 88vh)',
                background: '#faf8f4',
                borderRadius: '12px',
                border: '1px solid rgba(60,45,20,0.16)',
                boxShadow: '0 32px 80px rgba(30,26,20,0.28)',
                zIndex: 2001,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                animation: 'mapModalIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '18px 24px',
                    borderBottom: '1px solid rgba(60,45,20,0.10)',
                    background: '#faf8f4',
                    flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                            fontSize: '11px', fontFamily: "'DM Sans',sans-serif",
                            fontWeight: 500, letterSpacing: '0.22em',
                            textTransform: 'uppercase', color: '#2a7a4b',
                        }}>
                            Rated Restaurants Near You
                        </span>
                        {status === 'ready' && pinCount > 0 && (
                            <span style={{
                                fontSize: '11px', fontFamily: "'DM Sans',sans-serif",
                                fontWeight: 300, color: '#a89d8e',
                                letterSpacing: '0.05em',
                            }}>
                                {pinCount} locations
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none', border: 'none',
                            fontSize: '18px', color: '#a89d8e',
                            cursor: 'pointer', padding: '4px 8px',
                            lineHeight: 1, transition: 'color 0.2s',
                            fontFamily: 'sans-serif',
                        }}
                        onMouseOver={e => e.target.style.color = '#1e1a14'}
                        onMouseOut={e => e.target.style.color = '#a89d8e'}
                    >
                        ✕
                    </button>
                </div>

                {/* Map area */}
                <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                    {(status === 'loading' || status === 'geocoding') && (
                        <div style={{
                            position: 'absolute', inset: 0, zIndex: 10,
                            background: '#f5f0e8',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            gap: '16px',
                        }}>
                            <div style={{
                                width: '36px', height: '36px',
                                border: '2px solid rgba(42,122,75,0.2)',
                                borderTop: '2px solid #2a7a4b',
                                borderRadius: '50%',
                                animation: 'mapSpin 0.8s linear infinite',
                            }} />
                            <span style={{
                                fontSize: '12px', fontFamily: "'DM Sans',sans-serif",
                                fontWeight: 300, color: '#7a6e5f',
                                letterSpacing: '0.1em',
                            }}>
                                {status === 'geocoding' ? 'Locating restaurants…' : 'Loading map…'}
                            </span>
                        </div>
                    )}

                    {status === 'error' && (
                        <div style={{
                            position: 'absolute', inset: 0, zIndex: 10,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            gap: '12px',
                        }}>
                            <span style={{ fontSize: '28px' }}>⚠️</span>
                            <span style={{
                                fontSize: '14px', fontFamily: "'DM Sans',sans-serif",
                                color: '#7a6e5f', fontWeight: 300,
                            }}>
                                Couldn't load the map. Check your API key.
                            </span>
                        </div>
                    )}

                    <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
                </div>
            </div>

            <style>{`
                @keyframes mapOverlayIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes mapModalIn {
                    from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
                    to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
                @keyframes mapSpin {
                    to { transform: rotate(360deg); }
                }
                .gm-style .gm-style-iw-c {
                    border-radius: 6px !important;
                    box-shadow: 0 8px 24px rgba(30,26,20,0.14) !important;
                    border: 1px solid rgba(60,45,20,0.12) !important;
                    padding: 12px 16px !important;
                }
                .gm-style .gm-style-iw-d { overflow: hidden !important; }
                .gm-style .gm-style-iw-chr { position: absolute !important; top: 0 !important; right: 0 !important; }
                .gm-style .gm-ui-hover-effect { top: 0 !important; right: 25px !important; opacity: 0.5 !important; }
            `}</style>
        </>
    );
};

export default RestaurantMap;