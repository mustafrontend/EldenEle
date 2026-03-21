'use client';

import { useState, useEffect, useMemo } from 'react';
import { getDiscoverUsers, sendFriendRequest } from '../lib/listingService';
import { useAuth } from '../lib/AuthContext';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function FriendFinder() {
    const { user, userData } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sentRequests, setSentRequests] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        async function load() {
            setLoading(true);
            const data = await getDiscoverUsers(1000);
            setUsers(data);
            setLoading(false);
        }
        load();
    }, []);

    // Client-side search & filter
    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) return users;
        const q = searchQuery.toLowerCase();
        return users.filter(u =>
            (u.displayName || '').toLowerCase().includes(q) ||
            (u.city || '').toLowerCase().includes(q)
        );
    }, [users, searchQuery]);

    const handleAddFriend = async (targetId) => {
        if (!user) {
            toast.error('Lütfen önce giriş yapın.');
            return;
        }

        // Mandatory Profile Photo & AI Verification Check
        const hasPhoto = userData?.photoURL || user?.photoURL;

        if (!hasPhoto) {
            toast.error('Arkadaş eklemek için önce profil fotoğrafı yüklemelisiniz! 📸', { duration: 4000 });
            router.push('/profil');
            return;
        }

        // isHumanVerified only exists in userData (Firestore)
        if (userData && !userData.isHumanVerified) {
            toast.error('Profil fotoğrafınızın AI tarafından doğrulanması gerekiyor! 🛡️', { duration: 4000 });
            router.push('/profil');
            return;
        }

        try {
            const res = await sendFriendRequest(user.uid, targetId);
            if (res?.error) {
                toast.error(res.error);
            } else {
                toast.success('Pati arkadaşlık isteği gönderildi! 🐾');
                setSentRequests([...sentRequests, targetId]);
            }
        } catch (e) {
            toast.error('Bir hata oluştu.');
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Pati Severler Aranıyor...</p>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
                <div className="relative z-10 max-w-xl">
                    <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">Pati Dünyasını Keşfet 🌍</h2>
                    <p className="text-indigo-100 text-base font-medium opacity-80 leading-relaxed">
                        {users.length} aktif pati sever arasından yeni dostluklar kurmaya hazır mısın? 🐾
                    </p>
                </div>
                <div className="absolute -right-10 -bottom-10 text-[12rem] opacity-[0.07] rotate-12 pointer-events-none">✨</div>
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 blur-[120px] rounded-full"></div>
            </div>

            {/* Premium Search Box */}
            <div className="relative group max-w-2xl mx-auto -mt-16 z-20">
                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                    <svg className="w-6 h-6 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Pati arkadaşı bul (İsim veya Şehir)..."
                    className="w-full bg-white border border-slate-100 rounded-[2rem] py-6 pl-16 pr-8 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all shadow-xl shadow-slate-200/50"
                />
            </div>

            {/* Grid of Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pt-4">
                {filteredUsers.map(u => (
                    <div key={u.id} className="bg-white rounded-[3rem] border-[0.5px] border-slate-200/60 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(79,70,229,0.08)] hover:-translate-y-2 transition-all duration-700 group relative flex flex-col items-center text-center">
                        {/* Premium Glass Accent */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/30 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-100/40 transition-colors"></div>

                        {/* Avatar Section - Mockup Style */}
                        <div className="relative z-10 mb-6 mt-2">
                            <Link href={`/profil/${u.id}`} className="block relative">
                                <div className="w-28 h-28 rounded-[2.8rem] overflow-hidden bg-slate-50 border-[0.5px] border-slate-200 shadow-inner group-hover:scale-105 transition-all duration-700 p-1.5 bg-white">
                                    <div className="w-full h-full rounded-[2.2rem] overflow-hidden relative">
                                        {u.photoURL ? (
                                            <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-4xl font-black text-slate-200/60 bg-slate-50">
                                                {(u.displayName || 'P')[0].toUpperCase()}
                                            </div>
                                        )}
                                        {/* Organic Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none"></div>
                                    </div>
                                </div>

                                {/* Status Indicator - Large & Vibrant */}
                                <div className="absolute bottom-1 right-1 w-8 h-8 bg-white rounded-full p-1.5 shadow-xl group-hover:scale-110 transition-transform duration-500">
                                    <div className="w-full h-full bg-emerald-500 rounded-full border-2 border-white shadow-inner animate-pulse"></div>
                                </div>
                            </Link>
                        </div>

                        {/* User Content - Editorial Style */}
                        <div className="relative z-10 mb-8 space-y-2">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                                {u.displayName || 'Anonim Pati Sever'}
                            </h3>
                            <div className="flex flex-col items-center gap-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{u.city || 'Topluluk Üyesi'}</span>
                                    <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                    <span className="text-[10px] font-black text-indigo-500/80 uppercase tracking-[0.2em]">Aktif</span>
                                </div>
                                <div className="px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Pati Dostu • %98</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Section - Floating Style Button */}
                        <div className="w-full mt-auto relative z-10">
                            <button
                                onClick={() => handleAddFriend(u.id)}
                                disabled={sentRequests.includes(u.id)}
                                className={`group/btn relative w-full py-4 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-[0.95] overflow-hidden ${sentRequests.includes(u.id)
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
                                        : 'bg-indigo-600 text-white shadow-[0_10px_20px_-5px_rgba(79,70,229,0.3)] hover:shadow-[0_15px_25px_-5px_rgba(79,70,229,0.4)] hover:-translate-y-1'
                                    }`}
                            >
                                <div className="relative z-10 flex items-center justify-center gap-2">
                                    {sentRequests.includes(u.id) ? (
                                        <>
                                            <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            Gönderildi
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-lg leading-none mt-[-2px] group-hover/btn:rotate-90 transition-transform">+</span>
                                            Arkadaş Ekle
                                        </>
                                    )}
                                </div>

                                {/* Shine Effect */}
                                {!sentRequests.includes(u.id) && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredUsers.length === 0 && (
                <div className="text-center py-32 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
                        <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">Kimseyi Bulamadık</h3>
                    <p className="text-slate-500 font-medium">"{searchQuery}" aramasına uygun bir pati sever bulunamadı.</p>
                </div>
            )}
        </div>
    );
}
