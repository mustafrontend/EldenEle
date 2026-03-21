'use client';

import { useState, useEffect } from 'react';
import { subscribeStories, createStory } from '../lib/storyService';
import { useAuth } from '../lib/AuthContext';
import { toast } from 'react-hot-toast';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import UserBadge from './UserBadge';

export default function StoryBar() {
    const { user, userData } = useAuth();
    const router = useRouter();
    const [stories, setStories] = useState([]);
    const [selectedStory, setSelectedStory] = useState(null);
    const [viewMode, setViewMode] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const unsub = subscribeStories((data) => {
            // Group stories by userId using a Map for absolute uniqueness
            const storyMap = new Map();

            data.forEach((story) => {
                const uid = story.userId;
                if (!uid) return;

                if (storyMap.has(uid)) {
                    storyMap.get(uid).items.push(story);
                    // Optional: Always use the most recent story's name/photo for the group
                } else {
                    storyMap.set(uid, {
                        userId: uid,
                        userName: story.userName || 'Kullanıcı',
                        userPhoto: story.userPhoto,
                        userBadges: story.userBadges,
                        items: [story]
                    });
                }
            });

            const grouped = Array.from(storyMap.values());

            // Sort stories within each group by date (Oldest to Newest for the slide effect)
            grouped.forEach(g => {
                // Ensure we have a photo if ANY of the user's stories has one
                if (!g.userPhoto) {
                    const withPhoto = g.items.find(i => i.userPhoto && i.userPhoto.length > 0);
                    if (withPhoto) g.userPhoto = withPhoto.userPhoto;
                }

                g.items.sort((a, b) => {
                    const timeA = a.createdAt?.seconds || 0;
                    const timeB = b.createdAt?.seconds || 0;
                    return timeA - timeB;
                });
            });

            setStories(grouped);
        });
        return () => unsub();
    }, []);

    // Sync MyGroup with current userData for immediate UI updates
    const rawMyGroup = stories.find(g => g.userId === user?.uid);
    const myGroup = rawMyGroup ? {
        ...rawMyGroup,
        userName: userData?.displayName || user?.displayName || rawMyGroup.userName,
        userPhoto: userData?.photoURL || user?.photoURL || rawMyGroup.userPhoto,
        userBadges: userData?.badges || rawMyGroup.userBadges
    } : null;

    const otherStories = stories.filter(g => g.userId !== user?.uid);

    const openStory = (group) => {
        if (!user) {
            toast('Hikayeleri görmek için giriş yapmalısınız.', { icon: '🐾', duration: 2000, style: { background: '#333', color: '#fff' } });
            router.push('/giris');
            return;
        }
        setSelectedStory(group);
        setViewMode(true);
    };

    const closeStory = () => {
        setViewMode(false);
        setSelectedStory(null);
    };

    async function handleUpload(e) {
        const file = e.target.files[0];
        if (!file || !user) return;

        try {
            setIsUploading(true);
            const tid = toast.loading('Hikaye yükleniyor...');
            await createStory(file, {
                userName: userData?.displayName || user?.displayName || 'Anonim',
                userPhoto: userData?.photoURL || user?.photoURL || null,
                userBadges: userData?.badges || []
            });
            toast.success('Hikayen paylaşıldı! 🐾', { id: tid });
        } catch (err) {
            toast.error('Yükleme başarısız: ' + err.message);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    return (
        <div className="w-full mb-6">
            <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide py-2 px-1">
                {/* Your Add/View Story */}
                <div className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 transition-all group">
                    <div className="relative">
                        <div
                            onClick={() => myGroup ? openStory(myGroup) : fileInputRef.current?.click()}
                            className={`w-16 h-16 rounded-full p-1 bg-white shadow-sm flex items-center justify-center overflow-hidden transition-all border-2 ${myGroup ? 'border-orange-500' : 'border-slate-100 group-hover:border-indigo-200'} ${isUploading ? 'animate-pulse' : ''}`}
                        >
                            {(userData?.photoURL || user?.photoURL) ? (
                                <img src={userData?.photoURL || user?.photoURL} alt="Me" className={`w-full h-full object-cover rounded-full transition-all ${isUploading ? 'opacity-30' : ''}`} />
                            ) : (
                                <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300">
                                    <span className="font-bold">Siz</span>
                                </div>
                            )}
                        </div>
                        <div
                            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                            className="absolute bottom-0 right-0 w-5 h-5 bg-indigo-600 rounded-full border-2 border-white flex items-center justify-center shadow-sm z-10"
                        >
                            <span className="text-white text-xs font-bold">{isUploading ? '...' : '+'}</span>
                        </div>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter transition-colors group-hover:text-indigo-600">HİKAYEN</span>
                </div>

                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleUpload}
                />

                {/* Others Stories */}
                {otherStories.map((group) => (
                    <button
                        key={group.userId}
                        onClick={() => openStory(group)}
                        className="flex flex-col items-center gap-1.5 shrink-0 active:scale-90 transition-transform"
                    >
                        <div className="w-16 h-16 rounded-full p-[3px] bg-gradient-to-tr from-orange-500 via-rose-500 to-purple-600 shadow-md">
                            <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-slate-100">
                                {group.userPhoto ? (
                                    <img src={group.userPhoto} alt={group.userName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-indigo-600 font-bold text-lg">
                                        {(group.userName || 'U')[0].toUpperCase()}
                                    </div>
                                )}
                            </div>
                        </div>
                        <span className="text-[9px] font-black text-slate-700 uppercase tracking-tighter max-w-[72px] truncate text-center px-0.5">
                            {group.userName}
                        </span>
                    </button>
                ))}
            </div>

            {/* Story Viewer Modal */}
            {viewMode && selectedStory && (
                <StoryViewer
                    group={selectedStory}
                    onClose={closeStory}
                    currentUserData={selectedStory.userId === user?.uid ? (userData?.photoURL || user?.photoURL) : null}
                    userBadges={selectedStory.userId === user?.uid ? userData?.badges : selectedStory.userBadges}
                />
            )}
        </div>
    );
}

function StoryViewer({ group, onClose, currentUserData, userBadges }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const duration = 5000; // 5 seconds per story

    useEffect(() => {
        setProgress(0);
        const startTime = Date.now();

        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const newProgress = Math.min((elapsed / duration) * 100, 100);
            setProgress(newProgress);

            if (newProgress >= 100) {
                if (currentIndex < group.items.length - 1) {
                    setCurrentIndex(prev => prev + 1);
                } else {
                    onClose();
                }
                clearInterval(interval);
            }
        }, 50);

        return () => clearInterval(interval);
    }, [currentIndex, group.items.length, onClose]);

    const handleNext = () => {
        if (currentIndex < group.items.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const item = group.items[currentIndex];

    return (
        <div className="fixed inset-0 z-[99999] bg-black flex items-center justify-center animate-in fade-in duration-300">
            <div className="relative w-full h-full max-w-md bg-slate-900 overflow-hidden md:rounded-3xl shadow-2xl flex flex-col">
                {/* Progress Bars */}
                <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-20">
                    {group.items.map((_, idx) => (
                        <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white transition-all duration-50"
                                style={{
                                    width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%'
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Top Info */}
                <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-20">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full border border-white/30 overflow-hidden bg-white/10 flex items-center justify-center shadow-lg">
                            {(currentUserData || group.userPhoto) ? (
                                <img src={currentUserData || group.userPhoto} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-white font-bold">{(group.userName || 'U')[0].toUpperCase()}</span>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white font-black text-sm drop-shadow-md leading-none">{group.userName}</span>
                            {userBadges && userBadges.length > 0 && (
                                <div className="scale-75 origin-left mt-1">
                                    <UserBadge badges={[userBadges[0]]} />
                                </div>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white p-2 bg-black/20 rounded-full backdrop-blur-md">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Navigation Areas */}
                <div className="absolute inset-0 z-10 flex">
                    <div className="flex-1 cursor-pointer" onClick={handlePrev} />
                    <div className="flex-1 cursor-pointer" onClick={handleNext} />
                </div>

                {/* Story Content */}
                <div className="flex-1 w-full bg-black flex items-center justify-center">
                    <img
                        key={item.id}
                        src={item.imageUrl}
                        className="max-w-full max-h-full object-contain w-full animate-in fade-in zoom-in-95 duration-300"
                        alt="Story"
                    />
                </div>

                {/* Bottom Interaction */}
                <div className="p-6 pb-8 bg-gradient-to-t from-black/80 to-transparent flex items-center gap-3 z-20">
                    <input
                        type="text"
                        placeholder="Mesaj gönder..."
                        className="flex-1 bg-white/10 border border-white/20 rounded-full py-3.5 px-6 text-white text-sm outline-none focus:bg-white/20 transition-all font-medium backdrop-blur-sm"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button className="text-white active:scale-90 transition-transform">
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
