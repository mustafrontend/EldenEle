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

export default function MapView({ listings }) {
    // Determine center based on listings or default to Turkey center
    let center = [39.0, 35.0];
    let zoom = 5;

    // Filter out listings without valid city mapping to avoid throwing them randomly
    const mappedListings = listings.map(l => {
        // Öncelik ilçe (district), bulunamazsa şehir (city)
        let coords = null;
        if (l.district && districtCoordinates[l.district]) {
            coords = districtCoordinates[l.district];
        } else if (l.city && cityCoordinates[l.city]) {
            coords = cityCoordinates[l.city];
        }

        // Eğer koordinat bulunduysa üst üste binmesin diye çok ufak sapma ekle
        if (coords) {
            // Koordinat sapmasını (jitter) 0.05'ten 0.005'e çektik (~500 metre). 
            // Sahil kenarındaki şehirlerde (Antalya, İzmir) 5km'lik sapma haritada ilanları denize düşürüyordu.
            const offsetLat = (Math.random() - 0.5) * 0.006;
            const offsetLng = (Math.random() - 0.5) * 0.006;
            return {
                ...l,
                coords: [coords[0] + offsetLat, coords[1] + offsetLng]
            };
        }
        return null;
    }).filter(Boolean);

    if (mappedListings.length === 1) {
        center = mappedListings[0].coords;
        zoom = 10;
    }

    return (
        <div className="w-full h-[600px] bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
            <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                <ChangeView center={center} zoom={zoom} />
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                {mappedListings.map(listing => (
                    <Marker key={listing.id} position={listing.coords} icon={createCustomIcon(listing)}>
                        <Popup className="custom-popup">
                            <a href={`/ilan/${listing.id}`} className="block w-48 no-underline group">
                                <div className="h-24 bg-slate-100 rounded-t-xl overflow-hidden mb-2 relative">
                                    {listing.userIsFeatured && (
                                        <div className="absolute top-1 right-1 z-[100] bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-sm">
                                            Vitrin
                                        </div>
                                    )}
                                    {listing.photos && listing.photos.length > 0 ? (
                                        <img src={listing.photos[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">Resim Yok</div>
                                    )}
                                </div>
                                <div className="px-2 pb-2">
                                    <h4 className="font-bold text-slate-900 text-sm line-clamp-1 mb-1 group-hover:text-indigo-600 transition-colors">{listing.title}</h4>
                                    <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">{listing.category}</span>
                                    <div className="text-[10px] text-slate-500 mt-2 line-clamp-2">{listing.description}</div>
                                </div>
                            </a>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {mappedListings.length === 0 && (
                <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/80 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 text-center">
                        <span className="text-4xl block mb-2">🌍</span>
                        <h4 className="font-bold text-slate-800">Haritada Gösterilecek Sonuç Yok</h4>
                        <p className="text-sm text-slate-500 mt-1">Seçtiğiniz şehirlere ait kayıtlı konum bulunamadı.<br />Lütfen filtreleri değiştirin.</p>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .leaflet-popup-content-wrapper {
                    padding: 0;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                }
                .leaflet-popup-content {
                    margin: 0;
                    line-height: 1.4;
                }
                
                /* Custom Map Pins (Dropshape) */
                .custom-map-marker {
                    position: relative;
                }
                
                .pin-container {
                    width: 38px;
                    height: 38px;
                    border-radius: 50% 50% 50% 0;
                    background: #fff;
                    position: absolute;
                    transform: rotate(-45deg);
                    left: 50%;
                    top: 50%;
                    margin: -23px 0 0 -19px;
                    box-shadow: 0 6px 12px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1);
                    border: 2.5px solid #fff;
                    overflow: hidden;
                    z-index: 2;
                    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                
                /* Hover effect for pins */
                .custom-map-marker:hover .pin-container {
                    transform: rotate(-45deg) scale(1.15);
                    border-color: #4f46e5;
                    box-shadow: 0 8px 16px rgba(79, 70, 229, 0.3);
                }

                .featured-pin .pin-container {
                    border-color: #f97316; /* Orange border for featured */
                    box-shadow: 0 6px 12px rgba(249, 115, 22, 0.3);
                }

                .pin-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    /* Un-rotate the image so it stands straight inside the rotated dropshape */
                    transform: rotate(45deg) scale(1.4);
                }

                .pin-icon {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    /* Un-rotate the icon */
                    transform: rotate(45deg);
                    font-size: 18px;
                    background: #f8fafc;
                }
                
                .pin-shadow {
                    width: 14px;
                    height: 6px;
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 50%;
                    position: absolute;
                    bottom: -20px;
                    left: 50%;
                    margin-left: -7px;
                    filter: blur(2px);
                }
            `}</style>
        </div>
    );
}
