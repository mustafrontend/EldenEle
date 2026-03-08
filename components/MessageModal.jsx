'use client';

import { useState } from 'react';
import { sendMessage } from '../lib/listingService';

export default function MessageModal({ listing, onClose }) {
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    async function send() {
        if (!text.trim()) return;
        setSending(true);
        try {
            await sendMessage({
                listingId: listing.id,
                receiverId: listing.userId,
                text: text.trim(),
            });
            setSent(true);
            setText('');
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-md p-6 z-10 animate-modal">
                {/* Close */}
                <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-gray-100 transition-colors">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 3H3a2 2 0 00-2 2v14l4-4h14a2 2 0 002-2V5a2 2 0 00-2-2z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">Mesaj Gönder</h3>
                        <p className="text-xs text-gray-500 line-clamp-1">{listing.title}</p>
                    </div>
                </div>

                {!sent ? (
                    <>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Mesajınızı detaylı şekilde yazın..."
                            rows="4"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 resize-none transition-all"
                        />
                        <button
                            onClick={send}
                            disabled={sending || !text.trim()}
                            className="mt-4 w-full py-2.5 rounded-lg bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {sending ? 'Gönderiliyor...' : 'Mesajı Gönder'}
                        </button>
                    </>
                ) : (
                    <div className="text-center py-6">
                        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h4 className="font-bold text-gray-800 mb-1">Başarıyla İletildi</h4>
                        <p className="text-sm text-gray-500">İlan sahibi tarafınıza dönüş yapacaktır.</p>
                        <button onClick={onClose} className="mt-5 w-full py-2 rounded-lg border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors">
                            Kapat
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
