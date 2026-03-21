'use client';

import { useState, useRef, useEffect } from 'react';
import AppHeader from '../../components/AppHeader';
import { toast } from 'react-hot-toast';
import { createPost, createComment, createAiComment } from '../../lib/communityService';
import { useAuth } from '../../lib/AuthContext';
import { useRouter } from 'next/navigation';

export default function AIVetPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Merhaba! Ben PatiAI Veteriner Asistanı. 🩺\n\nSıradan yapay zekaların aksine, ben en güncel ve en kapsamlı veteriner tıp bilgileriyle özel olarak eğitildim. Dostunuzun sağlığı, beslenmesi veya davranışı hakkında uzman düzeyinde destek almak için bana her şeyi sorabilir veya fotoğraf yükleyebilirsiniz. 🐾✨' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [currentPostId, setCurrentPostId] = useState(null);
    const fileInputRef = useRef(null);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    function handleFileChange(e) {
        if (!user) {
            toast.error("Fotoğraf analizi için giriş yapmanız gerekiyor.");
            router.push('/giris');
            return;
        }
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => setPreview(ev.target.result);
        reader.readAsDataURL(file);
    }

    async function handleSend(e) {
        e?.preventDefault();
        if (!user) {
            toast.error("PatiAI ile konuşmak için giriş yapmanız gerekiyor.");
            router.push('/giris');
            return;
        }
        if ((!input.trim() && !preview) || isLoading) return;

        const userMsg = {
            role: 'user',
            content: input,
            image: preview
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setPreview(null);
        setIsLoading(true);

        try {
            let res;
            if (userMsg.image) {
                // Photo analysis mode
                res = await fetch('/api/ai/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        task: 'analyze-photo',
                        data: { imageBase64: userMsg.image }
                    })
                });
            } else {
                // General triage / chat mode
                res = await fetch('/api/ai/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        task: 'vet-triage',
                        data: { symptoms: input }
                    })
                });
            }

            const data = await res.json();
            let aiContent = data.choices?.[0]?.message?.content || "Üzgünüm, şu an yanıt veremiyorum. 🐾";

            // If it's JSON from analysis, format it nicely
            if (userMsg.image && aiContent.includes('{')) {
                try {
                    const parsed = JSON.parse(aiContent);
                    aiContent = `📸 Analiz Tamamlandı:\n\nCins: ${parsed.breed}\nYaş: ${parsed.ageCategory}\nTür: ${parsed.type}\n\nUzman Notu: ${parsed.description}`;
                } catch (e) { }
            }

            setMessages(prev => [...prev, { role: 'assistant', content: aiContent }]);

            // --- SYNC TO COMMUNITY ---
            try {
                let postId = currentPostId;

                if (!postId) {
                    // 1. Create Post (User's Question)
                    // We prepare a "pseudo-file" if there's an image, or just skip if complex.
                    // For now, let's just create the text post.
                    postId = await createPost({
                        content: userMsg.content || "Veteriner Danışmanlığı (Fotoğraflı Analiz)",
                        type: 'soru',
                        photoFiles: [] // Base64 handling would need conversion, keeping it simple for now
                    });
                    setCurrentPostId(postId);
                } else {
                    // 2. Add user follow-up as comment
                    await createComment({
                        postId: postId,
                        content: userMsg.content || "Takip sorusu."
                    });
                }

                // 3. Add AI response as PatiAI comment
                await createAiComment({
                    postId: postId,
                    content: aiContent
                });
            } catch (syncErr) {
                console.error("Community sync failed:", syncErr);
            }

        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'assistant', content: "Bir hata oluştu, lütfen tekrar deneyin." }]);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <AppHeader />

            <main className="max-w-4xl mx-auto w-full flex-1 flex flex-col p-4 md:py-10">
                {/* Header Info */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-rose-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-xl shadow-rose-200 animate-bounce">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">AI Veteriner Merkezi</h1>
                    <p className="text-slate-500 font-bold mt-2">7/24 Akıllı Sağlık ve Bakım Danışmanı</p>
                </div>

                {/* Chat Interface */}
                <div className="flex-1 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-200 flex flex-col overflow-hidden min-h-[500px]">
                    {/* Message Area */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] flex flex-col gap-2 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    {m.image && (
                                        <div className="w-48 h-48 rounded-2xl overflow-hidden border-4 border-white shadow-md">
                                            <img src={m.image} className="w-full h-full object-cover" alt="Yüklenen" />
                                        </div>
                                    )}
                                    <div className={`px-5 py-3.5 rounded-3xl text-[14px] font-medium leading-relaxed shadow-sm transition-all ${m.role === 'user'
                                        ? 'bg-slate-900 text-white rounded-br-sm'
                                        : 'bg-slate-50 border border-slate-100 text-slate-700 rounded-bl-sm whitespace-pre-wrap'
                                        }`}>
                                        {m.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-50 border border-slate-100 px-5 py-4 rounded-3xl rounded-bl-sm shadow-sm flex gap-1.5">
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Input or Login Prompt */}
                    <div className="p-4 bg-white border-t border-slate-100">
                        {user ? (
                            <>
                                {preview && (
                                    <div className="mb-4 relative inline-block">
                                        <img src={preview} className="w-20 h-20 object-cover rounded-xl border-2 border-slate-100" alt="" />
                                        <button onClick={() => setPreview(null)} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-lg">✕</button>
                                    </div>
                                )}
                                <form onSubmit={handleSend} className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-12 h-12 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl flex items-center justify-center transition-all shrink-0"
                                    >
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                    <input
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Belirtileri anlatın veya fotoğraf yükleyin..."
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-2 text-[15px] focus:outline-none focus:border-rose-500 transition-all font-medium"
                                    />
                                    <button
                                        type="submit"
                                        disabled={(!input.trim() && !preview) || isLoading}
                                        className="w-14 h-12 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20 active:scale-90 transition-all shrink-0"
                                    >
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                        </svg>
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="py-4 text-center">
                                <p className="text-sm font-bold text-slate-500 mb-4">Uzman PatiAI ile konuşmak ve analiz yapmak için giriş yapmalısınız.</p>
                                <button
                                    onClick={() => router.push('/giris')}
                                    className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-800 transition-all"
                                >
                                    GİRİŞ YAP / KAYIT OL
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Important Warning */}
                <div className="mt-8 bg-amber-50 border border-amber-200 p-5 rounded-[2rem] flex gap-4 items-center">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 shrink-0 text-xl">⚠️</div>
                    <p className="text-[12px] font-bold text-amber-800 leading-normal">
                        <span className="block mb-1 font-black">KRİTİK UYARI:</span>
                        PatiAI Veteriner Asistanı tıbbi bir teşhis koymaz. Acil durumlarda veya ciddi sağlık sorunlarında vakit kaybetmeden <span className="underline">en yakın veteriner hekime</span> başvurmalısınız.
                    </p>
                </div>
            </main>
        </div>
    );
}
