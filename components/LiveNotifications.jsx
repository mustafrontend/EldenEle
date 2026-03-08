'use client';

import { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

const NAMES = [
    "Ahmet Y.", "Ayşe K.", "Mehmet D.", "Fatma Ç.", "Mustafa Ş.", "Zeynep Y.",
    "Ali Y.", "Emine Ö.", "Hüseyin A.", "Hatice Ö.", "Caner T.", "Selin G.",
    "Furkan B.", "Deniz M.", "Merve C."
];

const ACTIONS = [
    // --- SAHİPLENDİRME VE YUVA ---
    { text: "platforma az önce katıldı.", icon: "👋", color: "text-emerald-600 bg-emerald-100/50 border-emerald-200" },
    { text: "bir can dosta ömürlük yuva oldu.", icon: "�", color: "text-orange-600 bg-orange-100/50 border-orange-200" },
    { text: "yeni bir yuva ilanı başarıyla yayınladı.", icon: "🏠", color: "text-blue-600 bg-blue-100/50 border-blue-200" },
    { text: "başarılı bir sahiplendirme sonrası 5 yıldız aldı.", icon: "⭐", color: "text-yellow-600 bg-yellow-100/50 border-yellow-200" },

    // --- MAMA VE TAKAS ---
    { text: "yeni bir mama takas ilanı yayınladı.", icon: "🦴", color: "text-indigo-600 bg-indigo-100/50 border-indigo-200" },
    { text: "bir paket mamayı bedelsiz devretti.", icon: "🎁", color: "text-rose-600 bg-rose-100/50 border-rose-200" },
    { text: "az önce bir aksesuar takası tamamladı.", icon: "🤝", color: "text-teal-600 bg-teal-100/50 border-teal-200" },
    { text: "ihtiyacı olan bir barınağa mama hediye etti.", icon: "�", color: "text-violet-600 bg-violet-100/50 border-violet-200" },
    { text: "fazla kedi kumunu bisküvi ile takasladı.", icon: "🐱", color: "text-orange-600 bg-orange-100/50 border-orange-200" },
    { text: "bir taşıma kafesini ödünç verdi.", icon: "📦", color: "text-pink-600 bg-pink-100/50 border-pink-200" },

    // --- DESTEK VE DOĞA ---
    { text: "sokak kedileri için bir yuva yaptı.", icon: "🐈", color: "text-red-500 bg-red-100/50 border-red-200" },
    { text: "bahçesindeki kedilerle ilgili bir post paylaştı.", icon: "�", color: "text-green-600 bg-green-100/50 border-green-200" },
    { text: "kullanmadığı akvaryumu birine hediye etti.", icon: "🐠", color: "text-sky-500 bg-sky-100/50 border-sky-200" },
    { text: "bir köpeği geçici yuvada ağırlamaya başladı.", icon: "🐕", color: "text-blue-700 bg-blue-100/50 border-blue-200" },

    // --- YETENEK VE YARDIM ---
    { text: "köpek eğitimi karşılığında mama takasladı.", icon: "🦴", color: "text-purple-600 bg-purple-100/50 border-purple-200" },
    { text: "komşusunun kedisine 1 günlüğüne baktı.", icon: "�", color: "text-gray-700 bg-gray-100/50 border-gray-200" },
    { text: "kayıp bir kedi için toplulukta ilan açtı.", icon: "�", color: "text-blue-800 bg-blue-100/50 border-blue-200" },
    { text: "Veteriner tavsiyesi için birini buldu.", icon: "🩺", color: "text-indigo-500 bg-indigo-100/50 border-indigo-200" },

    // --- AKSESUAR VE EŞYA ---
    { text: "bebek kedi biberonunu birine verdi.", icon: "🍼", color: "text-pink-500 bg-pink-100/50 border-pink-200" },
    { text: "küçülen tasmaları başka tasmalarla takasladı.", icon: "�", color: "text-blue-400 bg-blue-100/50 border-blue-200" },
    { text: "oyuncak setini bir kuş yemiyle takas etti.", icon: "🦜", color: "text-amber-800 bg-amber-100/50 border-amber-200" },

    // --- ÖĞRENCİ VE PATİ ---
    { text: "sınav haftasında köpeğini gezdirecek birini buldu.", icon: "🦮", color: "text-yellow-600 bg-yellow-100/50 border-yellow-200" },
    { text: "yurt odasındaki balığı için yem paylaştı.", icon: "🐟", color: "text-neutral-600 bg-neutral-100/50 border-neutral-200" },
    { text: "kullanmadığı tarak setini birine hediye etti.", icon: "🚿", color: "text-blue-300 bg-blue-50 border-blue-100" }
];

export default function LiveNotifications() {
    const [notification, setNotification] = useState(null);
    const [visible, setVisible] = useState(false);
    const hideTimeout = useRef(null);
    const randomTimeout = useRef(null);

    useEffect(() => {
        const triggerNotification = (notifData) => {
            setNotification(notifData);
            setVisible(true);
            if (hideTimeout.current) clearTimeout(hideTimeout.current);
            hideTimeout.current = setTimeout(() => {
                setVisible(false);
            }, 4000);
        };

        const showRandomNotification = () => {
            const randomName = NAMES[Math.floor(Math.random() * NAMES.length)];
            const randomAction = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];

            triggerNotification({ name: randomName, ...randomAction });

            // Schedule next one (randomly between 15 to 45 seconds)
            const nextDelay = Math.floor(Math.random() * 30000) + 15000;
            randomTimeout.current = setTimeout(showRandomNotification, nextDelay);
        };

        // Start first notification after 5 seconds
        randomTimeout.current = setTimeout(showRandomNotification, 5000);

        // --- FIREBASE GERÇEK ZAMANLI DİNLEYİCİLER ---
        let isInitialUsers = true;
        let isInitialListings = true;
        let isInitialPosts = true;

        const uQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(1));
        const unsubUsers = onSnapshot(uQuery, (snap) => {
            if (isInitialUsers) { isInitialUsers = false; return; }
            snap.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    triggerNotification({
                        name: data.displayName || 'Yeni Üye',
                        text: "platforma az önce katıldı.",
                        icon: "👋",
                        color: "text-emerald-600 bg-emerald-100/50 border-emerald-200"
                    });
                }
            });
        });

        const lQuery = query(collection(db, 'listings'), orderBy('createdAt', 'desc'), limit(1));
        const unsubListings = onSnapshot(lQuery, (snap) => {
            if (isInitialListings) { isInitialListings = false; return; }
            snap.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    triggerNotification({
                        name: data.userName || 'Biri',
                        text: "yeni bir ilan yayınladı.",
                        icon: "🚀",
                        color: "text-blue-600 bg-blue-100/50 border-blue-200"
                    });
                }
            });
        });

        const pQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(1));
        const unsubPosts = onSnapshot(pQuery, (snap) => {
            if (isInitialPosts) { isInitialPosts = false; return; }
            snap.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    triggerNotification({
                        name: data.userName || 'Biri',
                        text: "toplulukta bir gönderi paylaştı.",
                        icon: "💬",
                        color: "text-amber-600 bg-amber-100/50 border-amber-200"
                    });
                }
            });
        });

        return () => {
            if (randomTimeout.current) clearTimeout(randomTimeout.current);
            if (hideTimeout.current) clearTimeout(hideTimeout.current);
            unsubUsers();
            unsubListings();
            unsubPosts();
        };
    }, []);

    if (!notification) return null;

    return (
        <div
            className={`fixed bottom-24 sm:bottom-6 left-4 z-[110] transition-all duration-500 max-w-[280px] sm:max-w-xs ${visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'
                }`}
        >
            <div className={`flex items-center gap-3 p-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border backdrop-blur-xl ${notification.color}`}>
                <div className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center shrink-0 shadow-sm border border-white/40 text-sm">
                    {notification.icon}
                </div>
                <div className="flex flex-col">
                    <span className="text-[12px] font-extrabold tracking-tight opacity-90">
                        {notification.name}
                    </span>
                    <span className="text-[11px] font-medium leading-tight opacity-80">
                        {notification.text}
                    </span>
                </div>
            </div>
        </div>
    );
}
