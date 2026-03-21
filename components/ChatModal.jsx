import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { markMessageAsRead } from '../lib/listingService';

export default function ChatModal({ isOpen, onClose, conversation, currentUser, onSend }) {
    const [text, setText] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const imageInputRef = useRef(null);

    // AI Scam Detection - Rules of Hooks: Always call before early returns
    const hasScamRisk = useMemo(() => {
        if (!conversation?.messages) return false;
        const riskyWords = ['kaparo', 'iban', 'eft', 'havale', 'para', 'odeme', 'ödeme', 'hesaba', 'guvence', 'güvence', 'guvenli', 'güvenli'];
        return conversation.messages.some(m =>
            riskyWords.some(word => (m.text || '').toLowerCase().includes(word))
        );
    }, [conversation?.messages]);

    // Scroll to bottom logic
    const scrollToBottom = (behavior = 'smooth') => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior });
        }
    };

    useEffect(() => {
        if (isOpen && conversation?.messages) {
            const timeout = setTimeout(() => scrollToBottom('auto'), 50);
            return () => clearTimeout(timeout);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && conversation?.messages) {
            scrollToBottom('smooth');
        }
    }, [conversation?.messages?.length]);

    // Mark unread messages as read
    useEffect(() => {
        if (isOpen && conversation && currentUser) {
            const unreadIncoming = conversation.messages.filter(m => m.receiverId === currentUser.uid && !m.read);
            unreadIncoming.forEach(m => {
                markMessageAsRead(m.id).catch(err => console.error("Error marking msg read", err));
            });
        }
    }, [isOpen, conversation, currentUser]);

    if (!isOpen || !conversation) return null;

    function formatTime(ts) {
        if (!ts?.seconds) return '';
        return new Date(ts.seconds * 1000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!text.trim() && !selectedImage) return;

        setIsSending(true);
        const currentText = text;
        const currentImg = selectedImage;

        setText('');
        setSelectedImage(null);

        try {
            await onSend(
                conversation.listingId,
                conversation.otherUserId,
                currentText,
                currentImg,
                conversation.otherUserName,
                conversation.otherUserPhoto
            );
        } catch (err) {
            console.error(err);
        } finally {
            setIsSending(false);
        }
    }

    const handleImageSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
        }
    };

    // Sort messages strictly by time
    const sortedMessages = [...conversation.messages].sort((a, b) =>
        (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
    );

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col bg-white sm:bg-black/60 sm:backdrop-blur-md sm:items-center sm:justify-center animate-in fade-in duration-300">
            {/* Main Chat Container - Force padding at the bottom to stay above navigation bar */}
            <div className="flex flex-col flex-1 w-full sm:max-w-xl sm:h-[750px] sm:max-h-[90vh] sm:rounded-[2.5rem] bg-slate-50 overflow-hidden sm:shadow-2xl pb-28">

                {/* Header */}
                <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors active:scale-90">
                            <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 shadow-sm overflow-hidden text-sm">
                                {conversation.otherUserPhoto ? (
                                    <img src={conversation.otherUserPhoto} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    (conversation.otherUserName || 'K')[0].toUpperCase()
                                )}
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-black text-slate-900 leading-none truncate text-sm sm:text-base">
                                    {conversation.otherUserName}
                                </h3>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Aktif</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="hidden sm:block p-2 hover:bg-slate-100 rounded-full text-slate-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Messages Area */}
                <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-hide bg-slate-50">
                    {hasScamRisk && (
                        <div className="bg-rose-50/80 backdrop-blur border border-rose-100 p-4 rounded-3xl shadow-sm mb-6">
                            <h4 className="text-xs font-black text-rose-800 uppercase tracking-widest mb-1">PatiAI Güvenlik Bilgisi</h4>
                            <p className="text-[11px] font-bold text-rose-700/80 leading-relaxed">
                                Canlıyı görmeden önden ödeme yapmayınız.
                            </p>
                        </div>
                    )}

                    {sortedMessages.map((msg, idx) => {
                        const isMe = msg.senderId === currentUser.uid;
                        return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                                        {msg.imageUrl && (
                                            <div className="rounded-2xl overflow-hidden border border-slate-200 mb-1 shadow-sm max-w-[200px] sm:max-w-[280px]">
                                                <img src={msg.imageUrl} alt="Sent photo" className="w-full h-auto object-cover" />
                                            </div>
                                        )}
                                        {msg.text && (
                                            <div className={`px-4 py-2.5 rounded-[1.5rem] shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white text-slate-800 rounded-bl-sm border border-slate-100'
                                                }`}>
                                                <p className="text-[13px] sm:text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className={`text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter ${isMe ? 'mr-2' : 'ml-2'}`}>
                                    {formatTime(msg.createdAt)}
                                </span>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} className="h-4" />
                </div>

                {/* Input Area */}
                <div className="bg-white border-t border-slate-100 p-3 sm:p-5 shrink-0">
                    {selectedImage && (
                        <div className="mb-3 relative inline-block">
                            <img src={URL.createObjectURL(selectedImage)} className="w-20 h-20 bg-slate-100 rounded-xl object-cover border-2 border-indigo-500" />
                            <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex items-end gap-2">
                        <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-all"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </button>
                        <input type="file" ref={imageInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />

                        <div className="flex-1 relative">
                            <textarea
                                value={text}
                                onChange={(e) => {
                                    setText(e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                                }}
                                rows={1}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit(e);
                                    }
                                }}
                                placeholder="Mesaj yazın..."
                                className="w-full bg-slate-100 border-none rounded-[1.5rem] px-5 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all resize-none max-h-32 overflow-hidden"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={(!text.trim() && !selectedImage) || isSending}
                            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg ${(text.trim() || selectedImage) ? 'bg-indigo-600 text-white scale-100' : 'bg-slate-100 text-slate-300 scale-90'
                                }`}
                        >
                            {isSending ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <svg className="w-5 h-5 rotate-45" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                </svg>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
