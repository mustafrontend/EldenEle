'use client';

import { useState, useRef, useEffect } from 'react';

export default function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isVetMode, setIsVetMode] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    async function handleSend(e) {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const endpoint = isVetMode ? '/api/ai/tasks' : '/api/ai/chat';
            const body = isVetMode
                ? { task: 'vet-triage', data: { symptoms: input } }
                : { messages: [...messages, userMsg] };

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            const aiContent = data.choices?.[0]?.message?.content || "Üzgünüm, şu an yanıt veremiyorum. 🐾";
            setMessages(prev => [...prev, { role: 'assistant', content: aiContent }]);

            if (isVetMode) setIsVetMode(false); // Reset after one triage or keep? Let's reset but prompt user.
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'assistant', content: "Bir hata oluştu, pati dostum! Lütfen tekrar dene." }]);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="fixed bottom-[175px] sm:bottom-[88px] right-6 z-[100]">
            {/* Chat Window */}
            {isOpen && (
                <div className="absolute bottom-16 right-0 w-[320px] sm:w-[380px] h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className={`p-4 text-white flex items-center justify-between transition-colors duration-500 ${isVetMode ? 'bg-rose-600' : 'bg-slate-900'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-all ${isVetMode ? 'bg-white text-rose-600' : 'bg-orange-500 text-white'}`}>
                                {isVetMode ? (
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                ) : (
                                    <span className="font-black text-xl italic pr-0.5">E</span>
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-sm leading-none">{isVetMode ? 'Vet-Triyaj' : 'PatiAI'}</h3>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isVetMode ? 'bg-white' : 'bg-emerald-500'}`}></div>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isVetMode ? 'text-rose-100' : 'text-slate-400'}`}>
                                        {isVetMode ? 'ACİL SAĞLIK ASSİSTANI' : 'Akıllı Danışman'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setIsVetMode(!isVetMode)}
                                className={`p-2 rounded-xl transition-all ${isVetMode ? 'bg-white/20' : 'hover:bg-slate-800'}`}
                                title="Veteriner Modu"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.423 15.641a1.532 1.532 0 01.411 1.19 1.533 1.533 0 01-1.347 1.347 1.533 1.533 0 01-1.19-.411L13.25 14.75l-4.043 4.043a1.533 1.533 0 01-2.167 0 1.533 1.533 0 010-2.167l4.043-4.043-4.043-4.043a1.533 1.533 0 010-2.167 1.533 1.533 0 012.167 0l4.043 4.043 4.043-4.043a1.533 1.533 0 012.167 0 1.533 1.533 0 010 2.167l-4.043 4.043 4.043 4.043z" />
                                </svg>
                            </button>
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-black/10 rounded-full transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                        {isVetMode && (
                            <div className="bg-rose-50 border border-rose-100 p-3 rounded-2xl mb-2 animate-in fade-in duration-500">
                                <p className="text-[10px] font-black text-rose-800 uppercase tracking-widest mb-1">🏥 Veteriner Triyaj Modu</p>
                                <p className="text-[11px] font-bold text-rose-600 leading-tight">Dostunuzun belirtilerini yazın, aciliyet durumunu analiz edelim. Unutmayın, bu bir tıbbi teşhis değildir!</p>
                            </div>
                        )}
                        {messages.length === 0 && (
                            <div className="text-center py-10 opacity-60">
                                <div className="text-4xl mb-4">🐾</div>
                                <p className="text-sm font-bold text-slate-500 px-8">Merhaba! Ben PatiAI. Hayvan dostun hakkında merak ettiklerini bana sorabilirsin.</p>
                            </div>
                        )}
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm font-medium shadow-sm transition-all ${m.role === 'user'
                                    ? 'bg-slate-900 text-white rounded-br-sm'
                                    : 'bg-white border border-slate-100 text-slate-700 rounded-bl-sm'
                                    }`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isVetMode ? "Semptomları yazın..." : "PatiAI'ye sor..."}
                            className={`flex-1 bg-slate-50 border rounded-2xl px-4 py-2 text-sm focus:outline-none transition-all font-medium ${isVetMode ? 'border-rose-200 focus:border-rose-500' : 'border-slate-200 focus:border-orange-500'}`}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className={`w-10 h-10 disabled:bg-slate-200 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all ${isVetMode ? 'bg-rose-600 shadow-rose-500/20 hover:bg-rose-700' : 'bg-orange-500 shadow-orange-500/20 hover:bg-orange-600'}`}
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                        </button>
                    </form>
                </div>
            )}

            {/* Bubble Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative group w-14 h-14 rounded-2xl bg-slate-900 border-2 border-white shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${isOpen ? 'rotate-90 bg-slate-800' : ''}`}
            >
                {isOpen ? (
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                    <div className="relative">
                        <svg className="w-8 h-8 text-white group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                        </span>
                    </div>
                )}

                {/* Tooltip */}
                {!isOpen && (
                    <div className="absolute right-full mr-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Bir sorum var 🐾
                    </div>
                )}
            </button>
        </div>
    );
}
