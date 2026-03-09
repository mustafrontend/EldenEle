'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../lib/AuthContext';
import { getUserListings, getFavoriteListings, subscribeMessages, sendMessage } from '../../lib/listingService';
import { getUserPosts, deletePost } from '../../lib/communityService';
import AppHeader from '../../components/AppHeader';
import ListingCard from '../../components/ListingCard';
import ChatModal from '../../components/ChatModal';
import PetLoading from '../../components/PetLoading';
import UserBadge from '../../components/UserBadge';

function formatDate(ts) {
    if (!ts?.seconds) return '';
    return new Date(ts.seconds * 1000).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const tabs = [
    { key: 'ilanlarim', label: 'İlanlarım' },
    { key: 'taleplerim', label: 'Taleplerim' },
    { key: 'favorilerim', label: 'Favorilerim' },
    { key: 'mesajlarim', label: 'Mesajlarım' },
];

export default function ProfilePage() {
    const router = useRouter();
    const { user, userData, loading: authLoading, logout, toggleFavorite } = useAuth();

    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState(tabParam || 'ilanlarim');
    const [activeChat, setActiveChat] = useState(null);
    const [myListings, setMyListings] = useState([]);
    const [myPosts, setMyPosts] = useState([]);
    const [favoriteListings, setFavoriteListings] = useState([]);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);

    // Listing Action State
    const [deletingId, setDeletingId] = useState(null);
    const [deletingType, setDeletingType] = useState('listing'); // 'listing' or 'post'

    // Grouping Messages
    const grouped = {};
    messages.forEach(msg => {
        const otherUserId = msg.senderId === user?.uid ? msg.receiverId : msg.senderId;
        const otherUserName = msg.senderId === user?.uid ? 'Karşı Taraf' : msg.senderName;

        const convoId = `${msg.listingId}_${otherUserId}`;
        if (!grouped[convoId]) {
            grouped[convoId] = {
                id: convoId,
                listingId: msg.listingId,
                otherUserId,
                otherUserName,
                messages: []
            };
        }
        grouped[convoId].messages.push(msg);
        // Optimize name if we find an incoming message
        if (msg.senderId !== user?.uid) {
            grouped[convoId].otherUserName = msg.senderName;
        }
    });

    const conversations = Object.values(grouped).sort((a, b) => {
        const aLatest = a.messages[0]?.createdAt?.seconds || 0;
        const bLatest = b.messages[0]?.createdAt?.seconds || 0;
        return bLatest - aLatest;
    });

    async function handleSendMessage(listingId, receiverId, text) {
        if (!user) return;
        try {
            await sendMessage({ listingId, receiverId, text });
        } catch (e) { console.error(e); }
    }

    async function confirmDelete() {
        if (!deletingId) return;
        try {
            if (deletingType === 'listing') {
                const { deleteListing } = await import('../../lib/listingService');
                await deleteListing(deletingId);
                setMyListings(prev => prev.filter(l => l.id !== deletingId));
            } else {
                await deletePost(deletingId);
                setMyPosts(prev => prev.filter(p => p.id !== deletingId));
            }
            setDeletingId(null);
        } catch (e) {
            console.error(e);
            alert("Silme işlemi sırasında hata oluştu.");
        }
    }

    useEffect(() => {
        if (tabParam) {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const my = await getUserListings(user.uid);
            setMyListings(my);

            const posts = await getUserPosts(user.uid);
            setMyPosts(posts);

            const favIds = userData?.favorites || [];
            if (favIds.length) {
                const favs = await getFavoriteListings(favIds);
                setFavoriteListings(favs);
            }
        } catch (e) {
            console.error("Fetch profile data error:", e);
        } finally {
            setLoading(false);
        }
    }, [user, userData]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/giris');
            return;
        }
        if (user) {
            fetchData();
            const unsub = subscribeMessages(user.uid, (msgs) => {
                setMessages(msgs);
            });
            return () => unsub();
        }
    }, [authLoading, user, fetchData, router]);

    async function handleLogout() {
        await logout();
        router.push('/');
    }

    if (authLoading) return null;
    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50 overflow-x-hidden flex flex-col relative w-full max-w-[100vw]">
            <AppHeader />
            <div className="max-w-4xl mx-auto px-4 py-8 pb-28 sm:pb-8 w-full">

                {/* Profile Header - Minimal & Clean */}
                <div className="bg-white border border-slate-200/60 rounded-[2rem] p-6 sm:p-8 mb-8 shadow-[0_2px_20px_rgba(0,0,0,0.02)] relative overflow-hidden">
                    <div className="relative flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8">
                        {/* Avatar */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-2xl font-black text-slate-800 shadow-inner group">
                            {(user.displayName || 'U')[0].toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-2 mb-1">
                                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 truncate">
                                    {user.displayName || 'Kullanıcı'}
                                </h1>
                                <UserBadge badges={userData?.badges} />
                                <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-widest shrink-0">AKTİF</span>
                            </div>
                            <p className="text-slate-400 text-xs sm:text-sm font-medium mb-1 truncate">{user.email}</p>
                            {userData?.phone && (
                                <p className="text-slate-500 text-xs font-bold flex items-center gap-1.5 uppercase tracking-tighter">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    {userData.phone}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-2 mt-4 sm:mt-0">
                            <button onClick={handleLogout} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-50 hover:bg-red-50 hover:text-red-600 border border-slate-200 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                ÇIKIŞ
                            </button>
                        </div>
                    </div>

                    {/* Stats - Horizontal Row */}
                    <div className="flex items-center gap-4 sm:gap-8 mt-8 pt-6 border-t border-slate-100 overflow-x-auto scrollbar-hide">
                        {[
                            { val: myListings.length, label: 'İLANLAR' },
                            { val: myPosts.length, label: 'TALEPLER' },
                            { val: favoriteListings.length, label: 'FAVORİLER' },
                            { val: messages.length, label: 'MESAJLAR' }
                        ].map((stat, idx) => (
                            <div key={idx} className="flex flex-col min-w-max">
                                <span className="text-xl font-black text-slate-900 leading-none mb-1">{stat.val}</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tabs - Minimalist */}
                <div className="flex overflow-x-auto scrollbar-hide mb-8 border-b border-slate-200 w-full group">
                    <div className="flex min-w-max w-full sm:w-auto gap-2">
                        {tabs.map(tab => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                className={`flex-1 sm:flex-none px-6 py-4 text-[12px] whitespace-nowrap transition-all border-b-2 font-black uppercase tracking-widest ${activeTab === tab.key ? 'border-orange-500 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* İlanlarım */}
                {activeTab === 'ilanlarim' && (
                    <div>
                        {loading ? (
                            <PetLoading />
                        ) : myListings.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
                                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <h3 className="font-bold text-gray-900 mb-2">Henüz ilanınız yok</h3>
                                <p className="text-gray-500 text-sm mb-6">İlk ilanınızı oluşturarak pazar yerine katılın.</p>
                                <Link href="/ilan-olustur" className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors">
                                    Yeni İlan Ver
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {myListings.map(l => (
                                    <ListingCard
                                        key={l.id}
                                        listing={l}
                                        isFavorite={false}
                                        onToggleFavorite={() => { }}
                                        showActions={true}
                                        onDelete={() => { setDeletingType('listing'); setDeletingId(l.id); }}
                                        onEdit={() => router.push(`/ilan-olustur?edit=${l.id}`)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Taleplerim */}
                {activeTab === 'taleplerim' && (
                    <div>
                        {loading ? (
                            <PetLoading />
                        ) : myPosts.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
                                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                                <h3 className="font-bold text-gray-900 mb-2">Henüz talebiniz yok</h3>
                                <p className="text-gray-500 text-sm mb-6">Topluluk sayfasından soru sorabilir veya talep oluşturabilirsiniz.</p>
                                <Link href="/" className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors">
                                    Topluluğa Git
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {myPosts.map(p => (
                                    <div key={p.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-start group">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${p.type === 'soru' ? 'bg-amber-100 text-amber-700' : p.type === 'talep' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                                                    {p.type}
                                                </span>
                                                <span className="text-[10px] text-gray-400">{formatDate(p.createdAt)}</span>
                                            </div>
                                            <p className="text-slate-800 text-sm line-clamp-3 font-medium">{p.content}</p>
                                            <div className="flex gap-4 mt-3 text-[11px] text-gray-500">
                                                <span>{p.commentCount || 0} Yorum</span>
                                                <span>{p.likeCount || 0} Beğeni</span>
                                            </div>
                                        </div>
                                        <div className="flex sm:flex-col gap-2 shrink-0">
                                            <Link href={`/topluluk/${p.id}`} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Görüntüle">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </Link>
                                            <button
                                                onClick={() => { setDeletingType('post'); setDeletingId(p.id); }}
                                                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Sil">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Favorilerim */}
                {activeTab === 'favorilerim' && (
                    <div>
                        {favoriteListings.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
                                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                <h3 className="font-bold text-gray-900 mb-2">Favori ilanınız yok</h3>
                                <p className="text-gray-500 text-sm">İlanlarda kalp simgesine tıklayarak favorilerinize ekleyin.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {favoriteListings.map(l => (
                                    <ListingCard key={l.id} listing={l} isFavorite={true} onToggleFavorite={toggleFavorite} />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Mesajlarım */}
                {activeTab === 'mesajlarim' && (
                    <div>
                        {messages.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
                                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 3H3a2 2 0 00-2 2v14l4-4h14a2 2 0 002-2V5a2 2 0 00-2-2z" />
                                </svg>
                                <h3 className="font-bold text-gray-900 mb-2">Henüz mesajınız yok</h3>
                                <p className="text-gray-500 text-sm">Gelen mesajlar burada görünecektir.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {conversations.map(conv => {
                                    const lastMsg = conv.messages[0];
                                    const hasUnread = conv.messages.some(m => m.receiverId === user?.uid && !m.read);
                                    return (
                                        <div key={conv.id} onClick={() => setActiveChat(conv.id)} className={`bg-white rounded-xl p-5 border shadow-sm transition-shadow cursor-pointer group ${hasUnread ? 'border-red-200 bg-red-50/10' : 'border-gray-200 hover:border-indigo-100 hover:shadow-md'}`}>
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative w-12 h-12 rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 flex items-center justify-center text-slate-700 font-bold text-lg border border-slate-200 group-hover:scale-105 transition-transform shrink-0">
                                                        {(conv.otherUserName || 'K')[0].toUpperCase()}
                                                        {hasUnread && (
                                                            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border-2 border-white"></span>
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className={`truncate pr-4 ${hasUnread ? 'font-black text-slate-900' : 'font-bold text-slate-900'}`}>{conv.otherUserName}</div>
                                                        <div className={`text-sm line-clamp-1 mt-0.5 pr-8 ${hasUnread ? 'font-medium text-slate-800' : 'text-slate-500'}`}>
                                                            {lastMsg.senderId === user?.uid ? 'Siz: ' : ''}{lastMsg.text}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1.5 shrink-0 pl-2">
                                                    <span className="text-xs font-medium text-slate-400">
                                                        {formatDate(lastMsg.createdAt)}
                                                    </span>
                                                    <span className="text-[10px] text-indigo-500 font-medium px-2 py-0.5 bg-indigo-50 rounded-full">
                                                        Mesajlaş
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Chat Modal */}
            <ChatModal
                isOpen={!!activeChat}
                onClose={() => setActiveChat(null)}
                conversation={activeChat ? conversations.find(c => c.id === activeChat) : null}
                currentUser={user}
                onSend={handleSendMessage}
            />

            {/* Delete Confirmation Modal */}
            {deletingId && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 mb-2">{deletingType === 'listing' ? 'İlanı Sil' : 'Paylaşımı Sil'}</h3>
                        <p className="text-gray-500 text-sm mb-6">Bu {deletingType === 'listing' ? 'ilanı' : 'paylaşımı'} kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeletingId(null)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors">
                                İptal
                            </button>
                            <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors">
                                Evet, Sil
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
