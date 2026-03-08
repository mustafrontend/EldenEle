'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { subscribeNewPosts } from '../lib/communityService';

export default function NewPostsTracker({ onViewAll, totalPosts = 0 }) {
    const [newPosts, setNewPosts] = useState([]);

    useEffect(() => {
        const unsub = subscribeNewPosts((posts) => {
            setNewPosts(posts);
        }, 1); // Only fetch the absolute newest 1 post
        return () => unsub();
    }, []);

    if (newPosts.length === 0) return null;

    return (
        <div className="bg-white border border-slate-200/60 shadow-[0_2px_20px_rgb(0,0,0,0.02)] rounded-[2rem] p-5 sm:p-6 flex flex-col h-full animate-in fade-in duration-700">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-extrabold text-slate-800 text-[15px] tracking-tight">Toplulukta Neler Oluyor?</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            <span className="text-[11px] font-semibold text-slate-500">
                                {totalPosts > 0 ? `${totalPosts.toLocaleString('tr-TR')} Konu Başlığı` : 'Canlı Akış'}
                            </span>
                        </div>
                    </div>
                </div>
                {onViewAll && (
                    <button
                        onClick={onViewAll}
                        className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                )}
            </div>

            <div className="flex flex-col gap-2 w-full mt-auto">
                {newPosts.length > 0 ? newPosts.map((p, index) => {
                    const shortName = p.userName ? p.userName.split(' ')[0] : 'Biri';
                    return (
                        <Link
                            key={p.id}
                            href={`/topluluk/${p.id}`}
                            className="flex items-center gap-3 bg-slate-50/50 border border-slate-100 rounded-2xl p-2 pr-4 hover:bg-slate-50 hover:shadow-sm transition-all group"
                        >
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 border border-slate-100 shadow-[0_2px_8px_rgb(0,0,0,0.04)] group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                                {p.userPhoto ? (
                                    <img src={p.userPhoto} alt={p.userName} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-slate-700 text-[13px] font-black tracking-tighter">
                                        {shortName[0].toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[13px] font-black text-slate-800 tracking-tight">
                                        {shortName}
                                    </span>
                                    {index === 0 && (
                                        <span className="bg-indigo-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest border border-indigo-400 leading-none mt-0.5">
                                            YENİ
                                        </span>
                                    )}
                                </div>
                                <span className="text-[11px] font-semibold text-slate-500 truncate mt-0.5 leading-tight">
                                    "{p.content}"
                                </span>
                            </div>
                        </Link>
                    )
                }) : (
                    <div className="text-sm font-medium text-slate-400">Bekleniyor...</div>
                )}
            </div>
        </div>
    );
}
