'use client';

import { useState, useEffect } from 'react';
import { subscribeNewUsers } from '../lib/listingService';

export default function NewUsersTracker({ totalUsers = 0 }) {
    const [newUsers, setNewUsers] = useState([]);

    useEffect(() => {
        const unsub = subscribeNewUsers((users) => {
            setNewUsers(users);
        }, 8); // top 8 newest users
        return () => unsub();
    }, []);

    return (
        <div className="bg-white border border-slate-200/60 shadow-[0_2px_20px_rgb(0,0,0,0.02)] rounded-[2rem] p-5 sm:p-6 flex flex-col h-full animate-in fade-in duration-700">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-extrabold text-slate-800 text-[15px] tracking-tight">Aramıza Yeni Katılanlar</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[11px] font-semibold text-slate-500">
                                {totalUsers > 0 ? `${totalUsers.toLocaleString('tr-TR')} Aktif Kullanıcı` : 'Canlı'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex overflow-x-auto scrollbar-hide snap-x gap-3 pb-2 pt-1 w-full mt-auto">
                {newUsers.length > 0 ? newUsers.map((u, index) => (
                    <div key={u.id} className="relative snap-start shrink-0 flex items-center gap-3 bg-slate-50/50 border border-slate-100 rounded-2xl pr-4 pl-2 py-2 hover:bg-slate-50 hover:shadow-sm transition-all group cursor-default">
                        {index === 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-indigo-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-sm z-10 border-[1.5px] border-white">
                                YENİ
                            </span>
                        )}
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 border border-slate-100 shadow-[0_2px_8px_rgb(0,0,0,0.04)] group-hover:scale-105 transition-transform duration-300">
                            <span className="text-slate-700 text-[13px] font-black tracking-tighter">
                                {(u.displayName || u.email || 'A')[0].toUpperCase()}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[13px] font-black text-slate-800 leading-tight tracking-tight">
                                {u.displayName ? u.displayName.split(' ')[0] : 'Kullanıcı'}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400 mt-0.5">Hoş geldin!</span>
                        </div>
                    </div>
                )) : (
                    <div className="text-sm font-medium text-slate-400">Bekleniyor...</div>
                )}
            </div>
        </div>
    );
}
