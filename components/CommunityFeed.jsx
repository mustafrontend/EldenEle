'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { subscribePosts, togglePostLike } from '../lib/communityService';
import CreatePost from './CreatePost';
import InlineComments from './InlineComments';
import { useAuth } from '../lib/AuthContext';
import UserBadge from './UserBadge';
import { toast } from 'react-hot-toast';

function formatTimeAgo(ts) {
    if (!ts?.seconds) return '';
    const seconds = Math.floor(Date.now() / 1000) - ts.seconds;
    if (seconds < 60) return `${seconds}sn`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}d`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}s`;
    return new Date(ts.seconds * 1000).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

export default function CommunityFeed({ recentListings = [], onNavigateToListings }) {
    const { user } = useAuth();
    const router = useRouter();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedPostId, setExpandedPostId] = useState(null);

    useEffect(() => {
        const unsub = subscribePosts((data) => {
            // Sort: Featured first, then by date
            const sorted = [...data].sort((a, b) => {
                // Absolute Priority to Featured Items
                if (a.userIsFeatured && !b.userIsFeatured) return -1;
                if (!a.userIsFeatured && b.userIsFeatured) return 1;
                // If both are same status, sort by date
                return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
            });
            setPosts(sorted);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    async function handleLike(e, postId) {
        if (!user) return;
        e.stopPropagation();
        try {
            await togglePostLike(postId);
        } catch (err) {
            console.error(err);
        }
    }

    const trendingPosts = useMemo(() => {
        return [...posts].sort((a, b) => ((b.commentCount || 0) + (b.likeCount || 0)) - ((a.commentCount || 0) + (a.likeCount || 0))).slice(0, 3);
    }, [posts]);

    const unansweredPosts = useMemo(() => {
        return posts.filter(p => !p.commentCount && p.type === 'soru').slice(0, 3);
    }, [posts]);

    const renderTrending = () => (
        <div className="bg-gradient-to-br from-white to-orange-50/30 rounded-2xl border border-orange-100 shadow-sm p-3 sm:p-4 relative overflow-hidden flex flex-col h-full">
            <div className="flex items-center justify-between mb-3 sm:mb-4 relative z-10 shrink-0">
                <h3 className="text-[13px] sm:text-[16px] font-bold text-slate-800 flex items-center gap-1.5 sm:gap-2 line-clamp-1">
                    <span className="text-base sm:text-xl">🔥</span> Gündemdekiler
                </h3>
            </div>
            <div className="space-y-2.5 sm:space-y-3 relative z-10 flex-1">
                {trendingPosts.map(post => (
                    <Link key={post.id} href={`/topluluk/${post.id}`} className="group block bg-white border border-slate-100 p-2.5 sm:p-3 rounded-xl shadow-sm hover:border-orange-300 transition-colors">
                        <h4 className="font-semibold text-slate-800 text-[12px] sm:text-[13px] line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors mb-2">
                            {post.content}
                        </h4>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-[10px] sm:text-[11px] text-slate-500 font-medium">
                            <span className="flex items-center gap-1 line-clamp-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0"></span><span className="truncate">{post.userName}</span></span>
                            <span className="flex items-center gap-1 text-indigo-500 shrink-0"><svg className="w-3 sm:w-3.5 h-3 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>{post.commentCount || 0}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );

    const renderUnanswered = () => (
        <div className="bg-gradient-to-br from-white to-emerald-50/30 rounded-2xl border border-emerald-100 shadow-sm p-3 sm:p-4 relative overflow-hidden flex flex-col h-full">
            <div className="flex items-center justify-between mb-3 sm:mb-4 relative z-10 shrink-0">
                <h3 className="text-[13px] sm:text-[16px] font-bold text-slate-800 flex items-center gap-1.5 sm:gap-2 line-clamp-1">
                    <span className="text-base sm:text-xl">💡</span> İlk Cevapla
                </h3>
            </div>
            <div className="space-y-2.5 sm:space-y-3 relative z-10 flex-1">
                {unansweredPosts.map(post => (
                    <Link key={post.id} href={`/topluluk/${post.id}`} className="group block bg-white border border-slate-100 p-2.5 sm:p-3 rounded-xl shadow-sm hover:border-emerald-300 transition-colors">
                        <h4 className="font-semibold text-slate-800 text-[12px] sm:text-[13px] line-clamp-2 leading-snug group-hover:text-emerald-600 transition-colors mb-2">
                            {post.content}
                        </h4>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-0 text-[10px] sm:text-[11px] text-slate-500 font-medium">
                            <span className="shrink-0">{formatTimeAgo(post.createdAt)}</span>
                            <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 truncate text-[9px] sm:text-[10px]">Bekliyor</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );

    const renderVitrin = () => (
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200 shadow-sm p-4 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 relative z-10">
                <h3 className="text-[15px] sm:text-[16px] font-bold text-slate-800 flex items-center gap-2">
                    <div className="w-5 sm:w-6 h-5 sm:h-6 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                        <svg className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    Vitrin İlanlar
                </h3>
                <button onClick={onNavigateToListings} className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 p-1 bg-indigo-50/50 rounded px-2 border border-indigo-100/50">Tümü</button>
            </div>
            <div className="space-y-3 relative z-10">
                {recentListings.map(listing => (
                    <Link key={listing.id} href={`/ilan/${listing.id}`} className="flex gap-3 group hover:-translate-y-0.5 transition-all duration-200 bg-white border border-slate-100 p-2 rounded-xl">
                        <div className="w-12 h-12 rounded-[10px] overflow-hidden bg-slate-50 shrink-0 border border-slate-200 group-hover:border-indigo-300 transition-colors">
                            {listing.photos && listing.photos[0] ? (
                                <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <h4 className="font-bold text-slate-800 text-[12px] leading-snug line-clamp-1 mb-0.5 group-hover:text-indigo-600 transition-colors">
                                {listing.title}
                            </h4>
                            <div className="flex items-center gap-1.5 overflow-hidden">
                                <span className="text-[10px] text-slate-500 font-medium truncate">{listing.category}</span>
                                {listing.userBadges && listing.userBadges.length > 0 && (
                                    <div className="scale-75 origin-left h-4 flex items-center">
                                        <UserBadge badges={[listing.userBadges[0]]} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 lg:items-start">
            {/* Left Content - Community Feed */}
            <div className="flex-1 max-w-3xl lg:max-w-[800px] mx-auto w-full">

                {/* Mobile Top Widgets (Split 50/50, hidden on desktop) */}
                <div className="grid grid-cols-2 gap-3 mb-6 lg:hidden">
                    {trendingPosts.length > 0 && renderTrending()}
                    {unansweredPosts.length > 0 && renderUnanswered()}
                </div>

                <CreatePost />

                <div className="space-y-4 mt-2">
                    {loading ? (
                        <div className="animate-pulse space-y-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="bg-white border text-left border-slate-200 p-4 rounded-2xl shadow-sm">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-slate-100 rounded-full"></div>
                                        <div className="h-4 bg-slate-100 rounded w-32"></div>
                                    </div>
                                    <div className="h-16 bg-slate-100 rounded w-full"></div>
                                </div>
                            ))}
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl shadow-sm">
                            <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                            </svg>
                            <h3 className="text-slate-800 font-bold">Henüz gönderi yok</h3>
                            <p className="text-slate-500 text-sm mt-1">İlk soruyu siz sorun!</p>
                        </div>
                    ) : (
                        posts.map(post => {
                            const isLiked = user && post.likedBy?.includes(user.uid);
                            return (
                                <div key={post.id} onClick={() => router.push(`/topluluk/${post.id}`)} className={`bg-white border text-left rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group mb-1 ${post.userIsFeatured ? 'border-amber-400 ring-4 ring-amber-500/5' : 'border-slate-200 hover:border-indigo-300'}`}>
                                    <div className="flex gap-3">
                                        <div className="flex-shrink-0">
                                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm">
                                                {post.userPhoto ? (
                                                    <img src={post.userPhoto} alt={post.userName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-indigo-600 font-bold text-lg">
                                                        {(post.userName || 'U')[0].toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2 truncate">
                                                    <span className="font-bold text-slate-800 text-[15px] truncate flex items-center gap-1.5 flex-wrap">
                                                        {post.userName}
                                                        <UserBadge badges={post.userBadges} />
                                                        {post.userIsFeatured && (
                                                            <svg className="w-4 h-4 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                            </svg>
                                                        )}
                                                    </span>
                                                    <span className="text-slate-500 text-sm shrink-0">· {formatTimeAgo(post.createdAt)}</span>
                                                </div>
                                                {post.type === 'soru' ? (
                                                    <span className="shrink-0 bg-blue-50 text-blue-600 text-[11px] px-2 py-0.5 rounded-full font-bold border border-blue-200">Soru</span>
                                                ) : post.type === 'talep' ? (
                                                    <span className="shrink-0 bg-emerald-50 text-emerald-600 text-[11px] px-2 py-0.5 rounded-full font-bold border border-emerald-200">Hizmet Talebi</span>
                                                ) : null}
                                            </div>

                                            <p className="text-slate-700 text-[15px] leading-relaxed mb-3 whitespace-pre-wrap word-break">
                                                {post.content}
                                            </p>

                                            {post.imageUrl && (
                                                <div className="mb-3 rounded-xl overflow-hidden border border-slate-200 shadow-sm relative bg-slate-50/50">
                                                    <img src={post.imageUrl} alt="Gönderi" className="w-full h-auto max-h-[500px] object-contain mx-auto block" />
                                                </div>
                                            )}

                                            <div className="flex items-center gap-6 text-slate-500">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setExpandedPostId(expandedPostId === post.id ? null : post.id);
                                                    }}
                                                    className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors group/btn"
                                                >
                                                    <div className="p-1.5 rounded-full group-hover/btn:bg-indigo-50 transition-colors">
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-sm font-bold">{post.commentCount || 0}</span>
                                                </button>

                                                <button onClick={(e) => handleLike(e, post.id)} className={`flex items-center gap-1.5 hover:text-rose-500 transition-colors group/btn ${isLiked ? 'text-rose-500' : ''}`}>
                                                    <div className="p-1.5 rounded-full group-hover/btn:bg-rose-50 transition-colors">
                                                        <svg className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-sm font-bold">{post.likeCount || 0}</span>
                                                </button>

                                                <button onClick={(e) => {
                                                    e.stopPropagation();
                                                    const url = `${window.location.origin}/topluluk/${post.id}`;
                                                    if (navigator.share) {
                                                        navigator.share({ title: 'Topluluk Gönderisi', url });
                                                    } else {
                                                        navigator.clipboard.writeText(url);
                                                        toast.success("Gönderi bağlantısı kopyalandı!");
                                                    }
                                                }} className="flex items-center gap-1.5 hover:text-blue-500 transition-colors group/btn ml-auto">
                                                    <div className="p-1.5 rounded-full group-hover/btn:bg-blue-50 transition-colors">
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                                        </svg>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    {expandedPostId === post.id && (
                                        <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <InlineComments postId={post.id} />
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    )}
                </div>

                {/* Mobile Vitrin (Hidden on desktop, placed below posts on mobile) */}
                <div className="mt-8 lg:hidden">
                    {recentListings && recentListings.length > 0 && renderVitrin()}
                </div>
            </div>

            {/* Desktop Right Sidebar (Hidden on mobile) */}
            <div className="hidden lg:flex flex-col w-[320px] 2xl:w-[350px] shrink-0 sticky top-24 space-y-6">
                {trendingPosts.length > 0 && renderTrending()}
                {unansweredPosts.length > 0 && renderUnanswered()}
                {recentListings && recentListings.length > 0 && renderVitrin()}
            </div>
        </div>
    );
}
