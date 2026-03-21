'use client';

import { useState, useEffect } from 'react';
import { getAllNews } from '../lib/listingService';

export default function DailyVisitsBanner() {
    const [visits, setVisits] = useState(1);
    const [generalNews, setGeneralNews] = useState(null);

    useEffect(() => {
        // Pseudo-random daily visit logic. 
        const todayStr = new Date().toDateString();
        const baseVisits = todayStr.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) * 15 + new Date().getDate() * 100;
        let initialVisits = baseVisits;
        const now = new Date();
        const secondsPassed = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        initialVisits += Math.floor(secondsPassed / 15);
        setVisits(initialVisits);

        const interval = setInterval(() => {
            if (Math.random() > 0.4) {
                setVisits(prev => prev + 1);
            }
        }, 12000);

        // Fetch general news
        const fetchNews = async () => {
            const newsList = await getAllNews();
            const latestGeneral = newsList.find(n => n.type === 'general' && n.isActive !== false);
            if (latestGeneral) setGeneralNews(latestGeneral);
        };
        fetchNews();

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full bg-slate-50/80 backdrop-blur-md border-b border-slate-200/60 py-2.5 relative z-40">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">

                {/* Active Users - Left Side */}
                <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white/80 rounded-full border border-slate-200/50 shadow-sm">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <p className="text-[11px] font-bold text-slate-600 tracking-tight">
                        Şu an <span className="text-slate-900 font-extrabold">{visits.toLocaleString('tr-TR')}</span> kişi online
                    </p>
                </div>

                {/* News Section - Center/Right */}
                {generalNews && (
                    <div className="flex-1 flex items-center justify-center sm:justify-end w-full animate-in fade-in slide-in-from-right-4 duration-1000">
                        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto bg-orange-50/40 border border-orange-100/50 rounded-2xl sm:rounded-full px-4 py-2 sm:py-1.5 transition-all hover:bg-orange-50/60 group">
                            <div className="flex items-center gap-2 max-w-full">
                                <span className="text-lg group-hover:scale-110 transition-transform duration-300">📣</span>
                                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-tighter truncate max-w-[120px] sm:max-w-none">
                                    {generalNews.title}
                                </h4>
                            </div>

                            <div className="h-px w-8 sm:h-3 sm:w-px bg-orange-200/60 hidden sm:block shrink-0" />

                            <div
                                className="text-[11px] text-slate-500 font-medium line-clamp-1 sm:line-clamp-none text-center sm:text-left flex-1 min-w-0 pointer-events-none"
                                dangerouslySetInnerHTML={{ __html: generalNews.desc }}
                            />

                            {generalNews.ctaHref && (
                                <a
                                    href={generalNews.ctaHref}
                                    className="flex items-center gap-1 text-[11px] font-black text-orange-600 hover:text-orange-500 transition-colors bg-white px-3 py-1 rounded-full border border-orange-200/50 shadow-sm sm:shadow-none sm:border-none sm:bg-transparent"
                                >
                                    {generalNews.ctaText || 'İncele'}
                                    <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
