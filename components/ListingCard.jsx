'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { generateListingSlug } from '../lib/seo';

function getStyling(listing) {
    const c = listing.concept;
    if (c === 'sahiplendirme') return { label: '🐾 Yuva Arıyor', badge: 'bg-orange-50/80 text-orange-600 border-orange-100/50', hover: 'hover:border-orange-500/20 hover:shadow-orange-500/5', textHover: 'group-hover:text-orange-600', val: 'ÜCRETSİZ' };
    if (c === 'sahiplenmek-istiyorum') return { label: '🏠 Yuva Olmak İstiyor', badge: 'bg-rose-50/80 text-rose-600 border-rose-100/50', hover: 'hover:border-rose-500/20 hover:shadow-rose-500/5', textHover: 'group-hover:text-rose-600', val: 'ARANIYOR' };
    if (c === 'ciftlestirme') return { label: '💑 Eş Yap / Çiftleştirme', badge: 'bg-purple-50 text-purple-600 border-purple-200', hover: 'hover:border-purple-200', textHover: 'group-hover:text-purple-500', val: 'EŞ BUL' };
    if (c === 'otel') return { label: '🏨 Pati Oteli / Bakıcı', badge: 'bg-indigo-50 text-indigo-600 border-indigo-200', hover: 'hover:border-indigo-200', textHover: 'group-hover:text-indigo-500', val: 'OTEL' };
    if (c === 'gezdirme') return { label: '🦮 Pati Gezdirme', badge: 'bg-amber-50 text-amber-600 border-amber-200', hover: 'hover:border-amber-200', textHover: 'group-hover:text-amber-500', val: 'GEZDİRME' };
    if (c === 'kayip') return { label: '🚨 Kayıp / Bulunan', badge: 'bg-red-50 text-red-600 border-red-200', hover: 'hover:border-red-200', textHover: 'group-hover:text-red-600', val: 'KAYIP' };
    if (c === 'transfer') return { label: '🚕 Pati Transfer', badge: 'bg-cyan-50 text-cyan-600 border-cyan-200', hover: 'hover:border-cyan-200', textHover: 'group-hover:text-cyan-600', val: 'TRANSFER' };
    if (c === 'kan-bagisi') return { label: '🩸 Kan Bağışı İhtiyacı', badge: 'bg-red-50 text-red-700 border-red-200 shadow-sm', hover: 'hover:border-red-300', textHover: 'group-hover:text-red-700', val: 'ACİL' };
    if (c === 'bedelsiz') return { label: '🎁 Destek / Hediye', badge: 'bg-emerald-50 text-emerald-600 border-emerald-200', hover: 'hover:border-emerald-200', textHover: 'group-hover:text-emerald-500', val: 'ÜCRETSİZ' };
    if (c === 'takas') return { label: '🔄 Pati Takas', badge: 'bg-blue-50 text-blue-600 border-blue-200', hover: 'hover:border-blue-200', textHover: 'group-hover:text-blue-500', val: 'TAKAS' };
    return { label: 'İlan', badge: 'bg-slate-50 text-slate-600 border-slate-200', hover: 'hover:border-slate-300', textHover: 'group-hover:text-slate-600', val: 'AKTİF' };
}


function formatDate(ts) {
    if (!ts?.seconds) return '';
    return new Date(ts.seconds * 1000).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

export default function ListingCard({ listing, isFavorite, onToggleFavorite, showActions = false, onEdit, onDelete }) {
    const styling = useMemo(() => getStyling(listing), [listing]);
    // Use stored slug or generate on-the-fly for old listings
    const listingSlug = generateListingSlug(listing);

    const eldeneleBenefits = useMemo(() => [
        "Profesyonel Online Veteriner Danışmanlığı ve İlk Beslenme Desteği!",
        "EldenEle Özel: Uzman Eğitmen Eşliğinde Online Adaptasyon Desteği!",
        "Yeni Yuvanızda İlk Adım: Profesyonel Davranış Bilimleri Danışmanlığı!",
        "Ömürlük Dostluklara Uzman Dokunuşu: Online Hekim ve Gelişim Takibi!",
        "Bilinçli Sahiplenme: Uzman Onaylı Beslenme Programı ve Danışmanlık Hizmeti!"
    ], []);

    const benefitText = useMemo(() => {
        if (!listing.id) return eldeneleBenefits[0];
        let sum = 0;
        for (let i = 0; i < listing.id.length; i++) sum += listing.id.charCodeAt(i);
        return eldeneleBenefits[sum % eldeneleBenefits.length];
    }, [listing.id, eldeneleBenefits]);

    // Dynamic fake visitor count based on deterministic ID or title length
    const viewingCount = useMemo(() => {
        if (!listing.id) return 5;
        let sum = 0;
        for (let i = 0; i < listing.id.length; i++) sum += listing.id.charCodeAt(i);
        return (sum % 17) + 3; // Returns between 3 and 19
    }, [listing.id]);

    function toggleFav(e) {
        e.stopPropagation();
        e.preventDefault();
        if (onToggleFavorite) onToggleFavorite(listing.id);
    }

    return (
        <Link href={`/ilan/${listingSlug}`} className="group block h-full">
            {/* Desktop Card Layout */}
            <div className={`hidden sm:flex h-full flex-col bg-white rounded-[1.5rem] overflow-hidden transition-all duration-300 border-[0.5px] ${listing.userIsFeatured ? 'border-orange-200 shadow-[0_12px_44px_-12px_rgba(249,115,22,0.15)] bg-orange-50/5' : 'border-slate-200 shadow-sm'} ${styling.hover} group-hover:-translate-y-1`}>
                {/* Image */}
                <div className="relative aspect-square bg-slate-50 overflow-hidden shrink-0">
                    {listing.photos && listing.photos.length ? (
                        <img
                            src={listing.photos[0]}
                            alt={listing.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100">
                            <span className="text-slate-300 font-black text-2xl uppercase tracking-widest opacity-20 italic">PATİ</span>
                        </div>
                    )}

                    {/* ID Tag */}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-md border border-slate-200/50 shadow-sm z-20">
                        <span className="font-mono text-[9px] font-black text-slate-400 tracking-tighter uppercase">ID:{listing.id?.slice(-6)}</span>
                    </div>

                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                        <button onClick={toggleFav} className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-all border border-slate-200/40">
                            <svg className={`w-4 h-4 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-slate-400'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </button>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200/40 shadow-sm flex items-center justify-between">
                        <span className="font-mono text-[10px] font-black text-slate-800 tracking-tight">{viewingCount} AKTİF İLGİ</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`${styling.badge} text-[9px] font-black px-2 py-0.5 rounded-md border tracking-widest uppercase`}>{styling.label}</span>
                    </div>
                    <h3 className={`${styling.textHover} font-black text-slate-900 text-[15px] leading-tight line-clamp-2 mb-2 transition-colors tracking-tight`}>{listing.title}</h3>

                    {listing.userIsFeatured && (
                        <div className="bg-gradient-to-tr from-orange-50 to-amber-50/30 border border-orange-100/50 rounded-xl p-2.5 mb-3">
                            <span className="flex items-center gap-1.5 text-[10px] font-black text-orange-600 uppercase tracking-tighter">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                EldenEle Özel
                            </span>
                            <span className="block text-[10px] sm:text-[11px] font-bold text-slate-600 mt-1 leading-[1.3]">{benefitText}</span>
                        </div>
                    )}

                    {/* Desktop Actions */}
                    {showActions && (
                        <div className="flex items-center gap-2 mb-4">
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit?.(listing.id); }}
                                className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 px-3 py-2 rounded-xl text-[10px] font-black border border-slate-200 uppercase tracking-widest transition-all"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                DÜZENLE
                            </button>
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete?.(listing.id); }}
                                className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-xl text-[10px] font-black border border-red-100 uppercase tracking-widest transition-all"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                SİL
                            </button>
                        </div>
                    )}

                    <div className="mt-auto space-y-3">
                        <div className="flex items-end justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">DURUM</span>
                                <span className="text-slate-900 font-mono font-black text-lg tracking-tight leading-none">{styling.val}</span>
                            </div>
                            <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/50">
                                <span className="text-[10px] font-black text-slate-600 tracking-wider uppercase">{listing.category}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 pt-3 border-t border-slate-100 uppercase tracking-tighter">
                            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                            <span className="truncate">{listing.city}{listing.district ? ` / ${listing.district}` : ''}</span>
                            <span className="ml-auto font-mono">{formatDate(listing.createdAt)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile List Layout (Horizontal) */}
            <div className={`sm:hidden relative flex bg-white rounded-2xl overflow-hidden border-[0.5px] ${listing.userIsFeatured ? 'border-orange-200 bg-orange-50/10' : 'border-slate-200'} shadow-sm active:scale-[0.98] transition-all p-2 gap-3`}>
                <div className="w-24 h-24 rounded-xl bg-slate-50 overflow-hidden shrink-0 relative">
                    {listing.photos && listing.photos.length ? (
                        <img src={listing.photos[0]} className="w-full h-full object-cover" alt="" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100">
                            <span className="text-[8px] text-slate-300 font-black italic">PATİ</span>
                        </div>
                    )}
                    <button onClick={toggleFav} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 shadow-md flex items-center justify-center border border-slate-100">
                        <svg className={`w-3 h-3 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-slate-400'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                </div>

                <div className="flex flex-col justify-between py-1 flex-1 min-w-0">
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                                <span className={`${styling.badge} text-[8px] font-black px-1.5 py-0.5 rounded border tracking-widest uppercase`}>{styling.label}</span>
                                {listing.breed && (
                                    <span className="text-[8px] bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded font-bold truncate max-w-[80px]">{listing.breed}</span>
                                )}
                            </div>

                            {/* Mobile Actions */}
                            {showActions && (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit?.(listing.id); }}
                                        className="p-1.5 bg-slate-50 text-slate-500 rounded border border-slate-200"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    </button>
                                    <button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete?.(listing.id); }}
                                        className="p-1.5 bg-red-50 text-red-500 rounded border border-red-100"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            )}
                        </div>
                        <h3 className="font-bold text-slate-900 text-[13px] leading-[1.3] line-clamp-2 tracking-tight">{listing.title}</h3>
                        {listing.userIsFeatured && (
                            <div className="mt-1.5 bg-gradient-to-tr from-orange-50 to-amber-50/30 border border-orange-100/50 rounded-md flex flex-col p-1.5">
                                <div className="flex items-center gap-1 mb-0.5">
                                    <svg className="w-3 h-3 text-orange-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <span className="text-[8px] font-black text-orange-600 uppercase tracking-widest">ELDENELE DESTEĞİ</span>
                                </div>
                                <span className="block text-[8px] font-bold text-slate-500 leading-tight">{benefitText}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                        <span className="text-slate-900 font-black text-xs bg-slate-50 px-2 py-1 rounded border border-slate-100 tracking-tighter uppercase">{styling.val}</span>
                        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                            <span className="truncate max-w-[100px]">{listing.city}{listing.district ? ` / ${listing.district}` : ''}</span>
                        </div>
                    </div>
                </div>

                {listing.userIsFeatured && (
                    <div className="absolute -top-1 -right-1">
                        <div className="bg-orange-500 w-3 h-3 rounded-full border-2 border-white"></div>
                    </div>
                )}
            </div>
        </Link>
    );
}
