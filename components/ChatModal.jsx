import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { markMessageAsRead } from '../lib/listingService';

export default function ChatModal({ isOpen, onClose, conversation, currentUser, onSend }) {
    const [text, setText] = useState('');
    const messagesEndRef = useRef(null);

    // Scroll to bottom whenever messages change
    useEffect(() => {
        if (isOpen && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [isOpen, conversation?.messages]);

    // Mark unread messages as read when modal opens
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
        if (!text.trim()) return;
        await onSend(conversation.listingId, conversation.otherUserId, text);
        setText('');
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col h-[600px] max-h-[90vh] overflow-hidden">

                {/* Header */}
                <div className="bg-slate-900 px-4 py-3 pb-4 text-white flex items-center justify-between shrink-0 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-lg">
                            {(conversation.otherUserName || 'K')[0].toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-bold leading-tight">{conversation.otherUserName}</h3>
                            <Link href={`/ilan/${conversation.listingId}`} className="text-xs text-indigo-300 hover:text-indigo-200 hover:underline">
                                İlanı Görüntüle
                            </Link>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors">
                        <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
                    {/* Reverse messages to show oldest first (since they are stored newest first in our groups) */}
                    {[...conversation.messages].reverse().map(msg => {
                        const isMe = msg.senderId === currentUser.uid;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${isMe
                                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                                    : 'bg-white text-slate-800 border border-slate-100 rounded-tl-sm'
                                    }`}>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                    <div className={`text-[10px] text-right mt-1 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                                        {formatTime(msg.createdAt)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-100 shrink-0 flex gap-2">
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Mesaj yazın..."
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={!text.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 shadow-sm"
                    >
                        <svg className="w-4 h-4 translate-x-px translate-y-px" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                    </button>
                </form>

            </div>
        </div>
    );
}
