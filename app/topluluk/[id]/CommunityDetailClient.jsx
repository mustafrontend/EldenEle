'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/AuthContext';
import { subscribeComments, createComment, getPost, incrementPostView } from '../../../lib/communityService';
import AppHeader from '../../../components/AppHeader';
import UserBadge from '../../../components/UserBadge';
import PetLoading from '../../../components/PetLoading';

function formatDateTime(ts) {
    if (!ts?.seconds) return '';
    return new Date(ts.seconds * 1000).toLocaleString('tr-TR', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
}

export default function CommunityDetailClient({ postId, serverPost }) {
    const { user, userData } = useAuth();
    const [post, setPost] = useState(serverPost);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch latest post data just in case
        if (!serverPost) {
            getPost(postId).then(data => {
                setPost(data);
                if (data && data.id) incrementPostView(data.id);
            });
        } else if (serverPost && serverPost.id) {
            incrementPostView(serverPost.id);
        }

        const unsub = subscribeComments(postId, (data) => {
            setComments(data);
        });
        return () => unsub();
    }, [postId, serverPost]);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!newComment.trim() || !user) return;
        setLoading(true);
        try {
            await createComment({
                postId,
                content: newComment.trim(),
                userBadges: userData?.badges || []
            });
            setNewComment('');
            // Optimistically update post comment count
            if (post) {
                setPost({ ...post, commentCount: (post.commentCount || 0) + 1 });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <AppHeader />

            <main className="max-w-2xl mx-auto px-4 mt-6">
                <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-slate-900 mb-6 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Geri Dön
                </Link>

                {!post ? (
                    <div className="py-20 flex items-center justify-center">
                        <PetLoading message="Topluluk gönderisi getiriliyor..." />
                    </div>
                ) : (
                    <>
                        {/* ORIGINAL POST */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-6 relative overflow-hidden">
                            {post.type === 'soru' ? (
                                <div className="absolute top-0 right-0 bg-amber-50 text-amber-700 px-4 py-1 text-xs font-bold rounded-bl-xl border-b border-l border-amber-100">SORU</div>
                            ) : post.type === 'talep' ? (
                                <div className="absolute top-0 right-0 bg-emerald-50 text-emerald-700 px-4 py-1 text-xs font-bold rounded-bl-xl border-b border-l border-emerald-100">TALEP</div>
                            ) : null}

                            <div className="flex items-center gap-4 mb-4 mt-2">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100">
                                    {post.userPhoto ? (
                                        <img src={post.userPhoto} alt={post.userName} className="w-full h-full object-cover" />
                                    ) : (
                                        <svg className="w-full h-full text-slate-400 p-2" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="font-bold text-slate-900">{post.userName}</h1>
                                        {post.userBadges && <UserBadge badges={post.userBadges} />}
                                    </div>
                                    <p className="text-sm text-gray-500">{formatDateTime(post.createdAt)}</p>
                                </div>
                            </div>

                            <p className="text-lg text-slate-800 leading-relaxed whitespace-pre-wrap font-medium pb-4 border-b border-gray-100">
                                {post.content}
                            </p>

                            {post.imageUrl && (
                                <div className="mb-4 rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50/30 text-center">
                                    <img src={post.imageUrl} alt="Gönderi" className="w-full h-auto max-h-[600px] object-contain mx-auto block" />
                                </div>
                            )}

                            <div className="flex items-center gap-6 mt-4 text-gray-400">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <span className="font-medium">{post.commentCount || 0} Yorum</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    <span className="font-medium text-pink-500">{post.likeCount || 0} Beğeni</span>
                                </div>
                                <button onClick={() => {
                                    const url = window.location.href;
                                    if (navigator.share) {
                                        navigator.share({ title: 'Topluluk Gönderisi', url });
                                    } else {
                                        navigator.clipboard.writeText(url);
                                        alert("Gönderi bağlantısı kopyalandı!");
                                    }
                                }} className="flex items-center gap-2 ml-auto hover:text-blue-500 transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                    <span className="font-medium">Paylaş</span>
                                </button>
                            </div>
                        </div>

                        {/* WRITE COMMENT */}
                        <div className="mb-8">
                            {!user ? (
                                <div className="bg-slate-100 p-4 rounded-xl text-center text-sm text-slate-600 border border-slate-200">
                                    Yorum yapmak için <Link href="/giris" className="font-bold underline text-slate-900">Giriş Yapın</Link>.
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="flex gap-3">
                                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-slate-200">
                                        {user.photoURL ? (
                                            <img src={user.photoURL} alt="Sen" className="w-full h-full object-cover" />
                                        ) : (
                                            <svg className="w-full h-full text-slate-400 p-2" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="flex-1 relative">
                                        <textarea
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Yanıtınızı yazın..."
                                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 pr-24 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none resize-none min-h-[50px] transition-all"
                                            rows={1}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newComment.trim() || loading}
                                            className="absolute right-2 bottom-2 top-2 bg-slate-900 text-white px-4 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {loading ? (
                                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : 'Yanıtla'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* COMMENTS LIST */}
                        <div className="space-y-4">
                            {comments.length === 0 ? (
                                <p className="text-center text-gray-400 text-sm mt-8">Henüz yorum yapılmamış. İlk yanıtlayan siz olun!</p>
                            ) : (
                                comments.map(c => (
                                    <div key={c.id} className="flex gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                        <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden bg-slate-100">
                                            {c.userPhoto ? (
                                                <img src={c.userPhoto} alt={c.userName} className="w-full h-full object-cover" />
                                            ) : (
                                                <svg className="w-full h-full text-slate-400 p-2" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-slate-900 text-sm">{c.userName}</span>
                                                {c.userBadges && <UserBadge badges={c.userBadges} />}
                                                <span className="text-xs text-gray-400">{formatDateTime(c.createdAt)}</span>
                                            </div>
                                            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{c.content}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
