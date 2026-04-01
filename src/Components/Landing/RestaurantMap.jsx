import { useEffect, useRef, useState } from 'react';
import { supabase } from './../../supabaseClient';
import './RestaurantMap.css';
import { useNavigate } from 'react-router-dom';

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
            const poll = setInterval(() => {
                if (window.google && window.google.maps) {
                    clearInterval(poll);
                    resolve(window.google.maps);
                }
            }, 100);
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

// ✅ Fixed: uses navigate('/map') instead of the old onClick prop
export const MapButton = () => {
    const navigate = useNavigate();
    return (
        <button
            onClick={() => navigate('/map')}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '4px',
                marginBottom: '0',
                background: '#2a7a4b',
                border: '1px solid #2a7a4b',
                borderRadius: '4px',
                padding: '11px 22px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s',
            }}
            onMouseOver={e => {
                e.currentTarget.style.background = '#3dab68';
                e.currentTarget.style.borderColor = '#3dab68';
            }}
            onMouseOut={e => {
                e.currentTarget.style.background = '#2a7a4b';
                e.currentTarget.style.borderColor = '#2a7a4b';
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
};


const RestaurantMap = () => {
    const navigate = useNavigate();
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const infoWindowRef = useRef(null);
    const hasRun = useRef(false);
    const [status, setStatus] = useState('loading');
    const [pinCount, setPinCount] = useState(0);
    const [zipInput, setZipInput] = useState('');
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);

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

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        const init = async () => {
            try {
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
                    
                        // ── Sidebar ──
                        setSelectedRestaurant({ r, avg, recommendPct, reviewCount: ratings.length, ratings });
                    
                        // ── InfoWindow popup ──
                        const starsHtml = avg ? (() => {
                            const numAvg = parseFloat(avg);
                            return [1, 2, 3, 4, 5].map(i => {
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
                                <div style="font-size:13px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:#2a7a4b;margin-bottom:5px;">
                                    ${r.name}
                                </div>
                                <div style="font-size:12px;color:#7a6e5f;line-height:1.6;font-weight:300;word-wrap:break-word;">
                                    ${r.address}, ${r.city}, ${r.state} ${r.zip_code}
                                </div>
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

    // ✅ Expose navigate to the window so the InfoWindow HTML onclick can use it
    useEffect(() => {
        window.__navigateTo = (path) => navigate(path);
        return () => { delete window.__navigateTo; };
    }, [navigate]);

    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') navigate(-1); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [navigate]);

    return (
        <div style={{
            width: '100vw',
            height: 'calc(100vh - 60px)',
            display: 'flex',
            flexDirection: 'column',
            background: '#faf8f4',
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
                            fontWeight: 300, color: '#a89d8e', letterSpacing: '0.05em',
                        }}>
                            {pinCount} locations
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                        type="text"
                        placeholder="Search ZIP code"
                        maxLength={5}
                        value={zipInput}
                        onChange={e => setZipInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleZipSearch()}
                        style={{
                            fontFamily: "'DM Sans',sans-serif", fontSize: '12px',
                            fontWeight: 300, color: '#1e1a14', background: '#f0ece4',
                            border: '1px solid rgba(60,45,20,0.16)', borderRadius: '4px',
                            padding: '7px 12px', width: '130px', outline: 'none',
                            letterSpacing: '0.06em',
                        }}
                    />
                    <button
                        onClick={handleZipSearch}
                        style={{
                            background: '#2a7a4b', border: 'none', borderRadius: '4px',
                            padding: '7px 14px', fontFamily: "'DM Sans',sans-serif",
                            fontSize: '12px', fontWeight: 500, letterSpacing: '0.1em',
                            textTransform: 'uppercase', color: '#fff', cursor: 'pointer',
                        }}
                        onMouseOver={e => e.currentTarget.style.background = '#3dab68'}
                        onMouseOut={e => e.currentTarget.style.background = '#2a7a4b'}
                    >
                        Go
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            background: 'none', border: 'none', fontSize: '18px',
                            color: '#a89d8e', cursor: 'pointer', padding: '4px 8px',
                            lineHeight: 1, transition: 'color 0.2s', fontFamily: 'sans-serif',
                        }}
                        onMouseOver={e => e.target.style.color = '#1e1a14'}
                        onMouseOut={e => e.target.style.color = '#a89d8e'}
                    >
                        ✕
                    </button>
                </div>
            </div>
    
            {/* Map + Sidebar */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
    
                {/* Map */}
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
                                fontWeight: 300, color: '#7a6e5f', letterSpacing: '0.1em',
                            }}>
                                {status === 'geocoding' ? 'Locating restaurants…' : 'Loading map…'}
                            </span>
                        </div>
                    )}
                    {status === 'error' && (
                        <div style={{
                            position: 'absolute', inset: 0, zIndex: 10,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', gap: '12px',
                        }}>
                            <span style={{ fontSize: '28px' }}>⚠️</span>
                            <span style={{ fontSize: '14px', fontFamily: "'DM Sans',sans-serif", color: '#7a6e5f', fontWeight: 300 }}>
                                Couldn't load the map. Check your API key.
                            </span>
                        </div>
                    )}
                    <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
                </div>
    
                {/* Sidebar */}
                <div style={{
                    width: selectedRestaurant ? '300px' : '0px',
                    minWidth: selectedRestaurant ? '300px' : '0px',
                    height: '100%',
                    background: '#faf8f4',
                    borderLeft: '1px solid rgba(60,45,20,0.10)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    transition: 'min-width 0.3s cubic-bezier(0.4,0,0.2,1), width 0.3s cubic-bezier(0.4,0,0.2,1)',
                    position: 'relative',
                    flexShrink: 0,
                }}>
                    {selectedRestaurant && (() => {
                        const { r, avg, recommendPct, reviewCount, ratings } = selectedRestaurant;
                        const numAvg = avg ? parseFloat(avg) : null;
    
                        const fieldLabels = {
                            team_environment: 'Team Environment',
                            shift_availability: 'Shift Availability',
                            pay: 'Pay',
                            staff_workload_ratio: 'Workload',
                        };
    
                        // Per-category averages
                        const categoryAvgs = Object.keys(fieldLabels).map(field => {
                            if (ratings.length === 0) return { label: fieldLabels[field], val: null };
                            const avg = ratings.reduce((s, row) => s + (Number(row[field]) || 0), 0) / ratings.length;
                            return { label: fieldLabels[field], val: avg };
                        });
    
                        return (
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
                                {/* Close button */}
                                <button
                                    onClick={() => setSelectedRestaurant(null)}
                                    style={{
                                        position: 'absolute', top: '14px', right: '14px',
                                        background: 'none', border: 'none',
                                        fontSize: '16px', color: '#a89d8e',
                                        cursor: 'pointer', lineHeight: 1, zIndex: 2,
                                    }}
                                    onMouseOver={e => e.target.style.color = '#1e1a14'}
                                    onMouseOut={e => e.target.style.color = '#a89d8e'}
                                >✕</button>
    
                                {/* Top accent bar */}
                                <div style={{ height: '4px', background: 'linear-gradient(90deg, #2a7a4b, #3dab68)', flexShrink: 0 }} />
    
                                <div style={{ padding: '24px 20px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
    
                                    {/* Name + address */}
                                    <div>
                                        <div style={{
                                            fontSize: '13px', fontWeight: 600,
                                            letterSpacing: '0.12em', textTransform: 'uppercase',
                                            color: '#1e1a14', fontFamily: "'DM Sans',sans-serif",
                                            lineHeight: 1.3, marginBottom: '6px',
                                            paddingRight: '24px',
                                        }}>
                                            {r.name}
                                        </div>
                                        <div style={{
                                            fontSize: '12px', color: '#7a6e5f',
                                            fontFamily: "'DM Sans',sans-serif",
                                            fontWeight: 300, lineHeight: 1.5,
                                        }}>
                                            {r.address}<br />{r.city}, {r.state} {r.zip_code}
                                        </div>
                                    </div>
    
                                    {/* Overall rating */}
                                    {numAvg !== null && (
                                        <div style={{
                                            background: '#f0ece4',
                                            borderRadius: '8px',
                                            padding: '14px 16px',
                                            display: 'flex', alignItems: 'center', gap: '12px',
                                        }}>
                                            <span style={{
                                                fontFamily: "'Bebas Neue',sans-serif",
                                                fontSize: '36px', color: '#2a7a4b', lineHeight: 1,
                                            }}>{avg}</span>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div style={{ display: 'flex', gap: '2px' }}>
                                                    {[1,2,3,4,5].map(i => {
                                                        const diff = numAvg - (i - 1);
                                                        const color = diff >= 0.75 ? '#ffd700' : '#e0e0e0';
                                                        return (
                                                            <span key={i} style={{ fontSize: '16px', color, lineHeight: 1 }}>★</span>
                                                        );
                                                    })}
                                                </div>
                                                <span style={{
                                                    fontSize: '11px', color: '#a89d8e',
                                                    fontFamily: "'DM Sans',sans-serif", fontWeight: 300,
                                                }}>
                                                    {reviewCount} review{reviewCount !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>
                                    )}
    
                                    {/* Would recommend */}
                                    {recommendPct !== null && (
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            padding: '10px 14px',
                                            background: recommendPct >= 60 ? 'rgba(42,122,75,0.08)' : 'rgba(180,60,60,0.06)',
                                            borderRadius: '6px',
                                            border: `1px solid ${recommendPct >= 60 ? 'rgba(42,122,75,0.15)' : 'rgba(180,60,60,0.12)'}`,
                                        }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                                stroke={recommendPct >= 60 ? '#2a7a4b' : '#b43c3c'}
                                                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                {recommendPct >= 60 ? (
                                                    // Thumbs up
                                                    <>
                                                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                                                        <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                                                    </>
                                                ) : (
                                                    // Thumbs down
                                                    <>
                                                        <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
                                                        <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                                                    </>
                                                )}
                                            </svg>
                                            <span style={{
                                                fontSize: '13px', fontFamily: "'DM Sans',sans-serif",
                                                fontWeight: 500, color: recommendPct >= 60 ? '#2a7a4b' : '#b43c3c',
                                            }}>{recommendPct}%</span>
                                            <span style={{
                                                fontSize: '12px', fontFamily: "'DM Sans',sans-serif",
                                                fontWeight: 300, color: '#7a6e5f',
                                            }}>would recommend</span>
                                        </div>
                                    )}
    
                                    {/* Category breakdown */}
                                    {reviewCount > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <span style={{
                                                fontSize: '10px', fontFamily: "'DM Sans',sans-serif",
                                                fontWeight: 500, letterSpacing: '0.18em',
                                                textTransform: 'uppercase', color: '#a89d8e',
                                            }}>Breakdown</span>
                                            {categoryAvgs.map(({ label, val }) => (
                                                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <div style={{
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    }}>
                                                        <span style={{
                                                            fontSize: '11px', fontFamily: "'DM Sans',sans-serif",
                                                            fontWeight: 400, color: '#5a5048',
                                                        }}>{label}</span>
                                                        <span style={{
                                                            fontSize: '11px', fontFamily: "'DM Sans',sans-serif",
                                                            fontWeight: 500, color: '#2a7a4b',
                                                        }}>{val !== null ? val.toFixed(1) : '—'}</span>
                                                    </div>
                                                    <div style={{
                                                        height: '4px', background: '#e8e0d0',
                                                        borderRadius: '2px', overflow: 'hidden',
                                                    }}>
                                                        <div style={{
                                                            height: '100%',
                                                            width: val !== null ? `${(val / 5) * 100}%` : '0%',
                                                            background: 'linear-gradient(90deg, #2a7a4b, #3dab68)',
                                                            borderRadius: '2px',
                                                            transition: 'width 0.5s ease',
                                                        }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
    
                                    {/* Divider */}
                                    <div style={{ height: '1px', background: 'rgba(60,45,20,0.08)' }} />
    
                                    {/* CTA button */}
                                    <button
                                        onClick={() => navigate(`/restaurant/${r.id}`)}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            width: '100%', padding: '14px 18px',
                                            background: '#2a7a4b', border: 'none', borderRadius: '6px',
                                            cursor: 'pointer', transition: 'background 0.2s',
                                            fontFamily: "'DM Sans',sans-serif",
                                        }}
                                        onMouseOver={e => e.currentTarget.style.background = '#3dab68'}
                                        onMouseOut={e => e.currentTarget.style.background = '#2a7a4b'}
                                    >
                                        <span style={{
                                            fontSize: '12px', fontWeight: 500,
                                            letterSpacing: '0.14em', textTransform: 'uppercase',
                                            color: '#fff',
                                        }}>View Restaurant</span>
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
    
            <style>{`
                @keyframes mapSpin {
                    to { transform: rotate(360deg); }
                }
                .gm-style .gm-style-iw-c {
                    border-radius: 8px !important;
                    box-shadow: 0 8px 32px rgba(30,26,20,0.16) !important;
                    border: 1px solid rgba(60,45,20,0.12) !important;
                    padding: 16px 18px !important;
                }
                .gm-style .gm-style-iw-d { overflow: hidden !important; padding: 0 !important; }
                .gm-style .gm-style-iw-chr { height: 0 !important; position: absolute !important; top: 6px !important; right: 6px !important; }
                .gm-style .gm-ui-hover-effect { width: 24px !important; height: 24px !important; opacity: 0.4 !important; }
                .gm-style .gm-ui-hover-effect:hover { opacity: 0.8 !important; }
                .gm-style .gm-ui-hover-effect img { width: 14px !important; height: 14px !important; }
            `}</style>
        </div>
    );
};

export default RestaurantMap;