'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/AuthContext';
import { subscribeMessages } from '../lib/listingService';
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
            {/* Mobile Top Header (Growth Hack: Live Indicator) */}
            <header className="sm:hidden sticky top-0 z-[60] bg-white/95 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-4 py-3 shadow-sm">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center shadow-md">
                        <span className="text-white font-black text-lg italic pr-0.5">E</span>
                    </div>
                    <span className="font-extrabold text-[17px] text-slate-900 tracking-tight">
                        EldenEle<span className="text-orange-500 font-extrabold">.pet</span>
                    </span>
                </Link>

                {/* Live Indicator (FOMO trigger) */}
                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-full shadow-sm active:scale-95 transition-transform">
                    <div className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 tracking-tight">
                        {activeUsers} aktif
                    </span>
                </div>
            </header>

            {/* Desktop Top Header (Hidden on Mobile) */}
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

                    {/* Search - Hidden on very small screens, shown otherwise */}
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

                    {/* Right Actions - Hidden on mobile, moved to bottom bar */}
                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                        {user ? (
                            <>
                                {/* Messages */}
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
                                {/* Profile */}
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

                        {/* İlan Ver (Gizli mobilde, aşağıda büyük buton var) */}
                        <button onClick={goCreate} className="hidden sm:flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-md bg-indigo-600 text-white font-bold text-sm shadow-sm hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all ml-1 shrink-0">
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="hidden sm:block">Ücretsiz İlan Ver</span>
                        </button>
                    </div>
                </div>

                {/* Desktop Quick Actions Row */}
                <div className="hidden sm:block border-t border-gray-100 bg-gray-50/50">
                    <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                        <Link href="/ilan-olustur?hizli=sahiplendirme" className="flex-1 flex items-center gap-3 p-2.5 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all group">
                            <div className="w-9 h-9 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[13px] font-bold text-slate-800">Yuva İlanı</span>
                                <span className="text-[10px] text-slate-500 font-medium">Sahiplendirme</span>
                            </div>
                        </Link>

                        <Link href="/ilan-olustur?hizli=bedelsiz" className="flex-1 flex items-center gap-3 p-2.5 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all group">
                            <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[13px] font-bold text-slate-800">Mama/Eşya Ver</span>
                                <span className="text-[10px] text-slate-500 font-medium">Bedelsiz Yardım</span>
                            </div>
                        </Link>

                        <Link href="/?tab=community" className="flex-1 flex items-center gap-3 p-2.5 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all group">
                            <div className="w-9 h-9 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[13px] font-bold text-slate-800">Pati Sor / Yardım</span>
                                <span className="text-[10px] text-slate-500 font-medium">Topluluk</span>
                            </div>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Mobile Bottom Bar (Fixed Bottom - Forced to 0) */}
            <div
                className="sm:hidden fixed bottom-0 left-0 right-0 w-full z-[9999] bg-white border-t border-slate-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
                style={{ bottom: 0, left: 0, right: 0, margin: 0, borderRadius: 0 }}
            >
                <div className="flex items-center justify-around h-[72px] px-2 relative">
                    {/* Ana Sayfa */}
                    <Link href="/" className="flex flex-col items-center justify-center flex-1 h-full text-orange-600 active:scale-95 transition-transform">
                        <svg className="w-6 h-6 mb-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span className="text-[10px] sm:text-[11px] font-black line-clamp-1 truncate w-full text-center px-1 uppercase tracking-tighter">KEŞFET</span>
                    </Link>

                    {/* Arama Modülü */}
                    <div className="flex flex-col items-center justify-center flex-1 h-full text-slate-400 hover:text-orange-600 active:scale-95 transition-transform cursor-pointer">
                        <svg className="w-6 h-6 mb-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className="text-[10px] sm:text-[11px] font-bold line-clamp-1 truncate w-full text-center px-1 uppercase tracking-tighter">ARA</span>
                    </div>

                    {/* İlan Ver Büyük Ortada - Pet Inspired */}
                    <div className="relative -top-8 flex flex-col items-center justify-center group">
                        <div className="absolute -inset-2 bg-orange-500/20 rounded-full blur-xl group-active:scale-150 transition-transform"></div>
                        <button onClick={goCreate} className="w-16 h-16 bg-gradient-to-tr from-orange-600 to-amber-500 text-white rounded-full flex items-center justify-center shadow-[0_8px_25px_rgba(249,115,22,0.4)] active:scale-90 transition-transform ring-[6px] ring-white relative z-10">
                            <svg className="w-8 h-8 rotate-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C10.3 2 9 3.3 9 5C9 6.7 10.3 8 12 8C13.7 8 15 6.7 15 5C15 3.3 13.7 2 12 2M6 8C4.3 8 3 9.3 3 11C3 12.7 4.3 14 6 14C7.7 14 9 12.7 9 11C9 9.3 7.7 8 6 8M18 8C16.3 8 15 9.3 15 11C15 12.7 16.3 14 18 14C19.7 14 21 12.7 21 11C21 9.3 19.7 8 18 8M12 10C8.7 10 6 12.7 6 16C6 19.3 8.7 22 12 22C15.3 22 18 19.3 18 16C18 12.7 15.3 10 12 10Z" />
                            </svg>
                        </button>
                        <span className="text-[10px] font-black text-slate-900 mt-2 uppercase tracking-widest">İLAN VER</span>
                    </div>

                    {/* Mesajlar */}
                    <Link href="/profil?tab=mesajlarim" className="relative flex flex-col items-center justify-center flex-1 h-full text-slate-400 hover:text-orange-600 active:scale-95 transition-transform">
                        <svg className="w-6 h-6 mb-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 3H3a2 2 0 00-2 2v14a2 2 0 002 2h18a2 2 0 002-2V5a2 2 0 00-2-2z" />
                        </svg>
                        <span className="text-[10px] sm:text-[11px] font-bold line-clamp-1 truncate w-full text-center px-1 uppercase tracking-tighter">PATİ-SOHBET</span>
                        {unreadMessages > 0 && (
                            <span className="absolute top-2 right-4 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500 border-2 border-white"></span>
                            </span>
                        )}
                    </Link>

                    {/* Profil */}
                    {user ? (
                        <Link href="/profil" className="flex flex-col items-center justify-center flex-1 h-full text-slate-400 hover:text-orange-600 active:scale-95 transition-transform">
                            <div className="w-7 h-7 mb-1 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-orange-500 transition-colors">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="Profil" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-slate-600 text-[10px] font-black">
                                        {(user.displayName || user.email || 'U')[0].toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] sm:text-[11px] font-bold line-clamp-1 truncate w-full text-center px-1 uppercase tracking-tighter">SAYFAM</span>
                        </Link>
                    ) : (
                        <Link href="/giris" className="flex flex-col items-center justify-center flex-1 h-full text-slate-400 hover:text-orange-600 active:scale-95 transition-transform">
                            <svg className="w-6 h-6 mb-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-[10px] sm:text-[11px] font-bold line-clamp-1 truncate w-full text-center px-1 uppercase tracking-tighter">GİRİŞ</span>
                        </Link>
                    )}
                </div>
            </div >
        </>
    );
}
