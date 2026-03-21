'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../lib/AuthContext';
import { getUserListings, getFavoriteListings, subscribeMessages, sendMessage, renewListing, uploadPhotos } from '../../lib/listingService';
import { useRef } from 'react';
import { getUserPosts, deletePost } from '../../lib/communityService';
import AppHeader from '../../components/AppHeader';
import ListingCard from '../../components/ListingCard';
import ChatModal from '../../components/ChatModal';
import PetLoading from '../../components/PetLoading';
import UserBadge from '../../components/UserBadge';
import { toast } from 'react-hot-toast';
import { boostListing } from '../../lib/listingService';

function formatDate(ts) {
    if (!ts?.seconds) return '';
    return new Date(ts.seconds * 1000).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const tabs = [
    { key: 'ilanlarim', label: 'İlanlarım' },
    { key: 'taleplerim', label: 'Taleplerim' },
    { key: 'favorilerim', label: 'Favorilerim' },
    { key: 'mesajlarim', label: 'Mesajlarım' },
    { key: 'arkadaslarim', label: 'Arkadaşlarım' },
];

export default function ProfilePage() {
    const router = useRouter();
    const { user, userData, loading: authLoading, logout, toggleFavorite, updateUserInfo } = useAuth();

    const searchParams = useSearchParams();
    const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);
    const photoInputRef = useRef(null);
    const tabParam = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState(tabParam || 'ilanlarim');
    const [activeChat, setActiveChat] = useState(null);
    const [myListings, setMyListings] = useState([]);
    const [myPosts, setMyPosts] = useState([]);
    const [favoriteListings, setFavoriteListings] = useState([]);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [friendRequests, setFriendRequests] = useState([]);
    const [sentFriendRequests, setSentFriendRequests] = useState([]);
    const [friends, setFriends] = useState([]);

    // Listing Action State
    const [deletingId, setDeletingId] = useState(null);
    const [deletingType, setDeletingType] = useState('listing'); // 'listing' or 'post'

    // Grouping Messages
    const grouped = {};
    messages.forEach(msg => {
        const otherUserId = msg.senderId === user?.uid ? msg.receiverId : msg.senderId;

        // Try to get name/photo from message metadata (denormalized) OR fallback to friends list
        const friendInfo = friends.find(f => f.id === otherUserId);

        let otherUserName = friendInfo?.displayName || 'Kullanıcı';
        let otherUserPhoto = friendInfo?.photoURL || null;

        if (msg.senderId === user?.uid) {
            otherUserName = msg.receiverName || otherUserName;
            otherUserPhoto = msg.receiverPhoto || otherUserPhoto;
        } else {
            otherUserName = msg.senderName || otherUserName;
            otherUserPhoto = msg.senderPhoto || otherUserPhoto;
        }

        const convoId = `${msg.listingId}_${otherUserId}`;
        if (!grouped[convoId]) {
            grouped[convoId] = {
                id: convoId,
                listingId: msg.listingId,
                otherUserId,
                otherUserName,
                otherUserPhoto,
                unreadCount: 0,
                messages: []
            };
        }
        grouped[convoId].messages.push(msg);

        // Count unread (only incoming messages)
        if (msg.receiverId === user?.uid && !msg.read) {
            grouped[convoId].unreadCount++;
        }

        // Always prefer the friend list or latest denormalized metadata
        if (msg.senderId !== user?.uid) {
            grouped[convoId].otherUserName = msg.senderName || friendInfo?.displayName || grouped[convoId].otherUserName;
            grouped[convoId].otherUserPhoto = msg.senderPhoto || friendInfo?.photoURL || grouped[convoId].otherUserPhoto;
        } else {
            grouped[convoId].otherUserName = msg.receiverName || friendInfo?.displayName || grouped[convoId].otherUserName;
            grouped[convoId].otherUserPhoto = msg.receiverPhoto || friendInfo?.photoURL || grouped[convoId].otherUserPhoto;
        }
    });

    // Final fallback verification
    Object.values(grouped).forEach(convo => {
        if (convo.otherUserName === 'Kullanıcı') {
            const f = friends.find(fr => fr.id === convo.otherUserId);
            if (f) {
                convo.otherUserName = f.displayName;
                convo.otherUserPhoto = f.photoURL;
            }
        }
    });

    const conversations = Object.values(grouped).sort((a, b) => {
        const aLatest = a.messages[0]?.createdAt?.seconds || 0;
        const bLatest = b.messages[0]?.createdAt?.seconds || 0;
        return bLatest - aLatest;
    });

    async function handleSendMessage(listingId, receiverId, text, imageFile = null, receiverName = null, receiverPhoto = null) {
        if (!user) return;
        try {
            await sendMessage({
                listingId,
                receiverId,
                text,
                imageFile,
                receiverName, // Already passed from ChatModal
                receiverPhoto // Already passed from ChatModal
            });
        } catch (e) {
            console.error(e);
            toast.error("Mesaj gönderilemedi.");
        }
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
            toast.error("Silme işlemi sırasında hata oluştu.");
        }
    }

    async function handleRenewListing(id) {
        if (!userData || (userData.tokens || 0) < 1) {
            toast.error("Yeterli jetonunuz bulunmuyor.");
            return;
        }
        try {
            await renewListing(id, user.uid);
            toast.success("İlan süresi 30 gün uzatıldı!");
            fetchData();
        } catch (e) {
            console.error(e);
            toast.error("İşlem sırasında hata oluştu.");
        }
    }

    async function handleBoostListing(id) {
        if (!userData || (userData.tokens || 0) < 3) {
            toast.error("Öne çıkarmak için en az 3 jetonunuz olmalıdır.");
            return;
        }
        try {
            const tid = toast.loading('İlanınız öne çıkarılıyor...');
            await boostListing(id, user.uid);
            toast.success("İlanınız başarıyla öne çıkarıldı! ✨", { id: tid });
            fetchData();
        } catch (e) {
            console.error(e);
            toast.error("İşlem sırasında hata oluştu.");
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
            const { getFriendRequests, getFriends, getSentFriendRequests } = await import('../../lib/listingService');
            const requests = await getFriendRequests(user.uid);
            setFriendRequests(requests);
            const sentReqs = await getSentFriendRequests(user.uid);
            setSentFriendRequests(sentReqs);
            const frList = await getFriends(user.uid);
            setFriends(frList);
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

            // Real-time Messages
            const unsubMsgs = subscribeMessages(user.uid, (msgs) => {
                setMessages(msgs);
            });

            // Real-time Friend Requests
            let unsubReqs = () => { };
            import('../../lib/listingService').then(({ subscribeFriendRequests }) => {
                unsubReqs = subscribeFriendRequests(user.uid, (reqs) => {
                    setFriendRequests(reqs);
                    // Optional: show toast if a NEW request arrived and wasn't there before
                    if (reqs.length > friendRequests.length && friendRequests.length > 0) {
                        toast('Yeni bir pati arkadaşlık isteğin var! 🐾', { icon: '🔔' });
                    }
                });
            });

            return () => {
                unsubMsgs();
                unsubReqs();
            };
        }
    }, [authLoading, user, fetchData, router]);

    async function runAIVerification(imageSource) {
        try {
            setIsUpdatingPhoto(true);
            const tid = toast.loading('PatiAI Fotoğrafınızı İnceliyor...');
            let base64 = "";
            if (imageSource instanceof File) {
                const reader = new FileReader();
                const b64Promise = new Promise(resolve => {
                    reader.onload = e => resolve(e.target.result);
                });
                reader.readAsDataURL(imageSource);
                base64 = await b64Promise;
            } else {
                const res = await fetch(imageSource);
                const blob = await res.blob();
                const reader = new FileReader();
                const b64Promise = new Promise(resolve => {
                    reader.onload = e => resolve(e.target.result);
                });
                reader.readAsDataURL(blob);
                base64 = await b64Promise;
            }
            const aiRes = await fetch('/api/ai/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ task: 'verify-human-profile', data: { imageBase64: base64 } })
            });
            const aiData = await aiRes.json();
            let content = aiData.choices?.[0]?.message?.content || '{}';
            content = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(content);
            const isHumanVerified = !!parsed.isHuman;
            const verificationReason = parsed.reason || "";
            if (!isHumanVerified) {
                toast.error(`PatiAI Notu: Bu bir insan fotoğrafına benzemiyor. (${verificationReason})`, { duration: 5000, id: tid });
            } else {
                toast.success("Ömer: Fotoğrafınız doğrulandı! ✅", { id: tid });
            }
            await updateUserInfo({ isHumanVerified, verificationReason });
        } catch (err) {
            console.error("AI Verification failed:", err);
            toast.error("Doğrulama sırasında bir hata oluştu.");
        } finally {
            setIsUpdatingPhoto(false);
        }
    }

    async function handleLogout() {
        await logout();
        router.push('/');
    }

    async function handlePhotoUpdate(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUpdatingPhoto(true);
        try {
            const tid = toast.loading('Fotoğraf güncelleniyor...');
            const urls = await uploadPhotos([file]);
            if (urls.length > 0) {
                const photoURL = urls[0];
                await updateUserInfo({ photoURL });
                toast.success('Profil fotoğrafın güncellendi! ✨', { id: tid });
                runAIVerification(file);
            }
        } catch (err) {
            toast.error('Guncelleme başarısız: ' + err.message);
        } finally {
            setIsUpdatingPhoto(false);
        }
    }

    function handleRequestToken() {
        window.dispatchEvent(new CustomEvent('openFeedback', { detail: { type: 'token' } }));
    }

    if (authLoading) return <PetLoading />;
    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50 overflow-x-hidden flex flex-col relative w-full max-w-[100vw]">
            <AppHeader />
            <div className="max-w-4xl mx-auto px-4 py-8 pb-28 sm:pb-8 w-full">
                {/* Profile Header */}
                <div className="bg-white border border-slate-200/60 rounded-[2rem] p-6 sm:p-8 mb-8 shadow-[0_2px_20px_rgba(0,0,0,0.02)] relative overflow-hidden">
                    <div className="relative flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8">
                        <div
                            onClick={() => photoInputRef.current?.click()}
                            className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer shadow-inner group/avatar"
                        >
                            {userData?.photoURL ? (
                                <img src={userData.photoURL} alt="Profile" className={`w-full h-full object-cover transition-all ${isUpdatingPhoto ? 'opacity-30 blur-sm' : 'group-hover:scale-110'}`} />
                            ) : (
                                <span className="text-2xl font-black text-slate-800">{(user.displayName || 'U')[0].toUpperCase()}</span>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                </svg>
                            </div>
                            {isUpdatingPhoto && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                        <input type="file" accept="image/*" className="hidden" ref={photoInputRef} onChange={handlePhotoUpdate} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-2 mb-1">
                                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 truncate">{user.displayName || 'Kullanıcı'}</h1>
                                <UserBadge badges={userData?.badges} />
                                <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 text-[10px] font-black px-2.5 py-1 rounded-full border border-indigo-100 uppercase tracking-widest shrink-0 shadow-sm ml-1 group/token relative">
                                    <span className="text-xs">💎</span>
                                    {userData?.tokens || 0} JETON
                                    <button onClick={handleRequestToken} className="ml-1 bg-indigo-600 text-white px-2 py-0.5 rounded-md hover:bg-indigo-700 transition-colors active:scale-90">JETON İSTE</button>
                                </div>
                                <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-widest shrink-0">AKTİF</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <p className="text-slate-400 text-xs sm:text-sm font-medium truncate">{user.email}</p>
                                {userData?.photoURL && !userData?.isHumanVerified && (
                                    <button onClick={() => runAIVerification(userData.photoURL)} disabled={isUpdatingPhoto} className="w-fit flex items-center gap-1.5 bg-amber-50 text-amber-700 text-[10px] font-black px-3 py-1.5 rounded-xl border border-amber-100 uppercase tracking-widest hover:bg-amber-100 transition-all active:scale-95 disabled:opacity-50">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                        PatiAI ile Doğrula
                                    </button>
                                )}
                                {userData?.isHumanVerified && (
                                    <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                        Onaylı Profil
                                    </div>
                                )}
                            </div>
                            {userData?.phone && (
                                <p className="text-slate-500 text-xs font-bold flex items-center gap-1.5 uppercase tracking-tighter mt-1">
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
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide mb-8 p-1 bg-white border border-slate-200/60 rounded-2xl shadow-sm">
                    {tabs.map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`shrink-0 px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === tab.key ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {loading ? <PetLoading /> : (
                    <div className="min-h-[400px]">
                        {activeTab === 'ilanlarim' && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {myListings.map(l => (
                                    <ListingCard key={l.id} listing={l} isOwnListing={true} onRenew={handleRenewListing} onBoost={handleBoostListing} onDelete={(id) => { setDeletingId(id); setDeletingType('listing'); }} />
                                ))}
                                {myListings.length === 0 && (
                                    <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-slate-100">
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Henüz ilanınız bulunmuyor.</p>
                                        <Link href="/ilan-ver" className="inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">İLAN OLUŞTUR</Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'taleplerim' && (
                            <div className="space-y-4">
                                {myPosts.map(post => (
                                    <div key={post.id} className="bg-white p-5 rounded-[2rem] border border-slate-200/60 shadow-sm relative group overflow-hidden">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full border border-indigo-100 uppercase tracking-widest">{post.category || 'GENEL'}</span>
                                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{formatDate(post.createdAt)}</span>
                                            </div>
                                            <button onClick={() => { setDeletingId(post.id); setDeletingType('post'); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl">🗑️</button>
                                        </div>
                                        <h3 className="text-sm font-black text-slate-900 mb-2 leading-relaxed">{post.title}</h3>
                                        <p className="text-xs text-slate-500 font-medium leading-relaxed">{post.content}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'favorilerim' && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {favoriteListings.map(l => (
                                    <ListingCard key={l.id} listing={l} onToggleFavorite={toggleFavorite} />
                                ))}
                            </div>
                        )}

                        {activeTab === 'mesajlarim' && (
                            <div className="space-y-3">
                                {conversations.map(convo => {
                                    const lastMsg = convo.messages[0];
                                    return (
                                        <div key={convo.id} onClick={() => setActiveChat(convo.id)} className="bg-white p-4 rounded-[1.5rem] border border-slate-200/60 shadow-sm hover:border-indigo-400 cursor-pointer transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 relative ${convo.unreadCount > 0 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                    {convo.unreadCount > 0 && (
                                                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500 border-2 border-white"></span>
                                                        </span>
                                                    )}
                                                    💬
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className={`text-sm font-black mb-0.5 truncate group-hover:text-indigo-600 ${convo.unreadCount > 0 ? 'text-indigo-600' : 'text-slate-900'}`}>
                                                        {convo.otherUserName}
                                                    </div>
                                                    <p className={`text-xs truncate ${convo.unreadCount > 0 ? 'text-slate-900 font-black' : 'text-slate-500 font-medium'}`}>
                                                        {lastMsg.text || '📷 Fotoğraf'}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end gap-1.5 shrink-0 pl-2">
                                                    <span className="text-xs font-medium text-slate-400">{formatDate(lastMsg.createdAt)}</span>
                                                    <span className="text-[10px] text-indigo-500 font-medium px-2 py-0.5 bg-indigo-50 rounded-full">Mesajlaş</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {activeTab === 'arkadaslarim' && (
                            <div className="space-y-10">
                                {friendRequests.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">Pati Arkadaşlık İstekleri</h3>
                                            <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{friendRequests.length}</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {friendRequests.map(req => (
                                                <div key={req.id} className="bg-white p-4 rounded-[1.5rem] border border-orange-100 shadow-sm flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 overflow-hidden shrink-0">
                                                            {req.sender?.photoURL ? <img src={req.sender.photoURL} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">👤</div>}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-black text-slate-900 leading-none mb-1 truncate">{req.sender?.displayName || 'Anonim'}</div>
                                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Arkadaşlık İsteği</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={async () => { const { acceptFriendRequest } = await import('../../lib/listingService'); await acceptFriendRequest(req.id, req.senderId, user.uid); toast.success('Pati dostluğu kuruldu! 🐾'); fetchData(); }} className="w-9 h-9 bg-emerald-500 text-white rounded-xl flex items-center justify-center hover:bg-emerald-600 transition-colors active:scale-90">✓</button>
                                                        <button onClick={async () => { const { rejectFriendRequest } = await import('../../lib/listingService'); await rejectFriendRequest(req.id); toast.success('İstek reddedildi.'); fetchData(); }} className="w-9 h-9 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors active:scale-90">✕</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {sentFriendRequests.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">Gönderilen İstekler</h3>
                                            <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{sentFriendRequests.length}</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {sentFriendRequests.map(req => (
                                                <div key={req.id} className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                                                            {req.receiver?.photoURL ? <img src={req.receiver.photoURL} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg">👤</div>}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-black text-slate-900 leading-none mb-1 truncate">{req.receiver?.displayName || 'Anonim'}</div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="relative flex h-2 w-2">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                                                </span>
                                                                <span className="text-[10px] text-amber-600 font-bold uppercase tracking-tight">Bekliyor...</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">GÖNDERİLDİ</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none mb-4">Pati Arkadaşlarım ({friends.length})</h3>
                                    {friends.length === 0 ? (
                                        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200">
                                            <span className="text-4xl block mb-2">🤝</span>
                                            <h4 className="text-slate-800 font-bold">Henüz pati arkadaşın yok</h4>
                                            <p className="text-slate-500 text-sm mt-1">"Arkadaş Edin" sayfasından yeni insanlarla tanışabilirsin.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {friends.map(friend => (
                                                <div key={friend.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm group hover:shadow-md transition-all">
                                                    <div className="flex flex-col items-center text-center">
                                                        <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden mb-3 relative group-hover:scale-105 transition-transform duration-300">
                                                            {friend.photoURL ? <img src={friend.photoURL} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>}
                                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full"></div>
                                                        </div>
                                                        <h4 className="text-sm font-black text-slate-900 leading-tight mb-0.5">{friend.displayName || 'Anonim'}</h4>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">{friend.city || 'Belirtilmemiş'}</p>
                                                        <div className="w-full flex gap-2">
                                                            <Link href={`/profil/${friend.id}`} className="flex-1 py-2 bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-colors">Profili Gör</Link>
                                                            <button
                                                                onClick={() => {
                                                                    const convoId = `direct_${friend.id}`;
                                                                    const existing = conversations.find(c => c.id === convoId);
                                                                    if (existing) {
                                                                        setActiveChat(convoId);
                                                                    } else {
                                                                        handleSendMessage('direct', friend.id, 'Merhaba! 👋', null, friend.displayName, friend.photoURL);
                                                                        toast.success('Mesaj kutusu açılıyor...');
                                                                    }
                                                                    setActiveTab('mesajlarim');
                                                                }}
                                                                className="py-2 px-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                                                            >
                                                                💬
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <ChatModal isOpen={!!activeChat} onClose={() => setActiveChat(null)} conversation={activeChat ? conversations.find(c => c.id === activeChat) : null} currentUser={user} onSend={handleSendMessage} />

            {deletingId && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 mb-2">{deletingType === 'listing' ? 'İlanı Sil' : 'Paylaşımı Sil'}</h3>
                        <p className="text-gray-500 text-sm mb-6">Bu {deletingType === 'listing' ? 'ilanı' : 'paylaşımı'} kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeletingId(null)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors">İptal</button>
                            <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors">Evet, Sil</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
