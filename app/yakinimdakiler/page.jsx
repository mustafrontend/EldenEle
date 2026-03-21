'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { updateUserLocation, getNearbyPeople } from '../../lib/listingService';
import AppHeader from '../../components/AppHeader';
import NearbyUserCard from '../../components/NearbyUserCard';
import PetLoading from '../../components/PetLoading';
import dynamic from 'next/dynamic';

const DynamicMapView = dynamic(() => import('../../components/MapView'), { ssr: false });

export default function NearbyPeoplePage() {
    const { user } = useAuth();
    const [status, setStatus] = useState('idle'); // idle, locating, loading, ready, error
    const [coords, setCoords] = useState(null);
    const [nearbyUsers, setNearbyUsers] = useState([]);

    const findMe = () => {
        if (!navigator.geolocation) {
            alert('Tarayıcınız konum özelliğini desteklemiyor.');
            return;
        }

        setStatus('locating');
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setCoords({ lat: latitude, lng: longitude });
                setStatus('loading');

                if (user) {
                    await updateUserLocation(user.uid, { lat: latitude, lng: longitude });
                }

                const users = await getNearbyPeople(user?.uid, latitude, longitude);
                setNearbyUsers(users);
                setStatus('ready');
            },
            () => {
                setStatus('error');
            }
        );
    };

    return (
        <main className="min-h-screen bg-slate-50 pb-24">
            <AppHeader />

            <div className="max-w-7xl mx-auto px-4 pt-8">
                {/* Hero / Header Section */}
                <div className="bg-gradient-to-br from-indigo-700 to-indigo-600 rounded-[2.5rem] p-8 md:p-12 mb-8 shadow-2xl shadow-indigo-200 relative overflow-hidden">
                    <div className="relative z-10 max-w-2xl">
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-black uppercase tracking-widest mb-4 border border-white/10">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
                            Canlı Patimetre
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight leading-none">
                            Yakınındaki Patili <br /> <span className="text-indigo-200">Dostları Keşfet</span>
                        </h1>
                        <p className="text-indigo-100 text-sm md:text-base font-medium mb-8 leading-relaxed opacity-90">
                            Konumunu paylaşarak çevrendeki evcil hayvan sahipleriyle tanışabilir, arkadaşlık isteği gönderebilir ve pati dünyasını büyütebilirsin.
                        </p>

                        {status === 'idle' && (
                            <button
                                onClick={findMe}
                                className="bg-white text-indigo-700 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                            >
                                📍 Yakınımdakileri Bul
                            </button>
                        )}
                    </div>

                    {/* Floating Decorative Elements */}
                    <div className="absolute right-[-5%] top-[-10%] text-[180px] opacity-10 rotate-12 select-none pointer-events-none">🐾</div>
                    <div className="absolute right-[15%] bottom-[-10%] text-[120px] opacity-10 -rotate-12 select-none pointer-events-none">🦴</div>
                </div>

                {status === 'locating' || status === 'loading' ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <PetLoading />
                        <p className="mt-4 text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">
                            {status === 'locating' ? 'Konumun Belirleniyor...' : 'Yakındaki Canlar Getiriliyor...'}
                        </p>
                    </div>
                ) : status === 'ready' ? (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mesafe</span>
                                <span className="text-xl font-black text-slate-900">50 KM Çap</span>
                            </div>
                            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bulunan Kişi</span>
                                <span className="text-xl font-black text-indigo-600">{nearbyUsers.length} Üye</span>
                            </div>
                        </div>

                        {/* Map Section */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Patimetre Haritası</h2>
                            </div>
                            <div className="h-[400px] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200 border-4 border-white">
                                <DynamicMapView
                                    users={nearbyUsers}
                                    userCoords={coords}
                                />
                            </div>
                        </div>

                        {/* User List */}
                        <div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-6">Yeni Pati Arkadaşlarım</h2>
                            {nearbyUsers.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {nearbyUsers.map(u => (
                                        <NearbyUserCard key={u.id} user={u} currentUserId={user?.uid} />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300">
                                    <span className="text-5xl block mb-4">🏜️</span>
                                    <h3 className="text-lg font-bold text-slate-800">Şimdilik Kimse Yok</h3>
                                    <p className="text-slate-500 text-sm mt-1">Yakınlarında henüz konum paylaşan bir pati sever bulunamadı.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : status === 'error' ? (
                    <div className="bg-rose-50 border border-rose-100 p-8 rounded-3xl text-center">
                        <span className="text-4xl block mb-2">🚫</span>
                        <h3 className="text-rose-900 font-bold">Konum İzni Gerekli</h3>
                        <p className="text-rose-600 text-sm mt-2 mb-6">Yakınınızdaki kişileri görebilmek için konum izni vermeniz gerekmektedir.</p>
                        <button onClick={findMe} className="bg-rose-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm">Tekrar Dene</button>
                    </div>
                ) : null}
            </div>
        </main>
    );
}
