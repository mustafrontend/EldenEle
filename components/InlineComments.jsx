'use client';

import { useState, useEffect } from 'react';
import { subscribeComments, createComment } from '../lib/communityService';
import { useAuth } from '../lib/AuthContext';
import Link from 'next/link';

function formatDateTime(ts) {
    if (!ts?.seconds) return '';
    return new Date(ts.seconds * 1000).toLocaleString('tr-TR', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
}

export default function InlineComments({ postId }) {
    const { user } = useAuth();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const unsub = subscribeComments(postId, (data) => {
            setComments(data);
        });
        return () => unsub();
    }, [postId]);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!newComment.trim() || !user) return;
        setLoading(true);
        try {
            await createComment({ postId, content: newComment.trim() });
            setNewComment('');
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
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Yanıtınızı yazın..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-full px-4 py-2 pr-12 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none text-sm transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!newComment.trim() || loading}
                                className="absolute right-1 bottom-1 top-1 bg-slate-900 text-white px-3 rounded-full text-xs font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center"
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
                )}
            </div>

            {/* COMMENTS LIST */}
            <div className="space-y-3">
                {comments.map(c => (
                    <div key={c.id} className="flex gap-2">
                        <div className="w-6 h-6 rounded-full shrink-0 overflow-hidden bg-slate-100 mt-1">
                            {c.userPhoto ? (
                                <img src={c.userPhoto} alt={c.userName} className="w-full h-full object-cover" />
                            ) : (
                                <svg className="w-full h-full text-slate-400 p-1" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            )}
                        </div>
                        <div className="flex-1 bg-slate-50 p-2.5 rounded-2xl rounded-tl-sm border border-slate-100">
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-bold text-slate-900 text-[13px]">{c.userName}</span>
                                <span className="text-[11px] text-gray-400">{formatDateTime(c.createdAt)}</span>
                            </div>
                            <p className="text-slate-700 text-[13px] leading-relaxed whitespace-pre-wrap">{c.content}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-3 text-center">
                <Link href={`/topluluk/${postId}`} className="text-xs font-semibold text-blue-600 hover:text-blue-800">Tüm detayları sayfada gör</Link>
            </div>
        </div>
    );
}

