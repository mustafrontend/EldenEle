'use client';

import { useState, useEffect } from 'react';
import { subscribeComments, createComment } from '../lib/communityService';
import { useAuth } from '../lib/AuthContext';
import Link from 'next/link';
import UserBadge from './UserBadge';

function formatDateTime(ts) {
    if (!ts?.seconds) return '';
    return new Date(ts.seconds * 1000).toLocaleString('tr-TR', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
}

export default function InlineComments({ postId }) {
    const { user, userData } = useAuth();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [isAdminReply, setIsAdminReply] = useState(false);

    useEffect(() => {
        const unsub = subscribeComments(postId, (data) => {
            setComments(data);
        });
        return () => unsub();
    }, [postId]);

    const isAdmin = userData?.role === 'admin' || userData?.email === 'mustafaozturk@gmail.com';

    async function handleSubmit(e) {
        e.preventDefault();
        if (!newComment.trim() || !user) return;
        setLoading(true);
        try {
            await createComment({
                postId,
                content: newComment.trim(),
                isAdminReply: isAdminReply
            });
            setNewComment('');
            // We keep isAdminReply as is if the user wants to continue replying as admin
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div onClick={(e) => e.stopPropagation()}>
            {/* WRITE COMMENT */}
            <div className="mb-4">
                {!user ? (
                    <div className="bg-slate-50 p-3 rounded-lg text-center text-xs text-slate-600 border border-slate-100">
                        Yorum yapmak için <Link href="/giris" className="font-bold underline text-slate-900">Giriş Yapın</Link>.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {isAdmin && (
                            <button
                                onClick={() => setIsAdminReply(!isAdminReply)}
                                className={`text-[10px] font-black px-2 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${isAdminReply ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-500 border-slate-200 opacity-60'}`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${isAdminReply ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`}></div>
                                {isAdminReply ? 'ADMIN OLARAK YANITLIYORSUN' : 'ADMIN OLARAK YANITLA'}
                            </button>
                        )}
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder={isAdminReply ? "Admin yanıtı yazın..." : "Yanıtınızı yazın..."}
                                    className={`w-full border rounded-full px-4 py-2 pr-12 focus:ring-1 outline-none text-sm transition-all ${isAdminReply ? 'bg-red-50/30 border-red-100 focus:ring-red-500 focus:border-red-500' : 'bg-slate-50 border-slate-200 focus:ring-slate-900 focus:border-slate-900'}`}
                                />
                                <button
                                    type="submit"
                                    disabled={!newComment.trim() || loading}
                                    className={`absolute right-1 bottom-1 top-1 text-white px-3 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 flex items-center justify-center ${isAdminReply ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-slate-800'}`}
                                >
                                    {loading ? (
                                        <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : 'Gönder'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* COMMENTS LIST */}
            <div className="space-y-4">
                {comments.map(c => (
                    <div key={c.id} className="group/comment">
                        <div className="flex gap-3">
                            {!c.isAdmin && (
                                <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden bg-slate-100 ring-2 ring-white shadow-sm mt-1">
                                    {c.userPhoto ? (
                                        <img src={c.userPhoto} alt={c.userName} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className={`flex-1 px-4 py-3 rounded-2xl border transition-all duration-300 ${c.isAdmin
                                ? 'bg-white border-2 border-red-600 shadow-[0_4px_20px_rgba(220,38,38,0.12)] relative overflow-hidden'
                                : 'bg-white border-[0.5px] border-slate-200 shadow-sm hover:shadow-md'
                                }`}>
                                {c.isAdmin && (
                                    <div className="absolute top-0 right-0 px-3 py-1 bg-red-600 text-[8px] font-black text-white uppercase tracking-widest rounded-bl-xl shadow-sm">
                                        RESMİ YANIT
                                    </div>
                                )}
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                    <span className={`font-black text-[13px] tracking-tight ${c.isAdmin ? 'text-red-700 uppercase' : 'text-slate-900'}`}>{c.userName}</span>
                                    {c.isAdmin && <UserBadge badges={['admin']} />}
                                    <span className="text-[10px] font-bold text-slate-400 ml-auto tracking-tighter uppercase">{formatDateTime(c.createdAt)}</span>
                                </div>
                                <p className={`text-[13px] leading-relaxed whitespace-pre-wrap ${c.isAdmin ? 'text-slate-900 font-bold' : 'text-slate-600 font-normal underline-offset-4'}`}>{c.content}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 text-center">
                <Link href={`/topluluk/${postId}`} className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest">Tüm detayları sayfada gör</Link>
            </div>
        </div>
    );
}

