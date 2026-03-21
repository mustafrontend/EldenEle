'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon issue in Next.js
delete L.Icon.Default.prototype._getIconUrl;

const createCustomIcon = (listing) => {
    const imageUrl = listing.photos && listing.photos.length > 0 ? listing.photos[0] : null;

    let innerHtml = '';
    if (imageUrl) {
        innerHtml = `<img src="${imageUrl}" class="pin-img" />`;
    } else {
        // İlana özel emoji (Pati, hediye vb)
        let emoji = '📍';
        if (listing.concept === 'sahiplendirme') emoji = '🐾';
        else if (listing.concept === 'bedelsiz') emoji = '🎁';
        else if (listing.concept === 'yetenek') emoji = '🧠';
        else if (listing.concept === 'ödünç') emoji = '⏳';
        innerHtml = `<div class="pin-icon">${emoji}</div>`;
    }

    // Seçili pini hafif öne çıkarmak için
    const isFeatured = listing.userIsFeatured ? 'featured-pin' : '';

    return L.divIcon({
        className: `custom-map-marker ${isFeatured}`,
        html: `<div class="pin-container">${innerHtml}</div><div class="pin-shadow"></div>`,
        iconSize: [40, 46],
        iconAnchor: [20, 46],
        popupAnchor: [0, -40]
    });
};

// Basic static coordinates for major Turkish cities (adjusted slightly inland)
const cityCoordinates = {
    "İstanbul": [41.0450, 28.9950], // Mapped to Şişli/Beşiktaş region, safely inland
    "Ankara": [39.9334, 32.8597],
    "İzmir": [38.4237, 27.1428],    // Mapped towards Konak/Alsancak inner ring
    "Bursa": [40.1824, 29.0671],
    "Antalya": [36.9081, 30.6955],  // Mapped slightly north towards Kepez away from cliffs
    "Adana": [37.0000, 35.3213],
    "Konya": [37.8746, 32.4932],
    "Gaziantep": [37.0662, 37.3833],
    "Şanlıurfa": [37.1673, 38.7955],
    "Kocaeli": [40.8533, 29.8815],
    "Mersin": [36.8121, 34.6415],
    "Eskişehir": [39.7767, 30.5206],
    "Kayseri": [38.7312, 35.4787],
    "Samsun": [41.2750, 36.3200],   // Moved slightly inland from the coastal highway
    "Balıkesir": [39.6484, 27.8826],
};

// İlçe (District) bazlı daha spesifik koordinatlar (Özellikle büyükşehirler için)
const districtCoordinates = {
    // İstanbul
    "Kadıköy": [40.9900, 29.0200],
    "Ataşehir": [40.9840, 29.1060],
    "Üsküdar": [41.0260, 29.0150],
    "Beşiktaş": [41.0430, 29.0060],
    "Şişli": [41.0600, 28.9870],
    "Maslak": [41.1090, 29.0210],

    // Ankara
    "Çankaya": [39.9000, 32.8600],
    "Etimesgut": [39.9400, 32.6700],
    "Yenimahalle": [39.9600, 32.8000],
    "Bahçelievler": [39.9190, 32.8250],

    // İzmir
    "Konak": [38.4180, 27.1280],
    "Karşıyaka": [38.4550, 27.1120],
    "Bornova": [38.4610, 27.2180],

    // Diğer popüler ilçeler
    "Nilüfer": [40.2180, 28.9480],      // Bursa
    "Muratpaşa": [36.8850, 30.7050],    // Antalya
    "Konyaaltı": [36.8720, 30.6380],    // Antalya
    "Kaş": [36.2000, 29.6380],          // Antalya
    "Seyhan": [36.9850, 35.3050],       // Adana
    "Selçuklu": [37.9350, 32.4950],     // Konya
    "Tepebaşı": [39.7750, 30.5000],     // Eskişehir
    "Atakum": [41.3320, 36.2750],       // Samsun
    "Bodrum": [37.0340, 27.4300],       // Muğla
    "Fethiye": [36.6200, 29.1160],      // Muğla
};

function ChangeView({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

export default function MapView({ listings = [], users = [], userCoords = null }) {
    // Determine center based on user location or listings
    let center = userCoords ? [userCoords.lat, userCoords.lng] : [39.0, 35.0];
    let zoom = userCoords ? 12 : 5;

    const mappedUsers = users.map(u => {
        if (!u.location) return null;
        // Jitter to avoid exact overlap
        const offsetLat = (Math.random() - 0.5) * 0.002;
        const offsetLng = (Math.random() - 0.5) * 0.002;
        return {
            ...u,
            isUser: true,
            coords: [u.location.lat + offsetLat, u.location.lng + offsetLng]
        };
    }).filter(Boolean);

    // Filter out listings without valid city mapping
    const mappedListings = listings.map(l => {
        let coords = null;
        if (l.district && districtCoordinates[l.district]) {
            coords = districtCoordinates[l.district];
        } else if (l.city && cityCoordinates[l.city]) {
            coords = cityCoordinates[l.city];
        }

        if (coords) {
            const offsetLat = (Math.random() - 0.5) * 0.006;
            const offsetLng = (Math.random() - 0.5) * 0.006;
            return {
                ...l,
                coords: [coords[0] + offsetLat, coords[1] + offsetLng]
            };
        }
        return null;
    }).filter(Boolean);

    // If both are present, merge for display
    const itemsToShow = [...mappedListings, ...mappedUsers];

    return (
        <div className="w-full h-full bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
            <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                <ChangeView center={center} zoom={zoom} />
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                {/* Current User Marker */}
                {userCoords && (
                    <Marker position={[userCoords.lat, userCoords.lng]} icon={L.divIcon({
                        className: 'user-marker',
                        html: '<div class="w-6 h-6 bg-indigo-600 border-4 border-white rounded-full shadow-lg shadow-indigo-300 animate-pulse"></div>',
                        iconSize: [24, 24],
                        iconAnchor: [12, 12]
                    })}>
                        <Popup>Buradasınız 📍</Popup>
                    </Marker>
                )}

                {itemsToShow.map(item => (
                    <Marker key={item.id} position={item.coords} icon={createCustomIcon(item.isUser ? { ...item, concept: 'user' } : item)}>
                        <Popup className="custom-popup">
                            {item.isUser ? (
                                <div className="p-2 w-40 text-center">
                                    <div className="w-12 h-12 mx-auto rounded-full overflow-hidden bg-slate-100 mb-2 border border-slate-200">
                                        {item.photoURL ? <img src={item.photoURL} className="w-full h-full object-cover" /> : <span className="text-xl">👤</span>}
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm">{item.displayName}</h4>
                                    <p className="text-[10px] text-slate-500 uppercase font-black">{item.city || 'Yakınlarda'}</p>
                                    <Link href="/yakinimdakiler" className="block mt-2 py-1 px-3 bg-indigo-600 text-white text-[10px] font-bold rounded-lg uppercase tracking-widest">Profili Gör</Link>
                                </div>
                            ) : (
                                <a href={`/ilan/${item.id}`} className="block w-48 no-underline group">
                                    <div className="h-24 bg-slate-100 rounded-t-xl overflow-hidden mb-2 relative">
                                        {item.userIsFeatured && (
                                            <div className="absolute top-1 right-1 z-[100] bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-sm">
                                                Vitrin
                                            </div>
                                        )}
                                        {item.photos && item.photos.length > 0 ? (
                                            <img src={item.photos[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">Resim Yok</div>
                                        )}
                                    </div>
                                    <div className="px-2 pb-2">
                                        <h4 className="font-bold text-slate-900 text-sm line-clamp-1 mb-1 group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                                        <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">{item.category}</span>
                                        <div className="text-[10px] text-slate-500 mt-2 line-clamp-2">{item.description}</div>
                                    </div>
                                </a>
                            )}
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {itemsToShow.length === 0 && !userCoords && (
                <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/80 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 text-center">
                        <span className="text-4xl block mb-2">🌍</span>
                        <h4 className="font-bold text-slate-800">Haritada Gösterilecek Sonuç Yok</h4>
                        <p className="text-sm text-slate-500 mt-1">Seçtiğiniz şehirlere ait kayıtlı konum bulunamadı.<br />Lütfen filtreleri değiştirin.</p>
                    </div>
                </div>
            )}

        </div>
    );
}
