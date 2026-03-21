'use client';

import { useState } from 'react';
import { sendFriendRequest } from '../lib/listingService';
import { toast } from 'react-hot-toast';

export default function NearbyUserCard({ user, currentUserId }) {
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleAddFriend = async () => {
        if (!currentUserId) {
            toast.error('Önce giriş yapmalısınız.');
            return;
        }
        setLoading(true);
        const res = await sendFriendRequest(currentUserId, user.id);
        if (res.success) {
            setSent(true);
            toast.success('Pati arkadaşlığı isteği gönderildi! 🐾');
        } else {
            toast.error(res.error || 'Bir hata oluştu.');
        }
        setLoading(false);
    };

    return (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all group overflow-hidden relative">
            <div className="flex items-center gap-4 relative z-10">
                {/* Profile Photo */}
                <div className="relative">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border-2 border-white shadow-sm transition-transform group-hover:scale-105">
                        {user.photoURL ? (
                            <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                        )}
                    </div>
                    {/* Active Status Dot */}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                </div>

                <div className="flex-1">
                    <h3 className="text-sm font-black text-slate-900 leading-tight mb-0.5">{user.displayName || 'İsimsiz Pati'}</h3>
                    <div className="flex items-center gap-1.5 opacity-60">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            📍 {user.city || 'Yakınlarda'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats / Bio */}
            <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="bg-slate-50 rounded-xl p-2 text-center">
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-tighter">İlanlar</span>
                    <span className="text-xs font-black text-slate-700">{user.listingsCount || 0}</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-2 text-center">
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-tighter">Arkadaşlar</span>
                    <span className="text-xs font-black text-slate-700">{user.friends?.length || 0}</span>
                </div>
            </div>

            <div className="mt-4 flex gap-2">
                <button
                    onClick={handleAddFriend}
                    disabled={sent || loading || user.friends?.includes(currentUserId)}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${sent || user.friends?.includes(currentUserId)
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-500'
                        }`}
                >
                    {sent ? 'İstek Gönderildi' : user.friends?.includes(currentUserId) ? 'Arkadaşısınız' : 'Arkadaş Ekle +'}
                </button>
                <button className="px-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-colors active:scale-95">
                    <span className="text-sm">💬</span>
                </button>
            </div>

            {/* Decorative background paw */}
            <span className="absolute -right-4 -bottom-4 text-6xl opacity-[0.03] rotate-12 pointer-events-none select-none">🐾</span>
        </div>
    );
}
