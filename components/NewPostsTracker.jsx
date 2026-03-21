'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { subscribeNewPosts } from '../lib/communityService';

export default function NewPostsTracker({ onViewAll, totalPosts = 0 }) {
    const [newPosts, setNewPosts] = useState([]);

    useEffect(() => {
        const unsub = subscribeNewPosts((posts) => {
            setNewPosts(posts);
        }, 4); // Limited to 4 posts as requested
        return () => unsub();
    }, []);

    if (newPosts.length === 0) return (
        <div className="bg-white border border-slate-200/60 rounded-[2rem] p-6 h-full flex items-center justify-center">
            <span className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">Akış Bekleniyor...</span>
        </div>
    );

    return (
        <div className="bg-white border border-slate-200/60 shadow-[0_2px_20px_rgb(0,0,0,0.02)] rounded-[2rem] p-5 sm:p-6 flex flex-col h-full animate-in fade-in duration-700 relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl"></div>

            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100/50 text-indigo-500 shadow-sm">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 text-[15px] tracking-tight leading-none mb-1.5">Topluluk Nabzı</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            <span className="text-[11px] font-bold text-slate-400">
                                {totalPosts > 0 ? `${totalPosts.toLocaleString('tr-TR')} Konu` : 'Canlı Akış'}
                            </span>
                        </div>
                    </div>
                </div>
                {onViewAll && (
                    <button
                        onClick={onViewAll}
                        className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all active:scale-90 shrink-0"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                )}
            </div>

            <div className="flex flex-col gap-2.5 w-full relative z-10 flex-1 overflow-hidden">
                {newPosts.map((p, index) => {
                    const shortName = p.userName ? p.userName.split(' ')[0] : 'Biri';
                    return (
                        <Link
                            key={p.id}
                            href={`/topluluk/${p.id}`}
                            className="flex items-center gap-3 bg-white border border-slate-100/80 rounded-2xl p-2 px-3 hover:border-indigo-200 hover:shadow-sm transition-all group active:scale-[0.98] min-h-[54px]"
                        >
                            <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 shadow-inner group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                                {p.userPhoto ? (
                                    <img src={p.userPhoto} alt={p.userName} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-slate-400 text-[12px] font-black tracking-tighter">
                                        {shortName[0].toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-[12px] font-black text-slate-800 tracking-tight leading-none group-hover:text-indigo-600 transition-colors">
                                        {shortName}
                                    </span>
                                    {index < 2 && (
                                        <span className="bg-emerald-500 text-white text-[7px] font-black px-1.2 py-0.5 rounded-full uppercase tracking-widest border border-white shadow-sm leading-none">
                                            YENİ
                                        </span>
                                    )}
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 truncate leading-tight italic">
                                    "{p.content}"
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
