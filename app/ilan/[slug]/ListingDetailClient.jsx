'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getListing, subscribeListings, incrementListingView } from '../../../lib/listingService';
import { useAuth } from '../../../lib/AuthContext';
import { normalizePhoneForWhatsApp, formatPhoneForDisplay } from '../../../lib/utils';
import AppHeader from '../../../components/AppHeader';
import ListingCard from '../../../components/ListingCard';
import MessageModal from '../../../components/MessageModal';
import PetLoading from '../../../components/PetLoading';

function formatDate(ts) {
    if (!ts?.seconds) return '';
    return new Date(ts.seconds * 1000).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getStyling(listing) {
    if (!listing) return {};
    const c = listing.concept;
    if (c === 'sahiplendirme') return { label: 'Yuva Arıyor', badge: 'bg-orange-50/80 text-orange-600 border-orange-100/50', hover: 'hover:border-orange-500/20 hover:shadow-orange-500/5', textHover: 'group-hover:text-orange-600', val: 'ÜCRETSİZ' };
    if (c === 'sahiplenmek-istiyorum') return { label: 'Yuva Olmak İstiyor', badge: 'bg-rose-50/80 text-rose-600 border-rose-100/50', hover: 'hover:border-rose-500/20 hover:shadow-rose-500/5', textHover: 'group-hover:text-rose-600', val: 'ARANIYOR' };
    if (c === 'ciftlestirme') return { label: 'Eş Yap / Çiftleştirme', badge: 'bg-purple-50 text-purple-600 border-purple-200', hover: 'hover:border-purple-200', textHover: 'group-hover:text-purple-500', val: 'EŞ BUL' };
    if (c === 'otel') return { label: 'Pati Oteli / Bakıcı', badge: 'bg-indigo-50 text-indigo-600 border-indigo-200', hover: 'hover:border-indigo-200', textHover: 'group-hover:text-indigo-500', val: listing.estimatedValue ? `₺${listing.estimatedValue}` : 'FİYAT SORUN' };
    if (c === 'bedelsiz') return { label: 'Destek / Hediye', badge: 'bg-emerald-50 text-emerald-600 border-emerald-200', hover: 'hover:border-emerald-200', textHover: 'group-hover:text-emerald-500', val: 'ÜCRETSİZ' };
    if (c === 'takas') return { label: 'Pati Takas', badge: 'bg-blue-50 text-blue-600 border-blue-200', hover: 'hover:border-blue-200', textHover: 'group-hover:text-blue-500', val: 'TAKAS' };
    return { label: 'İlan', badge: 'bg-slate-50 text-slate-600 border-slate-200', hover: 'hover:border-slate-300', textHover: 'group-hover:text-slate-600', val: 'AKTİF' };
}

export default function ListingDetailClient({ slug, serverListing }) {
    const router = useRouter();
    const { user, userData, toggleFavorite } = useAuth();

    const [listing, setListing] = useState(serverListing);
    const [loading, setLoading] = useState(!serverListing);
    const [currentPhoto, setCurrentPhoto] = useState(0);
    const [showMessage, setShowMessage] = useState(false);
    const [allListings, setAllListings] = useState([]);

    const isFavorite = useMemo(() => userData?.favorites?.includes(listing?.id), [userData, listing]);
    const favorites = useMemo(() => userData?.favorites || [], [userData]);
    const isOwner = useMemo(() => user?.uid === listing?.userId, [user, listing]);
    const styling = useMemo(() => getStyling(listing), [listing]);

    const relatedListings = useMemo(() => {
        if (!listing) return [];
        return allListings
            .filter(l => l.id !== listing.id && l.category === listing.category)
            .slice(0, 4);
    }, [allListings, listing]);

    const eldeneleBenefits = useMemo(() => [
        { title: "İlk Mama & Online Destek", desc: "Bu can dostumuzu sahiplendiğinizde ilk maması ve 1 aylık ücretsiz online veteriner danışmanlığı bizim hediyemiz!" },
        { title: "Oyuncak & Eğitim Desteği", desc: "EldenEle Özel Şanslı Yuva Paketi: Seçili oyuncaklar ve uzmanımızdan online temel adaptasyon rehberliği bizden!" },
        { title: "Online Adaptasyon", desc: "EldenEle uzmanlarından ücretsiz online eve alışma eğitimi ve sürpriz mama paketi kapınıza geliyor!" },
        { title: "Yuva Hediyesi Seti", desc: "Bu ilanı sahiplenirseniz, can dostumuzun ilk oyuncak seti ve online veteriner danışmanlığınız tamamen ücretsiz!" },
        { title: "Beslenme Paketiniz", desc: "İlk beslenme paketiniz ve uzman online hekim desteği EldenEle güvencesi ile tamamen sizinle!" }
    ], []);

    const benefitData = useMemo(() => {
        if (!listing?.id) return eldeneleBenefits[0];
        let sum = 0;
        for (let i = 0; i < listing.id.length; i++) sum += listing.id.charCodeAt(i);
        return eldeneleBenefits[sum % eldeneleBenefits.length];
    }, [listing?.id, eldeneleBenefits]);

    useEffect(() => {
        if (!serverListing) {
            async function load() {
                if (!slug) return;
                // Parse ID from the end of the slug
                const parts = slug.split('-');
                let targetId = parts[parts.length - 1]; // Assume last part is ID

                let data = await getListing(targetId);

                // Fallback: If not found, maybe the entire slug IS the ID
                if (!data && targetId !== slug) {
                    data = await getListing(slug);
                }

                setListing(data);
                setLoading(false);
                if (data && data.id) incrementListingView(data.id);
            }
            load();
        } else if (serverListing && serverListing.id) {
            incrementListingView(serverListing.id);
        }
        const unsub = subscribeListings((data) => setAllListings(data));
        return () => unsub();
    }, [slug, serverListing]);

    async function toggleFav() {
        if (!user) { router.push('/giris'); return; }
        await toggleFavorite(listing.id);
    }

    function openMessage() {
        if (!user) { router.push('/giris'); return; }
        setShowMessage(true);
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20 sm:pb-0">
            <AppHeader />

            {loading ? (
                <div className="max-w-5xl mx-auto px-4 py-20 flex items-center justify-center">
                    <PetLoading message="Can dostumuzun bilgileri getiriliyor..." />
                </div>
            ) : !listing ? (
                <div className="text-center py-20 bg-white border border-gray-100 rounded-xl shadow-sm mt-8 max-w-5xl mx-auto">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">İlan bulunamadı</h2>
                    <Link href="/" className="text-indigo-600 font-medium hover:underline">Anasayfaya Dön</Link>
                </div>
            ) : (
                <div className="max-w-5xl mx-auto px-4 py-8">
                    <nav aria-label="breadcrumb" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <button onClick={() => router.back()} className="font-bold flex items-center gap-1 hover:text-slate-700 transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                Geri Dön
                            </button>
                            <span aria-hidden="true">|</span>
                            <Link href="/?tab=community" className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
                                Tüm Gönderileri Gör
                            </Link>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <span className="text-gray-600 font-medium line-clamp-1">{listing.title}</span>
                        </div>
                    </nav>

                    <article itemScope itemType="https://schema.org/Product">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mb-16">
                            {/* Image Section */}
                            <div>
                                <div className="aspect-square bg-slate-50 rounded-[2rem] overflow-hidden shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-slate-100 mb-4 group relative">
                                    {listing.photos && listing.photos.length ? (
                                        <img src={listing.photos[currentPhoto]} alt={`${listing.title} - ${listing.category} - EldenEle.app`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" itemProp="image" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                {listing.photos && listing.photos.length > 1 && (
                                    <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                                        {listing.photos.map((photo, i) => (
                                            <button key={i} onClick={() => setCurrentPhoto(i)}
                                                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden transition-all duration-300 shrink-0 snap-start ${currentPhoto === i ? 'ring-2 ring-slate-800 ring-offset-2 scale-100 opacity-100' : 'ring-1 ring-slate-200 scale-95 opacity-60 hover:opacity-100'}`}>
                                                <img src={photo} className="w-full h-full object-cover" alt={`${listing.title} fotoğraf ${i + 1}`} />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Details Section */}
                            <div className="flex flex-col h-full">
                                <div className="flex items-center gap-2 flex-wrap mb-4">
                                    <span className={`${styling.badge} text-[11px] font-extrabold px-3 py-1.5 rounded-xl border tracking-widest uppercase`}>{styling.label}</span>
                                    <span className="text-[11px] bg-slate-50 text-slate-600 px-3 py-1.5 rounded-xl border border-slate-200 font-black tracking-widest uppercase" itemProp="category">{listing.category}</span>
                                    {listing.breed && (
                                        <span className="text-[11px] bg-orange-50 text-orange-600 px-3 py-1.5 rounded-xl border border-orange-100 font-extrabold tracking-tight">Breed: {listing.breed}</span>
                                    )}
                                </div>

                                <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 leading-tight mb-6 tracking-tight" itemProp="name">{listing.title}</h1>

                                <div className="flex items-end gap-3 mb-8" itemProp="offers" itemScope itemType="https://schema.org/Offer">
                                    <span className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter" itemProp="price" content={listing.estimatedValue || 0}>
                                        {styling.val}
                                        {listing.concept === 'otel' && listing.estimatedValue > 0 && <span className="text-base font-bold text-slate-400 ml-1.5">/gün</span>}
                                    </span>
                                    <meta itemProp="priceCurrency" content="TRY" />
                                    <meta itemProp="availability" content="https://schema.org/InStock" />
                                    {listing.concept === 'sahiplendirme' && (
                                        <span className="text-xs font-black text-orange-500 bg-orange-50 px-3 py-1 rounded-lg mb-1 tracking-widest uppercase">Ömürlük Yuva</span>
                                    )}
                                    {listing.concept === 'otel' && (
                                        <span className="text-xs font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-lg mb-1 tracking-widest uppercase">Konaklama / Bakım</span>
                                    )}
                                    {listing.concept === 'ciftlestirme' && (
                                        <span className="text-xs font-black text-purple-500 bg-purple-50 px-3 py-1 rounded-lg mb-1 tracking-widest uppercase">Eş Arayışı</span>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px] font-medium text-slate-500 pb-8 border-b border-slate-100">
                                    <div className="flex items-center gap-2.5 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
                                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                                        </div>
                                        <span itemProp="areaServed" className="truncate">{listing.city}{listing.district ? `, ${listing.district}` : ''}</span>
                                    </div>
                                    <div className="flex items-center gap-2.5 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
                                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        </div>
                                        <time dateTime={listing.createdAt?.seconds ? new Date(listing.createdAt.seconds * 1000).toISOString() : ''}>{formatDate(listing.createdAt)}</time>
                                    </div>
                                    <div className="flex items-center gap-2.5 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 sm:col-span-2">
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
                                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        </div>
                                        <span itemProp="seller" className="font-bold text-slate-700">{listing.userName || 'Kullanıcı'}</span>
                                        {!listing.hidePhone && listing.userPhone && (
                                            <>
                                                <span className="text-slate-300">•</span>
                                                <span className="text-slate-900 font-black tracking-tight">{formatPhoneForDisplay(listing.userPhone)}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {listing.userIsFeatured && (
                                    <div className="mt-8 mb-2 bg-gradient-to-tr from-orange-50 to-amber-50/40 border border-orange-100/60 rounded-2xl p-5 shadow-sm">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                                                <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                            </div>
                                            <h3 className="font-black text-orange-700 uppercase tracking-widest text-[12px] sm:text-[13px]">
                                                EldenEle Özel: {benefitData.title}
                                            </h3>
                                        </div>
                                        <p className="text-[13px] sm:text-[14px] text-slate-700 font-bold leading-relaxed ml-11">
                                            {benefitData.desc}
                                        </p>
                                    </div>
                                )}

                                {listing.description && (
                                    <div className="py-6 flex-1">
                                        <h2 className="text-[13px] font-black text-slate-400 uppercase tracking-widest mb-3">Açıklama</h2>
                                        <p className="text-slate-600 text-[15px] leading-relaxed whitespace-pre-line" itemProp="description">{listing.description}</p>
                                    </div>
                                )}

                                {/* Action Buttons - Mobile Responsive Matrix */}
                                {!isOwner ? (
                                    <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-3 mt-auto pt-6 border-t border-slate-100">
                                        <button onClick={openMessage} className="col-span-2 sm:col-span-1 sm:flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-[1.2rem] bg-slate-900 text-white text-sm font-extrabold border-[0.5px] border-slate-800 shadow-sm active:scale-[0.96] active:opacity-90 transition-all duration-150">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 3H3a2 2 0 00-2 2v14l4-4h14a2 2 0 002-2V5a2 2 0 00-2-2z" /></svg>
                                            İletişime Geç
                                        </button>

                                        {listing.userPhone && (
                                            <a
                                                href={`https://api.whatsapp.com/send?phone=${(listing.userPhone || '').toString().split('').filter(c => /\d/.test(c)).join('').replace(/^00/, '').replace(/^0/, '').replace(/^90/, '90').replace(/^(5)/, '90$1')}&text=${encodeURIComponent(`Selamlar, EldenEle.Pati üzerinden "${listing.title}" ilanınız için ulaşıyorum. Can dostumuz ile ilgileniyorum.`)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="col-span-2 sm:col-span-1 sm:flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-[1.2rem] bg-[#25D366] text-white text-sm font-extrabold border-[0.5px] border-[#1fad54] shadow-sm active:scale-[0.96] active:opacity-90 transition-all duration-150"
                                            >
                                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.309 1.656zm6.39-3.414c1.551.921 3.407 1.408 5.297 1.409 5.463 0 9.907-4.444 9.91-9.91.002-2.646-1.029-5.133-2.903-7.008-1.874-1.874-4.364-2.903-7.012-2.904-5.464 0-9.91 4.444-9.912 9.911-.001 1.91.536 3.774 1.554 5.397l-1.012 3.693 3.784-.992zm11.233-7.554c-.3-.15-1.773-.875-2.048-.975-.275-.1-.475-.15-.675.15-.2.3-.775.975-.95 1.175-.175.2-.35.225-.65.075-.3-.15-1.265-.466-2.41-1.488-.891-.794-1.492-1.775-1.667-2.075-.175-.3-.019-.463.13-.612.134-.133.3-.35.45-.525.15-.175.2-.299.3-.499.1-.2.05-.375-.025-.525-.075-.15-.675-1.625-.925-2.225-.244-.588-.492-.508-.675-.517-.175-.008-.375-.009-.575-.009-.2 0-.525.075-.8.375-.275.3-1.05 1.025-1.05 2.5s1.075 2.9 1.225 3.1c.15.2 2.115 3.229 5.122 4.527.715.309 1.274.494 1.708.633.72.228 1.374.195 1.891.118.577-.086 1.773-.725 2.023-1.425.25-.7.25-1.299.175-1.425-.075-.125-.275-.2-.575-.35z" />
                                                </svg>
                                                WhatsApp'a Git
                                            </a>
                                        )}

                                        <button onClick={toggleFav} className={`col-span-1 sm:col-span-none flex items-center justify-center gap-2 py-3 px-6 rounded-[1.2rem] border-[0.5px] ${isFavorite ? 'border-red-200 bg-red-50 text-red-500' : 'border-slate-200 bg-white text-slate-400 active:bg-slate-50 hover:text-slate-600'} active:scale-[0.96] transition-all duration-150 shadow-sm`}>
                                            <svg className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                        </button>

                                        <button onClick={() => {
                                            if (navigator.share) {
                                                navigator.share({ title: listing.title, url: window.location.href });
                                            } else {
                                                navigator.clipboard.writeText(window.location.href);
                                                alert("İlan bağlantısı kopyalandı!");
                                            }
                                        }} className="col-span-1 sm:col-span-none flex items-center justify-center gap-2 py-3 px-6 rounded-[1.2rem] border-[0.5px] border-slate-200 bg-white text-slate-600 active:bg-slate-50 active:scale-[0.96] transition-all duration-150 shadow-sm">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                                            <span className="sm:hidden font-bold">Paylaş</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col gap-3">
                                        <div className="bg-slate-50 text-slate-500 rounded-2xl px-5 py-4 text-xs font-bold text-center border border-slate-200 uppercase tracking-widest">
                                            Bu ilan size ait
                                        </div>
                                        <Link
                                            href={`/ilan-olustur?edit=${listing.id}`}
                                            className="w-full py-4 bg-slate-900 text-white rounded-2xl text-center font-black text-sm active:scale-[0.96] transition-all flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            İlanı Düzenle
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </article>

                    {relatedListings.length > 0 && (
                        <section className="pt-8 sm:pt-12 border-t border-slate-100">
                            <div className="flex items-center gap-3 mb-6 sm:mb-8">
                                <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Benzer İlanlar</h2>
                                <div className="h-px bg-slate-200 flex-1"></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                                {relatedListings.map(rel => (
                                    <ListingCard key={rel.id} listing={rel} isFavorite={favorites.includes(rel.id)} onToggleFavorite={toggleFavorite} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}

            {showMessage && listing && (
                <MessageModal listing={listing} onClose={() => setShowMessage(false)} />
            )}
        </div>
    );
}
