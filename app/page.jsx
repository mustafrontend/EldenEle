'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AppHeader from '../components/AppHeader';
import FilterBar from '../components/FilterBar';
import ListingCard from '../components/ListingCard';
import PetLoading from '../components/PetLoading';
import CommunityFeed from '../components/CommunityFeed';
import { getCachedListings } from '../lib/listingService';
import { useAuth } from '../lib/AuthContext';
import NewUsersTracker from '../components/NewUsersTracker';
import NewPostsTracker from '../components/NewPostsTracker';
import dynamic from 'next/dynamic';
import { getCommunityStats } from '../lib/communityService';
import NewsPopup from '../components/NewsPopup';

// Load Map without SSR to prevent window/document undefined crash
const DynamicMapView = dynamic(() => import('../components/MapView'), { ssr: false });

function getBannerData(concept) {
    if (concept === 'sahiplendirme') {
        return {
            iconColor: 'bg-orange-50/70 text-orange-500',
            icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
            title: 'Sıcak Bir Yuva, Yeni Bir Başlangıç',
            desc: 'Binlerce patili dostumuz onları çok sevecek yeni ailelerini bekliyor. Hemen sahiplenin, hayatınızın en güzel dostluğunu başlatın.',
            badges: ['Köpek Sahiplen', 'Kedi Sahiplen', 'Kuş Sahiplen']
        };
    }
    if (concept === 'sahiplenmek-istiyorum') {
        return {
            iconColor: 'bg-rose-50/70 text-rose-500',
            icon: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a5.946 5.946 0 00-.942 3.197M12 10.5a3 3 0 110-6 3 3 0 010 6zM4.5 9.375a3 3 0 110-6 3 3 0 010 6zm15 0a3 3 0 110-6 3 3 0 010 6z',
            title: 'Yeni Bir Dost, Yuvanızda Yeni Bir Heyecan',
            desc: 'Evinizin kapılarını bir can dostumuza açmak mı istiyorsunuz? İsteğinizi paylaşın, size en uygun patiyi birlikte bulalım.',
            badges: ['Yuva Ol', 'Can Dostu Ara', 'Gönüllü Sahiplenme']
        };
    }
    if (concept === 'yetenek') {
        return {
            iconColor: 'bg-teal-50/70 text-teal-500',
            icon: 'M13 10V3L4 14h7v7l9-11h-7z',
            title: 'Yeteneklerini Takas Et, Değer Yarat',
            desc: 'Sertifikanızı verin, karşılığında tasarım hizmeti alın. Para yerine uzmanlığın konuştuğu, profesyonel dayanışma ağına katılın.',
            badges: ['Yazılım', 'Tasarım', 'Özel Ders']
        };
    }
    if (concept === 'bedelsiz') {
        return {
            iconColor: 'bg-emerald-50/70 text-emerald-500',
            icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
            title: 'İyiliğin Paylaştıkça Büyüdüğü Ağ',
            desc: 'İhtiyacınız olmayan eşyaları gerçek sahiplerine bedelsiz ulaştırın. Toplumsal dayanışma ağımızın kalbi olun.',
            badges: ['Ücretsiz Eşya', 'İmece', 'Yardımlaşma']
        };
    }
    if (concept === 'geridonusum') {
        return {
            iconColor: 'bg-amber-50/70 text-amber-500',
            icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
            title: 'Sıfır Atık, Sınırsız Yaratıcılık',
            desc: 'Çalışmayan elektronikleri atmayın! Üretken Maker ruhlu kullanıcılarımızın projelerine hayat verin.',
            badges: ['İleri Dönüşüm', 'Kendin Yap', 'Yedek Parça']
        };
    }
    if (concept === 'ciftlestirme') {
        return {
            iconColor: 'bg-purple-50/70 text-purple-500',
            icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
            title: 'Can Dostunuz İçin En Doğru Eş Adayı',
            desc: 'Dostunuzun soyunu devam ettirmek veya ona bir oyun arkadaşı bulmak için kriterlerinize en uygun ilanı inceleyin.',
            badges: ['Eş Bul', 'Çiftleştirme', 'Oyun Arkadaşı']
        };
    }
    if (concept === 'otel') {
        return {
            iconColor: 'bg-indigo-50/70 text-indigo-500',
            icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
            title: 'Gözünüz Arkada Kalmasın: Profesyonel Bakım',
            desc: 'Seyahate çıkarken dostunuzu güvenle emanet edebileceğiniz pati otelleri, pansiyonlar ve sertifikalı bakıcılar burada.',
            badges: ['Pati Oteli', 'Köpek Bakıcısı', 'Geçici Konaklama']
        };
    }
    if (concept === 'odunc') {
        return {
            iconColor: 'bg-indigo-50/70 text-indigo-500',
            icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
            title: 'Al, Kullan ve Geri Ver!',
            desc: 'Yılda sadece bir kez kullanacağınız eşyaları satın almak yerine komşularınızdan ücretsiz ödünç alın. Tüketimi azaltın.',
            badges: ['Kamp', 'Alet', 'Kitap']
        };
    }
    // Pivot to Pet Adoption (Sahiplendirme)
    return {
        iconColor: 'bg-orange-50/70 text-orange-600',
        icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
        title: 'Ömürlük Bir Dost, Sıcak Bir Yuva',
        desc: 'Sokaktaki canlarımıza veya bakıma muhtaç dostlarımıza yeni bir hayat verin. Türkiye\'nin en güvenli pati dayanışma ağı.',
        badges: ['Acil Yuva', 'Kedi/Köpek', 'Ücretsiz Sahiplen']
    };
}

function HomePageContent() {
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') || 'ilanlar';

    const { user, userData, toggleFavorite } = useAuth();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
    const [filters, setFilters] = useState({ tab: initialTab, concept: '', city: '', district: '', category: '' });
    const [stats, setStats] = useState({ users: 0, posts: 0 });

    const fetchListings = useCallback(async () => {
        try {
            const data = await getCachedListings();
            setListings(data);
        } catch (err) {
            console.error('İlanlar yüklenemedi:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchListings();
        getCommunityStats().then(res => {
            setStats({ users: res.totalUsers, posts: res.totalPosts });
        });
    }, [fetchListings]);

    const favorites = useMemo(() => userData?.favorites || [], [userData]);

    const { featuredListings, regularListings } = useMemo(() => {
        const filtered = listings.filter(l => {
            const matchQuery = l.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                l.description?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchTab = filters.tab === 'ilanlar' || l.concept === filters.tab;
            const matchConcept = !filters.concept || l.concept === filters.concept;
            const matchCity = !filters.city || l.city === filters.city;
            const matchDistrict = !filters.district || l.district === filters.district;
            const matchCategory = !filters.category || l.category === filters.category;
            return matchQuery && matchTab && matchConcept && matchCity && matchDistrict && matchCategory;
        });

        const featured = filtered.filter(l => l.userIsFeatured).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        const regular = filtered.filter(l => !l.userIsFeatured).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        return { featuredListings: featured, regularListings: regular };
    }, [listings, searchQuery, filters]);

    const bannerData = useMemo(() => getBannerData(filters.concept), [filters.concept]);

    async function handleToggleFavorite(id) {
        if (!user) return;
        await toggleFavorite(id);
    }

    return (
        <div className="min-h-screen bg-slate-50 overflow-x-hidden flex flex-col relative w-full max-w-[100vw]">
            <AppHeader onSearch={setSearchQuery} />
            <FilterBar filters={filters} onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))} />

            <main className="max-w-7xl mx-auto px-4 py-4 sm:py-8 pb-28 sm:pb-8 w-full">
                {/* VIP / Referral Banner (Growth Hack FOMO) */}


                {/* Premium Ultra-Compact Mobile Action Grid - 4 Columns */}
                <div className="sm:hidden grid grid-cols-4 gap-2 mb-10 px-0.5">
                    {/* Yuva Bul */}
                    <Link href="/ilan-olustur?hizli=sahiplendirme" className="group bg-white border-[0.5px] border-slate-200 p-2 rounded-xl active:scale-[0.96] transition-all duration-150 flex flex-col items-center text-center">
                        <div className="w-9 h-9 rounded-lg bg-orange-500 text-white flex items-center justify-center mb-1.5 shadow-sm">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                            </svg>
                        </div>
                        <span className="font-bold text-[10px] text-slate-800 tracking-tight leading-none">Yuva Bul</span>
                    </Link>

                    {/* Yuva Ol */}
                    <Link href="/ilan-olustur?hizli=sahiplenmek-istiyorum" className="group bg-white border-[0.5px] border-slate-200 p-2 rounded-xl active:scale-[0.96] transition-all duration-150 flex flex-col items-center text-center">
                        <div className="w-9 h-9 rounded-lg bg-rose-500 text-white flex items-center justify-center mb-1.5 shadow-sm">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a5.946 5.946 0 00-.942 3.197M12 10.5a3 3 0 110-6 3 3 0 010 6zM4.5 9.375a3 3 0 110-6 3 3 0 010 6zm15 0a3 3 0 110-6 3 3 0 010 6z" />
                            </svg>
                        </div>
                        <span className="font-bold text-[10px] text-slate-800 tracking-tight leading-none">Yuva Ol</span>
                    </Link>

                    {/* Eş Bul */}
                    <Link href="/ilan-olustur?hizli=ciftlestirme" className="group bg-white border-[0.5px] border-slate-200 p-2 rounded-xl active:scale-[0.96] transition-all duration-150 flex flex-col items-center text-center">
                        <div className="w-9 h-9 rounded-lg bg-purple-500 text-white flex items-center justify-center mb-1.5 shadow-sm">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.649 6.79c.462-4.474 5.936-4.474 6.399 0 .34 3.295-3.199 4.316-3.199 4.316s-3.54-1.021-3.2-4.316zm-7.649 0c.462-4.474 5.936-4.474 6.399 0 .34 3.295-3.199 4.316-3.199 4.316s-3.54-1.021-3.2-4.316zm10 12.21c0 2.502-1.921 4.532-4.312 4.532-1.936 0-3.597-1.341-4.312-3.28m8.624 0c0-1.939-1.663-3.28-4.312-3.28-2.649 0-4.312 1.341-4.312 3.28" />
                            </svg>
                        </div>
                        <span className="font-bold text-[10px] text-slate-800 tracking-tight leading-none">Eş Bul</span>
                    </Link>

                    {/* Pati Oteli */}
                    <Link href="/ilan-olustur?hizli=otel" className="group bg-white border-[0.5px] border-slate-200 p-2 rounded-xl active:scale-[0.96] transition-all duration-150 flex flex-col items-center text-center">
                        <div className="w-9 h-9 rounded-lg bg-indigo-500 text-white flex items-center justify-center mb-1.5 shadow-sm">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </div>
                        <span className="font-bold text-[10px] text-slate-800 tracking-tight leading-none">Pati Oteli</span>
                    </Link>

                    {/* Gezdirme */}
                    <Link href="/ilan-olustur?hizli=gezdirme" className="group bg-white border-[0.5px] border-slate-200 p-2 rounded-xl active:scale-[0.96] transition-all duration-150 flex flex-col items-center text-center">
                        <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center mb-1.5 shadow-sm">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        </div>
                        <span className="font-bold text-[10px] text-slate-800 tracking-tight leading-none">Gezdirme</span>
                    </Link>

                    {/* Kayıp Bulunan */}
                    <Link href="/ilan-olustur?hizli=kayip" className="group bg-white border-[0.5px] border-slate-200 p-2 rounded-xl active:scale-[0.96] transition-all duration-150 flex flex-col items-center text-center">
                        <div className="w-9 h-9 rounded-lg bg-red-600 text-white flex items-center justify-center mb-1.5 shadow-sm ring-1 ring-red-100 ring-offset-1">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <span className="font-bold text-[10px] text-red-600 tracking-tight leading-none">Kayıp</span>
                    </Link>

                    {/* Transfer */}
                    <Link href="/ilan-olustur?hizli=transfer" className="group bg-white border-[0.5px] border-slate-200 p-2 rounded-xl active:scale-[0.96] transition-all duration-150 flex flex-col items-center text-center">
                        <div className="w-9 h-9 rounded-lg bg-cyan-500 text-white flex items-center justify-center mb-1.5 shadow-sm">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.091-1.123l-.208-3.33a5.158 5.158 0 00-4.707-4.823l-2.001-.168M16.5 18.75V11.25m-10.5 6V11.25m-3 0h16.5" />
                            </svg>
                        </div>
                        <span className="font-bold text-[10px] text-slate-800 tracking-tight leading-none">Nakil</span>
                    </Link>

                    {/* Kan Bağışı */}
                    <Link href="/ilan-olustur?hizli=kan-bagisi" className="group bg-white border-[0.5px] border-slate-200 p-2 rounded-xl active:scale-[0.96] transition-all duration-150 flex flex-col items-center text-center">
                        <div className="w-9 h-9 rounded-lg bg-red-800 text-white flex items-center justify-center mb-1.5 shadow-sm">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                        </div>
                        <span className="font-bold text-[10px] text-slate-800 tracking-tight leading-none">Kan Bağışı</span>
                    </Link>
                </div>

                {/* Desktop Premium Dashboard Row: Side Trackers + Slim Hero Bar */}
                <div className="hidden sm:grid lg:grid-cols-[minmax(280px,320px)_1fr_minmax(280px,320px)] gap-6 mb-8 items-stretch">
                    {/* Left: New Users */}
                    <NewUsersTracker totalUsers={stats.users} />

                    {/* Center: Slim Hero Bar */}
                    <div className="flex bg-white rounded-[2rem] px-8 py-6 border border-slate-200 shadow-[0_2px_12px_rgba(0,0,0,0.03)] relative items-center justify-between group overflow-hidden border-b-4 border-b-indigo-500/10">
                        <div className="absolute -right-6 -top-6 w-32 h-32 bg-slate-50 rounded-full blur-3xl opacity-50 group-hover:bg-indigo-50 transition-colors"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-1.5">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bannerData.iconColor}`}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={bannerData.icon} />
                                    </svg>
                                </div>
                                <h1 className="text-xl lg:text-2xl font-black tracking-tight text-slate-900 leading-tight">
                                    {bannerData.title}
                                </h1>
                            </div>
                            <p className="text-[13px] leading-relaxed font-medium text-slate-500 max-w-md line-clamp-2">
                                {bannerData.desc}
                            </p>
                            <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
                                {bannerData.badges.map(badge => (
                                    <span key={badge} className="whitespace-nowrap px-2.5 py-1 rounded-lg text-[10px] font-black border border-slate-100 bg-slate-50 text-slate-600 uppercase tracking-tighter">
                                        {badge}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Minimalist Decoration for the 'Bar' feel */}
                        <div className="hidden xl:flex flex-col items-end shrink-0 pl-4 border-l border-slate-100">
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-1">EldenEle.PRO</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Premium Network</span>
                        </div>
                    </div>

                    {/* Right: Community Activity */}
                    <NewPostsTracker totalPosts={stats.posts} onViewAll={() => setFilters({ ...filters, tab: 'community' })} />
                </div>

                {/* Mobile Trackers Area (Only core metrics on mobile) */}
                <div className="sm:hidden space-y-4 mb-8">
                    <NewPostsTracker totalPosts={stats.posts} onViewAll={() => setFilters({ ...filters, tab: 'community' })} />
                </div>

                {/* Action cards moved to Header */}


                {/* Results info / Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mt-8 mb-8">
                    <div className="flex w-full sm:w-auto bg-white shadow-md border border-slate-200 p-1.5 rounded-xl overflow-x-auto scrollbar-hide">
                        <button
                            onClick={() => setFilters({ ...filters, tab: 'community' })}
                            className={`relative flex-1 sm:flex-none whitespace-nowrap px-3 sm:px-5 py-1.5 sm:py-2 rounded-md font-bold text-[13px] sm:text-sm transition-all ${filters.tab === 'community' ? 'bg-zinc-900 text-zinc-100 shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-zinc-700 ring-1 ring-white/5' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Topluluk & Talepler
                            <span className="absolute top-0 right-0 -mt-1 -mr-1.5 sm:-mr-2 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className={`relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 ${filters.tab === 'community' ? 'border-zinc-900' : 'border-white'}`}></span>
                            </span>
                        </button>
                        <button
                            onClick={() => setFilters({ ...filters, tab: 'ilanlar' })}
                            className={`flex-1 sm:flex-none whitespace-nowrap px-3 sm:px-5 py-1.5 sm:py-2 rounded-md font-bold text-[13px] sm:text-sm transition-all ${filters.tab === 'ilanlar' ? 'bg-slate-100 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            İlanlar
                        </button>
                    </div>

                    {filters.tab === 'ilanlar' && (
                        <div className="flex items-center gap-4">
                            {/* View Mode Toggle */}
                            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0 shadow-inner">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                                </button>
                                <button
                                    onClick={() => setViewMode('map')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'map' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <h2 className="font-bold text-slate-800 text-lg hidden sm:block">
                                    {featuredListings.length + regularListings.length > 0
                                        ? `${featuredListings.length + regularListings.length} ilan bulundu`
                                        : 'İlanlar'}
                                </h2>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                {/* Main Content Area */}
                {filters.tab === 'community' ? (
                    <CommunityFeed
                        recentListings={[...listings].sort((a, b) => {
                            if (a.userIsFeatured && !b.userIsFeatured) return -1;
                            if (!a.userIsFeatured && b.userIsFeatured) return 1;
                            return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
                        }).slice(0, 10)}
                        onNavigateToListings={() => setFilters({ ...filters, tab: 'ilanlar' })}
                    />
                ) : (
                    <>
                        {loading ? (
                            <PetLoading />
                        ) : featuredListings.length === 0 && regularListings.length === 0 ? (
                            <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl shadow-sm">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-slate-100">
                                    <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-black text-slate-900 mb-2 tracking-tight">İlan Bulunamadı</h3>
                                <p className="text-slate-500 text-sm font-medium mb-6">Arama kriterlerinize uygun sonuç bulamadık.<br />Farklı kelimeler veya kategoriler deneyebilirsiniz.</p>
                                <button
                                    onClick={() => { setSearchQuery(''); setFilters({ tab: 'ilanlar', concept: '', city: '', district: '', category: '' }); }}
                                    className="px-6 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold uppercase tracking-widest text-[11px] hover:bg-indigo-100 transition-colors"
                                >
                                    Filtreleri Temizle
                                </button>
                            </div>
                        ) : (
                            // Render depending on viewMode
                            viewMode === 'map' ? (
                                <div className="fade-in-up mt-4">
                                    <DynamicMapView listings={[...featuredListings, ...regularListings]} />
                                </div>
                            ) : (
                                <div className="fade-in-up">
                                    {/* Featured / Regular Grids */}
                                    {featuredListings.length > 0 && (
                                        <div className="mb-10 lg:mb-12">
                                            <h3 className="font-extrabold text-lg lg:text-xl text-slate-900 mb-5 flex items-center gap-2">
                                                <div className="p-1.5 bg-amber-50 rounded-lg shrink-0">
                                                    <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                </div>
                                                Öne Çıkanlar
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                                                {featuredListings.map(listing => (
                                                    <ListingCard key={listing.id} listing={listing} isFavorite={favorites.includes(listing.id)} onToggleFavorite={handleToggleFavorite} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {regularListings.length > 0 && (
                                        <div>
                                            {featuredListings.length > 0 && (
                                                <h3 className="font-extrabold text-lg lg:text-xl text-slate-900 mb-5 flex items-center gap-2 opacity-95">
                                                    <div className="p-1.5 bg-slate-100 rounded-lg shrink-0">
                                                        <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4h4m-4-8a8 8 0 11-8 8 8 8 0 018-8z" />
                                                        </svg>
                                                    </div>
                                                    En Yeniler
                                                </h3>
                                            )}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                                                {regularListings.map(listing => (
                                                    <ListingCard key={listing.id} listing={listing} isFavorite={favorites.includes(listing.id)} onToggleFavorite={handleToggleFavorite} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        )}
                    </>
                )}

            </main>
        </div>
    );
}

export default function HomePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <HomePageContent />
            <NewsPopup />
        </Suspense>
    );
}
