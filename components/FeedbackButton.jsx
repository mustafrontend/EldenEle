'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { submitFeedback } from '../lib/feedbackService';

export default function FeedbackButton() {
    const { user, userData } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [type, setType] = useState('suggestion'); // suggestion, bug, comment
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isPeeking, setIsPeeking] = useState(false);

    // Her 25 saniyede bir, "Bana tıkla" dercesine 4 saniyeliğine butonu genişlet
    useEffect(() => {
        const interval = setInterval(() => {
            setIsPeeking(true);
            setTimeout(() => {
                setIsPeeking(false);
            }, 4000);
        }, 25000);

        return () => clearInterval(interval);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;
        setIsSubmitting(true);

        try {
            await submitFeedback({
                type,
                message: message.trim(),
                userId: user?.uid || null,
                userName: userData?.displayName || user?.displayName || 'Anonim',
                userEmail: user?.email || 'Bilinmiyor'
            });
            setIsSuccess(true);
            setTimeout(() => {
                setIsOpen(false);
                setIsSuccess(false);
                setMessage('');
            }, 2500);
        } catch (error) {
            console.error("Geri bildirim gönderilemedi:", error);
            alert("Bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Yüzen Buton */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-[110px] sm:bottom-6 right-4 sm:right-6 z-40 bg-slate-900 text-white p-3.5 sm:p-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-slate-800 hover:scale-105 hover:-translate-y-1 transition-all duration-300 group flex items-center gap-2 overflow-hidden"
                style={{ WebkitTapHighlightColor: 'transparent' }}
            >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                {/* Hover sırasında veya "isPeeking" tetiklendiğinde yazıyı aç */}
                <span className={`overflow-hidden font-bold text-[13px] sm:text-sm tracking-wide transition-all duration-700 whitespace-nowrap ${isPeeking ? 'max-w-xs ml-1' : 'max-w-0 group-hover:max-w-xs group-hover:ml-1'}`}>
                    Öneri & Görüş
                </span>
            </button>

            {/* Modal Kaplama (Overlay) */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                        onClick={() => !isSubmitting && setIsOpen(false)}
                    ></div>

                    {/* Modal İçeriği */}
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md relative z-10 overflow-hidden fade-in-up border border-slate-100">
                        <div className="bg-slate-50 border-b border-slate-100 p-5 flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                <span className="text-2xl">💡</span> Fikirlerinle Büyüyoruz
                            </h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                disabled={isSubmitting}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6">
                            {isSuccess ? (
                                <div className="py-8 text-center fade-in">
                                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border-[6px] border-white shadow-sm ring-1 ring-emerald-100">
                                        <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-xl mb-1">Çok Teşekkürler!</h3>
                                    <p className="text-slate-500 text-sm">Görüşünüz ekibimize iletildi.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Geri Bildirim Türü</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['suggestion', 'bug', 'comment'].map((t) => (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => setType(t)}
                                                    className={`py-2 px-1 text-[11px] sm:text-xs font-bold rounded-xl border transition-all ${type === t
                                                        ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                                        }`}
                                                >
                                                    {t === 'suggestion' ? '💡 Öneri' : t === 'bug' ? '🐛 Hata' : '💬 Diğer'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Mesajınız</label>
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="Sanki bir arkadaşına anlatıyormuş gibi rahatça yaz..."
                                            rows="4"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-all"
                                            required
                                        ></textarea>
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || !message.trim()}
                                            className="w-full bg-indigo-600 text-white font-bold text-sm py-3.5 rounded-xl hover:bg-indigo-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? (
                                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                            ) : (
                                                <>
                                                    Gönder
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                    </svg>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
