'use client';

import { useState, useEffect } from 'react';
import { subscribeNewUsers } from '../lib/listingService';
import UserBadge from './UserBadge';

export default function NewUsersTracker({ totalUsers = 0 }) {
    const [newUsers, setNewUsers] = useState([]);

    useEffect(() => {
        const unsub = subscribeNewUsers((users) => {
            setNewUsers(users);
        }, 8); // Limit to 8 users = 4 rows
        return () => unsub();
    }, []);

    return (
        <div className="bg-white border border-slate-200/60 shadow-[0_2px_20px_rgb(0,0,0,0.02)] rounded-[2rem] p-5 sm:p-6 flex flex-col h-full animate-in fade-in duration-700 relative overflow-hidden">
            {/* Soft Glow */}
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-orange-50/50 rounded-full blur-3xl"></div>

            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center border border-orange-100/50 text-orange-600 shadow-sm">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 text-[15px] tracking-tight leading-none mb-1.5">Aramıza Katılanlar</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[11px] font-bold text-slate-400">
                                {totalUsers > 0 ? `${totalUsers.toLocaleString('tr-TR')} Aktif` : 'Canlı'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-auto relative z-10 flex-1 overflow-hidden">
                {newUsers.map((u, index) => (
                    <div key={u.id} className="relative flex items-center gap-2.5 bg-white border border-slate-100/80 rounded-xl px-2 py-1.5 hover:border-orange-200 hover:shadow-sm transition-all group cursor-default max-h-[46px]">
                        {index < 3 && (
                            <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[6px] font-black px-1.2 py-0.5 rounded-full shadow-sm z-10 border border-white uppercase">
                                YENİ
                            </span>
                        )}
                        <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 shadow-inner group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                            {u.photoURL ? (
                                <img src={u.photoURL} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-slate-400 text-[10px] font-black tracking-tighter uppercase">
                                    {(u.displayName || u.email || 'A')[0]}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-black text-slate-800 leading-none truncate group-hover:text-orange-600 transition-colors">
                                {u.displayName ? u.displayName.split(' ')[0] : 'Kullanıcı'}
                            </span>
                            <span className="text-[8px] font-bold text-slate-400 mt-0.5 leading-none">Hoş geldin!</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
