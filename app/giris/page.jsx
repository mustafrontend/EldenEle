'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, normalizePhone } from '../../lib/AuthContext';

export default function LoginPage() {
    const router = useRouter();
    const { login, findUserEmailByPhone } = useAuth();
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);

    const formatPhoneNumber = (value) => {
        if (!value) return value;
        const phoneNumber = value.replace(/[^\d]/g, '');
        const phoneNumberLength = phoneNumber.length;
        if (phoneNumberLength < 4) return phoneNumber;
        if (phoneNumberLength < 7) {
            return `${phoneNumber.slice(0, 4)} ${phoneNumber.slice(4)}`;
        }
        if (phoneNumberLength < 9) {
            return `${phoneNumber.slice(0, 4)} ${phoneNumber.slice(4, 7)} ${phoneNumber.slice(7)}`;
        }
        return `${phoneNumber.slice(0, 4)} ${phoneNumber.slice(4, 7)} ${phoneNumber.slice(7, 9)} ${phoneNumber.slice(9, 11)}`;
    };

    const handlePhoneChange = (e) => {
        const formattedValue = formatPhoneNumber(e.target.value);
        setPhone(formattedValue);
    };

    async function submit(e) {
        e?.preventDefault();
        setError('');
        if (!phone || !password) { setError('Telefon ve şifre zorunludur.'); return; }

        const cleanPhone = normalizePhone(phone);
        if (cleanPhone.length < 10) { setError('Geçerli bir telefon numarası girin.'); return; }

        setLoading(true);
        try {
            // Smart lookup for email based on phone number
            const actualEmail = await findUserEmailByPhone(phone);

            if (!actualEmail) {
                // If not found, try the default fallback (for completely missing users)
                const fallbackEmail = `${cleanPhone}@eldenele.app`;
                await login(fallbackEmail, password, rememberMe);
            } else {
                await login(actualEmail, password, rememberMe);
            }
            router.push('/');
        } catch (err) {
            setError('Telefon numarası veya şifre hatalı.');
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
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Giriş Yap</h1>
                    <p className="text-gray-500 text-sm mb-6">Hesabınıza erişmek için bilgilerinizi girin.</p>

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Telefon Numarası</label>
                            <input
                                value={phone}
                                onChange={handlePhoneChange}
                                type="tel"
                                placeholder="05XX XXX XX XX"
                                maxLength={15}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-shadow transition-all font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Şifre</label>
                            <input
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                type="password"
                                placeholder="••••••••"
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-shadow"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer group select-none">
                                <div className="relative flex items-center justify-center">
                                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 bg-slate-50 cursor-pointer peer transition-all appearance-none checked:bg-indigo-600 checked:border-indigo-600" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                                    <svg className="w-3 h-3 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-[13px] font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                                    Beni Hatırla
                                </span>
                            </label>
                            <Link href="#" className="text-[13px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">Şifremi Unuttum</Link>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 text-sm border border-red-200 font-medium">
                                Lütfen bilgilerinizi kontrol edin. ({error})
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-lg bg-slate-900 text-white font-medium shadow-sm hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading && (
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                        </button>
                    </form>

                    <div className="text-center mt-6 text-sm text-gray-500">
                        Hesabınız yok mu?
                        <Link href="/kayit" className="text-indigo-600 font-semibold hover:underline ml-1">Kayıt Ol</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
