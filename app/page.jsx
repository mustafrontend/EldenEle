'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AppHeader from '../components/AppHeader';
import FilterBar from '../components/FilterBar';
import ListingCard from '../components/ListingCard';
import PetLoading from '../components/PetLoading';
import CommunityFeed from '../components/CommunityFeed';
import { subscribeListings } from '../lib/listingService';
import { useAuth } from '../lib/AuthContext';
import NewUsersTracker from '../components/NewUsersTracker';
import NewPostsTracker from '../components/NewPostsTracker';
import { getCommunityStats } from '../lib/communityService';

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
    const [filters, setFilters] = useState({ tab: initialTab, concept: '', city: '', district: '', category: '' });
    const [stats, setStats] = useState({ users: 0, posts: 0 });

    useEffect(() => {
        const unsub = subscribeListings((data) => {
            setListings(data);
            setLoading(false);
        });
        getCommunityStats().then(res => {
            setStats({ users: res.totalUsers, posts: res.totalPosts });
        });

        return () => unsub();
    }, []);

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


                {/* Premium Mobile Action Area */}
                <div className="sm:hidden mb-8 px-1">
                    <Link href="/ilan-olustur" className="relative group flex items-center justify-between w-full bg-white border border-slate-200/60 p-4 rounded-[2rem] shadow-[0_2px_20px_rgb(0,0,0,0.03)] active:scale-[0.97] transition-all duration-300 overflow-hidden">
                        <div className="flex items-center gap-4 relative z-10">
                            {/* Image reference matching nested soft rounded box */}
                            <div className="w-[52px] h-[52px] rounded-[1.2rem] flex items-center justify-center bg-slate-50 border border-slate-100/50 shadow-inner group-hover:bg-indigo-50/50 transition-colors shrink-0">
                                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-[0_2px_8px_rgb(0,0,0,0.04)] ring-1 ring-slate-100/50">
                                    <svg className="w-4 h-4 text-slate-700 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                            </div>

                            <div className="flex flex-col justify-center">
                                <span className="font-black text-[17px] tracking-tight text-slate-900 leading-tight mb-0.5">
                                    Yuva İlanı Oluştur
                                </span>
                                <span className="text-[11px] text-orange-500 font-bold tracking-wide uppercase">
                                    Canlara yardım et
                                </span>
                            </div>
                        </div>

                        <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center relative z-10 border border-slate-100 group-hover:bg-slate-100 transition-colors group-active:translate-x-1 shadow-sm shrink-0">
                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
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

                {/* Mobile Trackers Area (Restored for mobile as it was) */}
                <div className="sm:hidden space-y-4 mb-8">
                    <NewUsersTracker totalUsers={stats.users} />
                    <NewPostsTracker totalPosts={stats.posts} onViewAll={() => setFilters({ ...filters, tab: 'community' })} />
                </div>

                {/* Action cards moved to Header */}


                {/* Results info / Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6">
                    <div className="flex w-full sm:w-auto bg-white shadow-sm border border-slate-200 p-1 rounded-lg overflow-x-auto scrollbar-hide">
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
                        <div className="flex items-center gap-2">
                            <h2 className="font-bold text-slate-800 text-lg">
                                {featuredListings.length + regularListings.length > 0 ? `${featuredListings.length + regularListings.length} ilan bulundu` : 'İlanlar'}
                            </h2>
                            {searchQuery && <span className="text-sm text-slate-500">&quot;{searchQuery}&quot; için sonuçlar</span>}
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                {filters.tab === 'community' ? (
                    <CommunityFeed
                        recentListings={[...listings].sort((a, b) => { // Create a shallow copy to avoid modifying original array
                            // Absolute Priority to Featured Items
                            if (a.userIsFeatured && !b.userIsFeatured) return -1;
                            if (!a.userIsFeatured && b.userIsFeatured) return 1;
                            // If both are same status, sort by date
                            return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
                        }).slice(0, 5)}
                        onNavigateToListings={() => setFilters({ ...filters, tab: 'ilanlar' })}
                    />
                ) : (
                    <>
                        {/* Grid */}
                        {loading ? (
                            <div className="py-20 flex items-center justify-center">
                                <PetLoading message="Pati dünyası yükleniyor..." />
                            </div>
                        ) : (featuredListings.length === 0 && regularListings.length === 0) ? (
                            <div className="text-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
                                <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <h3 className="font-bold text-slate-800 text-lg mb-2">İlan bulunamadı</h3>
                                <p className="text-slate-500 mb-6 text-sm">Farklı filtreler deneyin veya ilk ilanı siz oluşturun.</p>
                                <Link href="/ilan-olustur" className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-500 transition-colors">
                                    Ücretsiz İlan Ver
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-12">
                                {featuredListings.length > 0 && (
                                    <section>
                                        <div className="flex items-center gap-2 mb-6">
                                            <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                                            <h2 className="text-xl font-black text-slate-800 tracking-tight">VİTRİN İLANLARI</h2>
                                            <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ml-1">ÖNE ÇIKANLAR</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                            {featuredListings.map(listing => (
                                                <ListingCard
                                                    key={listing.id}
                                                    listing={listing}
                                                    isFavorite={favorites.includes(listing.id)}
                                                    onToggleFavorite={handleToggleFavorite}
                                                />
                                            ))}
                                        </div>
                                    </section>
                                )}

                                <section>
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="w-1.5 h-6 bg-slate-300 rounded-full"></div>
                                        <h2 className="text-xl font-black text-slate-800 tracking-tight">TÜM İLANLAR</h2>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                        {regularListings.map(listing => (
                                            <ListingCard
                                                key={listing.id}
                                                listing={listing}
                                                isFavorite={favorites.includes(listing.id)}
                                                onToggleFavorite={handleToggleFavorite}
                                            />
                                        ))}
                                    </div>
                                </section>
                            </div>
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
        </Suspense>
    );
}
