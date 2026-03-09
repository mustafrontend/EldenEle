'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/AuthContext';
import { subscribeMessages } from '../lib/listingService';
import { requestPushPermission } from '../lib/notificationService';
import NotificationsDropdown from './NotificationsDropdown';

export default function AppHeader({ onSearch }) {
    const router = useRouter();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [activeUsers, setActiveUsers] = useState(142);

    useEffect(() => {
        // Pseudo-random active users fluctuation
        const interval = setInterval(() => {
            setActiveUsers(prev => prev + Math.floor(Math.random() * 5) - 2);
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!user) return;

        // Push Notification izni iste ve token'ı kaydet
        requestPushPermission(user.uid);

        const unsub = subscribeMessages(user.uid, (msgs) => {
            const count = msgs.filter(m => m.receiverId === user.uid && !m.read).length;
            setUnreadMessages(count);
        });
        return () => unsub();
    }, [user]);

    function doSearch(val) {
        setSearchQuery(val);
        if (onSearch) onSearch(val);
    }

    function goCreate() {
        if (!user) router.push('/giris');
        else router.push('/ilan-olustur');
    }

    return (
        <>
            {/* Mobile Top Header - Premium Slim Version */}
            <header className="sm:hidden sticky top-0 z-[60] bg-white/80 backdrop-blur-2xl border-b border-slate-100 flex items-center justify-between px-5 py-3.5">
                <Link href="/" className="flex items-center gap-2 active:scale-95 transition-all">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
                        <span className="text-white font-black text-lg italic pr-0.5">E</span>
                    </div>
                    <span className="font-black text-lg text-slate-900 tracking-tight">
                        EldenEle<span className="text-orange-500 font-extrabold">.pet</span>
                    </span>
                </Link>

                <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/10 px-3 py-1.5 rounded-full">
                    <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </div>
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-tight">
                        {activeUsers} AKTİF
                    </span>
                </div>
            </header>

            {/* Desktop Top Header */}
            <header className="hidden sm:block sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-2 sm:gap-4">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center shadow-md transform group-hover:scale-105 transition-all">
                            <span className="text-white font-black text-xl italic pr-0.5">E</span>
                        </div>
                        <div className="hidden sm:flex flex-col">
                            <span className="font-black text-xl text-slate-900 tracking-tighter leading-none">
                                EldenEle<span className="text-orange-500 font-black">.pet</span>
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] text-slate-400 font-black tracking-[0.2em] uppercase">Hayvan Dayanışma Ağı</span>
                                <div className="flex items-center gap-1.5 bg-orange-50/50 border border-orange-100/50 px-2 py-0.5 rounded-full">
                                    <div className="relative flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-500"></span>
                                    </div>
                                    <span className="text-[9px] font-mono font-black text-orange-600 tracking-tight">{activeUsers} AKTİF</span>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Search */}
                    <div className="hidden sm:flex flex-1 min-w-[100px] max-w-xl relative mx-2">
                        <div className="flex w-full items-center bg-gray-50 border border-gray-200 rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 focus-within:border-indigo-500 focus-within:bg-white focus-within:shadow-sm transition-all shadow-inner">
                            <svg className="w-4 h-4 text-gray-400 mr-1.5 sm:mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                value={searchQuery}
                                onChange={(e) => doSearch(e.target.value)}
                                type="text"
                                placeholder="İlan ara..."
                                className="flex-1 w-full min-w-0 bg-transparent text-[13px] sm:text-sm text-gray-800 placeholder-gray-400 outline-none"
                            />
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                        {user ? (
                            <>
                                <Link href="/profil?tab=mesajlarim" className="relative p-2 rounded-md hover:bg-gray-100 transition-colors">
                                    <svg className="w-5 h-5 text-gray-500 hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 3H3a2 2 0 00-2 2v14a2 2 0 002 2h18a2 2 0 002-2V5a2 2 0 00-2-2z" />
                                    </svg>
                                    {unreadMessages > 0 && (
                                        <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white"></span>
                                        </span>
                                    )}
                                </Link>
                                <NotificationsDropdown />
                                <Link href="/profil" className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors">
                                    <div className="w-7 h-7 rounded-md bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                                        <span className="text-indigo-700 text-xs font-bold">
                                            {(user.displayName || user.email || 'U')[0].toUpperCase()}
                                        </span>
                                    </div>
                                    <span className="hidden md:block text-sm font-medium text-slate-700">
                                        {user.displayName || 'Profil'}
                                    </span>
                                </Link>
                            </>
                        ) : (
                            <Link href="/giris" className="px-2 sm:px-4 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors whitespace-nowrap">
                                Giriş Yap
                            </Link>
                        )}

                        <button
                            onClick={goCreate}
                            className="hidden sm:flex items-center gap-2.5 px-6 py-2.5 rounded-xl bg-orange-500 text-white font-black text-[11px] uppercase tracking-[0.15em] shadow-lg shadow-orange-100 hover:bg-orange-600 hover:scale-[1.02] active:scale-[0.96] transition-all ml-2 group"
                        >
                            <div className="w-4 h-4 bg-white/20 rounded-md flex items-center justify-center">
                                <span className="text-white font-black text-[10px] italic pr-[1px]">E</span>
                            </div>
                            <span>İlan Yayınla</span>
                        </button>
                    </div>
                </div>

                {/* Desktop Quick Actions Row */}
                <div className="hidden sm:block border-t border-gray-100 bg-gray-50/50">
                    <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                        {[
                            { href: "/ilan-olustur?hizli=sahiplendirme", color: "orange", icon: "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z", label: "Yuva Bul", sub: "Sahiplendirme" },
                            { href: "/ilan-olustur?hizli=sahiplenmek-istiyorum", color: "rose", icon: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a5.946 5.946 0 00-.942 3.197M12 10.5a3 3 0 110-6 3 3 0 010 6zM4.5 9.375a3 3 0 110-6 3 3 0 010 6zm15 0a3 3 0 110-6 3 3 0 010 6z", label: "Yuva Ol", sub: "Dost Sahiplen" },
                            { href: "/ilan-olustur?hizli=ciftlestirme", color: "purple", icon: "M11.649 6.79c.462-4.474 5.936-4.474 6.399 0 .34 3.295-3.199 4.316-3.199 4.316s-3.54-1.021-3.2-4.316zm-7.649 0c.462-4.474 5.936-4.474 6.399 0 .34 3.295-3.199 4.316-3.199 4.316s-3.54-1.021-3.2-4.316zm10 12.21c0 2.502-1.921 4.532-4.312 4.532-1.936 0-3.597-1.341-4.312-3.28m8.624 0c0-1.939-1.663-3.28-4.312-3.28-2.649 0-4.312 1.341-4.312 3.28", label: "Eş Bul", sub: "Çiftleştirme" },
                            { href: "/ilan-olustur?hizli=otel", color: "indigo", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", label: "Pati Oteli", sub: "Bakıcı / Otel" },
                            { href: "/ilan-olustur?hizli=kayip", color: "red", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", label: "Kayıp", sub: "Acil İhbar" },
                            { href: "/ilan-olustur?hizli=transfer", color: "cyan", icon: "M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.091-1.123l-.208-3.33a5.158 5.158 0 00-4.707-4.823l-2.001-.168M16.5 18.75V11.25m-10.5 6V11.25m-3 0h16.5", label: "Nakil", sub: "Pati Taksi" },
                            { href: "/ilan-olustur?hizli=kan-bagisi", color: "red", icon: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z", label: "Kan Bağışı", sub: "Donör Arayışı" },
                        ].map((link, idx) => (
                            <Link key={idx} href={link.href} className="flex-1 flex items-center gap-3 p-2.5 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all group">
                                <div className={`w-9 h-9 rounded-full bg-${link.color}-500/10 text-${link.color}-600 flex items-center justify-center group-hover:bg-${link.color}-600 group-hover:text-white transition-colors`}>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                                    </svg>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[13px] font-bold text-slate-800">{link.label}</span>
                                    <span className="text-[10px] text-slate-500 font-medium">{link.sub}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </header>

            {/* Mobile Bottom Bar */}
            <div
                className="sm:hidden fixed bottom-0 left-0 right-0 w-full z-[9999] bg-white border-t border-slate-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
                style={{ bottom: 0, left: 0, right: 0, margin: 0, borderRadius: 0 }}
            >
                <div className="flex items-center justify-around h-[72px] px-2 relative">
                    <Link href="/" className="flex flex-col items-center justify-center flex-1 h-full text-orange-600 active:scale-95 transition-transform">
                        <svg className="w-6 h-6 mb-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span className="text-[10px] font-black uppercase tracking-tighter">KEŞFET</span>
                    </Link>

                    <div className="flex flex-col items-center justify-center flex-1 h-full text-slate-400 hover:text-orange-600 active:scale-95 transition-transform cursor-pointer">
                        <svg className="w-6 h-6 mb-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className="text-[10px] font-bold uppercase tracking-tighter">ARA</span>
                    </div>

                    {/* MINIMALIST ILAN VER BUTONU - PREMIUM ORANGE */}
                    <div className="relative -top-6 flex flex-col items-center justify-center group">
                        <button
                            onClick={goCreate}
                            className="relative w-15 h-15 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-[0_10px_25px_rgba(234,88,12,0.3)] hover:shadow-[0_15px_35px_rgba(234,88,12,0.4)] hover:-translate-y-1 active:scale-90 transition-all duration-300 z-10"
                        >
                            {/* High-Fidelity Dog Silhouette */}
                            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                                <span className="text-white font-black text-2xl italic pr-0.5">E</span>
                            </div>
                        </button>
                        <span className="text-[9px] font-black text-slate-800 mt-2.5 uppercase tracking-[0.15em] leading-none bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 shadow-sm">İLAN VER</span>
                    </div>

                    <Link href="/profil?tab=mesajlarim" className="relative flex flex-col items-center justify-center flex-1 h-full text-slate-400 hover:text-orange-600 active:scale-95 transition-transform">
                        <svg className="w-6 h-6 mb-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 3H3a2 2 0 00-2 2v14a2 2 0 002 2h18a2 2 0 002-2V5a2 2 0 00-2-2z" />
                        </svg>
                        <span className="text-[10px] font-bold uppercase tracking-tighter">SOHBET</span>
                        {unreadMessages > 0 && (
                            <span className="absolute top-2 right-4 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500 border-2 border-white"></span>
                            </span>
                        )}
                    </Link>

                    <Link href="/profil" className="flex flex-col items-center justify-center flex-1 h-full text-slate-400 hover:text-orange-600 active:scale-95 transition-transform">
                        <div className="w-7 h-7 mb-1 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                            {user?.photoURL ? (
                                <img src={user.photoURL} alt="Profil" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-slate-600 text-[10px] font-black">
                                    {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-tighter">SAYFAM</span>
                    </Link>
                </div>
            </div>
        </>
    );
}