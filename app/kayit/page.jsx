'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/AuthContext';

export default function RegisterPage() {
    const router = useRouter();
    const { register } = useAuth();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function submit(e) {
        e?.preventDefault();
        setError('');
        if (!name.trim()) { setError('Kullanıcı Adı zorunludur.'); return; }
        if (!phone.trim()) { setError('Telefon numarası zorunludur.'); return; }
        if (password.length < 6) { setError('Şifre en az 6 karakter olmalıdır.'); return; }
        setLoading(true);
        try {
            const cleanPhone = phone.replace(/\D/g, '');
            const fakeEmail = `${cleanPhone}@eldenele.app`;
            await register({ name: name.trim(), email: fakeEmail, phone: cleanPhone, password });
            router.push('/');
        } catch (err) {
            if (err.code === 'auth/email-already-in-use') setError('Bu telefon numarası zaten kayıtlı.');
            else setError('Kayıt sırasında hata oluştu.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-3 group">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center shadow-sm">
                            <span className="text-white font-bold text-2xl italic">E</span>
                        </div>
                        <div className="text-left select-none">
                            <div className="font-bold text-2xl text-slate-900 tracking-tight">EldenEle<span className="text-indigo-600">.app</span></div>
                            <div className="text-xs text-gray-500 font-medium tracking-wide">Paylaşım Ağı</div>
                        </div>
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Hızlı Kayıt Ol</h1>
                    <div className="bg-indigo-50 text-indigo-700 text-sm font-medium p-3 rounded-lg mb-6 border border-indigo-100 flex items-start gap-2">
                        <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <p>SMS doğrulama yok! Sadece numaranı gir, anında ücretsiz ilan ver ve Topluluğa katıl.</p>
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Kullanıcı Adı <span className="text-red-500">*</span></label>
                            <input value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="Örn: MehmetY"
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-shadow" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Telefon Numarası <span className="text-red-500">*</span></label>
                            <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="05XX XXX XX XX"
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-shadow" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Şifre <span className="text-red-500">*</span></label>
                            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••"
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-shadow" />
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 text-sm border border-red-200 font-medium">
                                Lütfen bilgilerinizi kontrol edin. ({error})
                            </div>
                        )}

                        <button type="submit" disabled={loading}
                            className="w-full py-3 rounded-lg bg-slate-900 text-white font-medium shadow-sm hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                            {loading && (
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
                        </button>
                    </form>

                    <div className="text-center mt-6 text-sm text-gray-500">
                        Zaten hesabınız var mı?
                        <Link href="/giris" className="text-indigo-600 font-semibold hover:underline ml-1">Giriş Yap</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
