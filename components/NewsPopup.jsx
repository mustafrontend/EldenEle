'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/AuthContext';

// Dinamik haber listesi. Yeni bir haber eklemek istediğinizde 
// buraya yeni bir obje (farklı bir 'id' ile) eklemeniz yeterlidir.
const NEWS_LIST = [
    {
        id: 'protein_cekilisi_mart12',
        title: 'Açılışa Özel Dev Çekiliş!',
        desc: 'Açılışımıza özel, üye olan kullanıcılarımız arasından 5 şanslı kişiye Supplementler Whey Protein Tozu (1000 gr) hediye ediyoruz! Çekiliş sonucu 12 Mart tarihinde canlı yayında açıklanacaktır.',
        image: 'https://supplementler2.sm.mncdn.com/Assets/Supplementler/Thumbs/supplementlercom_whey_protein_1000_gr_90889.jpeg',
    }
];

export default function NewsPopup() {
    const { user } = useAuth();
    const [currentNews, setCurrentNews] = useState(null);
    const [dontShowAgain, setDontShowAgain] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Bu effect sadece Client (Tarayıcı) tarafında çalışır.
        // Dismiss edilmemiş (gizlenmemiş) ilk haberi bulur.
        const activeNews = NEWS_LIST.find(news => {
            const dismissed = localStorage.getItem(`news_dismissed_${news.id}`);
            return !dismissed; // Eğer lokalde gizlendi bilgisi yoksa bunu seç
        });

        if (activeNews) {
            setCurrentNews(activeNews);
            // Ekrana girerken aniden belirmesin, tatlı bir gecikmeyle (1.5 sn) gelsin
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        // Kullanıcı bir daha gösterme seçeneğini işaretlediyse tarayıcı hafızasına kaydet
        if (dontShowAgain && currentNews) {
            localStorage.setItem(`news_dismissed_${currentNews.id}`, 'true');
        }
        setIsVisible(false);

        // Animasyon bittikten sonra componenti boşa çıkar
        setTimeout(() => setCurrentNews(null), 500);
    };

    // Eğer gösterilecek haber yoksa ya da popup kapatıldıysa render etme
    if (!currentNews) return null;

    return (
        <div className="relative z-[9999]">
            {/* Arka plan Karartması (Backdrop) */}
            <div
                className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={handleClose}
            ></div>

            {/* Popup Gövdesi */}
            <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-500 flex flex-col ${isVisible ? 'opacity-100 scale-100 translate-y-[-50%]' : 'opacity-0 scale-95 translate-y-[-45%] pointer-events-none'}`}>

                {/* Kapat Butonu */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 w-8 h-8 bg-slate-900/10 hover:bg-slate-900/20 backdrop-blur-md rounded-full flex items-center justify-center transition-colors z-10 text-slate-800"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Üst Görsel Alanı */}
                <div className="relative w-full pt-10 pb-4 bg-slate-50 border-b border-slate-100">
                    <img
                        src={currentNews.image}
                        alt="Haber Görseli"
                        className="w-full h-40 object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                </div>

                {/* Alt İçerik Alanı */}
                <div className="p-6 text-center">
                    <div className="inline-block bg-indigo-100 text-indigo-700 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider mb-3 shadow-sm border border-indigo-200">
                        Topluluk Duyurusu
                    </div>

                    <h2 className="text-xl font-extrabold text-slate-800 mb-3 leading-tight tracking-tight">
                        {currentNews.title}
                    </h2>

                    <p className="text-slate-500 text-[13px] mb-6 leading-relaxed font-medium">
                        {currentNews.desc}
                    </p>

                    {user ? (
                        <button
                            onClick={handleClose}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl text-[14px] shadow-lg shadow-slate-900/20 transition-all active:scale-95 mb-4"
                        >
                            Harika, Anladım!
                        </button>
                    ) : (
                        <div className="flex flex-col gap-2 mb-4">
                            <Link
                                href="/auth"
                                onClick={handleClose}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl text-[14px] shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center"
                            >
                                Hemen Üye Ol
                            </Link>
                            <button
                                onClick={handleClose}
                                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl text-[13px] transition-all active:scale-95"
                            >
                                Belki Sonra
                            </button>
                        </div>
                    )}

                    <div className="flex justify-center w-full mt-1">
                        <label className="inline-flex items-center gap-2.5 cursor-pointer group select-none">
                            <div className="relative flex items-center justify-center">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 bg-slate-50 cursor-pointer peer transition-all appearance-none checked:bg-indigo-600 checked:border-indigo-600"
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
