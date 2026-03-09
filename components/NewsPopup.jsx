'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/AuthContext';

// ---------------------------------------------------------------
// Dinamik Haber / Duyuru Listesi
// Yeni bir haber eklemek için buraya yeni bir obje (farklı 'id'
// ile) eklemeniz yeterlidir. Kullanıcı "Bir daha gösterme"
// dediğinde o haber localStorage'a yazılır ve bir daha açılmaz.
// ---------------------------------------------------------------
const NEWS_LIST = [
    {
        id: 'ilk_mama_hediyesi_mart2026',
        type: 'sahiplendirme', // 'sahiplendirme' | 'general'
        badge: '🐾 Sahiplenicilere Özel',
        badgeColor: 'bg-orange-100 text-orange-600 border-orange-200',
        title: 'İlk Mama Hediyesi Bizden! 🎁',
        desc: 'Platformumuzdan sahiplenme yapan tüm ailelere, sevimli arkadaşınızın yeni hayatına güzel bir başlangıç olsun diye ilk mama hediyesini biz veriyoruz! Sahiplenme ilanına tıklayın, haber konuşun ve hediyenizi talep edin.',
        emoji: '🐶',
        image: null, // Emoji kullanılacağı için null
        ctaText: 'İlanları İncele',
        ctaHref: '/',
        ctaColor: 'bg-orange-500 hover:bg-orange-400 shadow-orange-500/30',
        accentColor: 'from-orange-50 to-amber-50',
        decorEmoji: ['🐾', '🎀', '🐱', '🦴'],
    },
    {
        id: 'protein_cekilisi_mart12',
        type: 'general',
        badge: 'Topluluk Duyurusu',
        badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        title: 'Açılışa Özel Dev Çekiliş!',
        desc: 'Açılışımıza özel, üye olan kullanıcılarımız arasından 5 şanslı kişiye Whey Protein Tozu (1000 gr) hediye ediyoruz! Çekiliş sonucu 12 Mart\'ta canlı yayında açıklanacaktır.',
        emoji: '🏆',
        image: 'https://supplementler2.sm.mncdn.com/Assets/Supplementler/Thumbs/supplementlercom_whey_protein_1000_gr_90889.jpeg',
        ctaText: 'Harika, Anladım!',
        ctaHref: null,
        ctaColor: 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20',
        accentColor: 'from-slate-50 to-indigo-50',
        decorEmoji: [],
    },
];

export default function NewsPopup() {
    const { user } = useAuth();
    const [currentNews, setCurrentNews] = useState(null);
    const [dontShowAgain, setDontShowAgain] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Client (Tarayıcı) tarafında çalışır.
        // Dismiss edilmemiş ilk haberi bulur (listede en üstteki öncelikli).
        const activeNews = NEWS_LIST.find(news => {
            const dismissed = localStorage.getItem(`news_dismissed_${news.id}`);
            return !dismissed;
        });

        if (activeNews) {
            setCurrentNews(activeNews);
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        if (dontShowAgain && currentNews) {
            localStorage.setItem(`news_dismissed_${currentNews.id}`, 'true');
        }
        setIsVisible(false);
        setTimeout(() => setCurrentNews(null), 500);
    };

    if (!currentNews) return null;

    const isSahiplendirme = currentNews.type === 'sahiplendirme';

    return (
        <div className="relative z-[9999]">
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={handleClose}
            />

            {/* Popup */}
            <div
                className={`fixed top-1/2 left-1/2 -translate-x-1/2 w-[92%] max-w-sm rounded-3xl shadow-[0_24px_80px_-10px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col transition-all duration-500 bg-white ${isVisible ? 'opacity-100 scale-100 -translate-y-1/2' : 'opacity-0 scale-90 -translate-y-[45%] pointer-events-none'}`}
            >
                {/* Kapat Butonu */}
                <button
                    onClick={handleClose}
                    aria-label="Kapat"
                    className="absolute top-3.5 right-3.5 w-8 h-8 bg-black/10 hover:bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center transition-all z-20 text-slate-700 active:scale-90"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* ---- SAHİPLENDİRME tipi header ---- */}
                {isSahiplendirme ? (
                    <div className={`relative w-full pt-10 pb-6 px-6 bg-gradient-to-br ${currentNews.accentColor} overflow-hidden`}>
                        {/* Dekor emojiler - arka plan */}
                        {currentNews.decorEmoji.map((em, i) => (
                            <span
                                key={i}
                                className="absolute select-none pointer-events-none opacity-20 text-4xl"
                                style={{
                                    top: `${[10, 60, 20, 70][i]}%`,
                                    left: `${[5, 80, 45, 20][i]}%`,
                                    transform: `rotate(${[-15, 20, -8, 25][i]}deg)`,
                                    fontSize: `${[36, 28, 40, 24][i]}px`,
                                }}
                            >
                                {em}
                            </span>
                        ))}

                        {/* Ana emoji - büyük & animasyonlu */}
                        <div className="relative z-10 text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-white shadow-lg shadow-orange-200/60 mb-3 text-5xl animate-bounce"
                                style={{ animationDuration: '2.5s' }}>
                                {currentNews.emoji}
                            </div>
                            <div className="flex justify-center gap-1 mt-1">
                                {[...Array(5)].map((_, i) => (
                                    <span key={i} className="text-orange-400 text-xs">✦</span>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ---- GENEL tip header: resimli ---- */
                    <div className={`relative w-full pt-10 pb-4 bg-gradient-to-br ${currentNews.accentColor} border-b border-slate-100`}>
                        {currentNews.image && (
                            <img
                                src={currentNews.image}
                                alt="Haber Görseli"
                                className="w-full h-40 object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500"
                            />
                        )}
                        {!currentNews.image && (
                            <div className="flex justify-center py-4 text-6xl">
                                {currentNews.emoji}
                            </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white/80 to-transparent pointer-events-none" />
                    </div>
                )}

                {/* İçerik alanı */}
                <div className="p-6 text-center">
                    {/* Badge */}
                    <div className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider mb-3 shadow-sm border ${currentNews.badgeColor}`}>
                        {currentNews.badge}
                    </div>

                    {/* Başlık */}
                    <h2 className="text-xl font-extrabold text-slate-900 mb-2.5 leading-tight tracking-tight">
                        {currentNews.title}
                    </h2>

                    {/* Açıklama */}
                    <p className="text-slate-500 text-[13px] mb-6 leading-relaxed font-medium">
                        {currentNews.desc}
                    </p>

                    {/* CTA Buton(lar) */}
                    {currentNews.ctaHref ? (
                        <div className="flex flex-col gap-2 mb-4">
                            <Link
                                href={currentNews.ctaHref}
                                onClick={handleClose}
                                className={`w-full ${currentNews.ctaColor} text-white font-bold py-3.5 rounded-xl text-[14px] shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2`}
                            >
                                {currentNews.ctaText}
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                            <button
                                onClick={handleClose}
                                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold py-3 rounded-xl text-[13px] transition-all active:scale-95"
                            >
                                Belki Sonra
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleClose}
                            className={`w-full ${currentNews.ctaColor} text-white font-bold py-3.5 rounded-xl text-[14px] shadow-lg transition-all active:scale-95 mb-4`}
                        >
                            {currentNews.ctaText}
                        </button>
                    )}

                    {/* "Bir daha gösterme" checkbox */}
                    <div className="flex justify-center w-full">
                        <label className="inline-flex items-center gap-2.5 cursor-pointer group select-none">
                            <div className="relative flex items-center justify-center">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400 bg-slate-50 cursor-pointer peer transition-all appearance-none checked:bg-orange-500 checked:border-orange-500"
                                    checked={dontShowAgain}
                                    onChange={(e) => setDontShowAgain(e.target.checked)}
                                />
                                <svg className="w-3 h-3 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-600 transition-colors tracking-wide pt-0.5">
                                Bu duyuruyu bir daha gösterme
                            </span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}
