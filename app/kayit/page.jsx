'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, normalizePhone } from '../../lib/AuthContext';
import { uploadPhotos } from '../../lib/listingService';
import { useRef } from 'react';

export default function RegisterPage() {
    const router = useRouter();
    const { sendOtp, confirmOtp, register, isPhoneRegistered, isNameTaken } = useAuth();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Info, 2: OTP
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const fileInputRef = useRef(null);

    // Parametrik OTP Kontrolü
    const USE_OTP = false;

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

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    async function handleRegister(e) {
        e?.preventDefault();
        setError('');

        if (!name.trim()) { setError('Kullanıcı Adı zorunludur.'); return; }
        if (!phone.trim()) { setError('Telefon numarası zorunludur.'); return; }
        const cleanPhone = normalizePhone(phone);
        if (cleanPhone.length < 10) { setError('Geçerli bir telefon numarası girin.'); return; }
        if (!USE_OTP && !password.trim()) { setError('Şifre zorunludur.'); return; }

        setLoading(true);
        try {
            // Check if name already taken
            const nameTaken = await isNameTaken(name);
            if (nameTaken) {
                setError('Bu kullanıcı adı zaten alınmış. Lütfen başka bir ad seçin.');
                setLoading(false);
                return;
            }

            // Check if phone already registered
            const exists = await isPhoneRegistered(phone);
            if (exists) {
                setError('Bu telefon numarası zaten kayıtlı. Lütfen giriş yapın.');
                setLoading(false);
                return;
            }

            let uploadedPhotoUrl = null;
            if (photoFile) {
                const urls = await uploadPhotos([photoFile]);
                if (urls.length > 0) uploadedPhotoUrl = urls[0];
            }

            if (USE_OTP) {
                await sendOtp(phone, 'recaptcha-container');
                setStep(2);
            } else {
                // OTP kapalıysa eski yöntemle (fake email) kayıt et
                const fakeEmail = `${cleanPhone}@eldenele.app`;
                await register({
                    name: name.trim(),
                    email: fakeEmail,
                    phone: phone.trim(),
                    password: password,
                    photoURL: uploadedPhotoUrl
                });
                router.push('/');
            }
        } catch (err) {
            console.error(err);
            setError(err.message || 'Kayıt işlemi başarısız. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    }

    async function handleConfirmOtp(e) {
        e?.preventDefault();
        setError('');
        if (otp.length < 6) { setError('Lütfen 6 haneli kodu girin.'); return; }
        setLoading(true);
        try {
            await confirmOtp(otp, name.trim());
            router.push('/');
        } catch (err) {
            console.error(err);
            setError('Hatalı veya süresi dolmuş kod.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Invisible Recaptcha Container */}
                <div id="recaptcha-container"></div>

                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-3 group">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center shadow-sm active:scale-95 transition-all">
                            <span className="text-white font-bold text-2xl italic">E</span>
                        </div>
                        <div className="text-left select-none">
                            <div className="font-bold text-2xl text-slate-900 tracking-tight italic">EldenEle<span className="text-orange-500 font-extrabold px-0.5">.pet</span></div>
                            <div className="text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase">Hayvan Dayanışma Ağı</div>
                        </div>
                    </Link>
                </div>

                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100 overflow-hidden relative">
                    {/* Step indicator */}
                    <div className="absolute top-0 right-0 p-4">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Adım {step}/2</span>
                    </div>

                    <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
                        {step === 1 ? 'Hızlı Kayıt Ol' : 'Kodu Doğrula'}
                    </h1>

                    {step === 1 ? (
                        <div className="bg-orange-50 text-orange-700 text-[11px] font-bold p-3 rounded-2xl mb-6 border border-orange-100 flex items-start gap-2.5">
                            <div className="w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center shrink-0 text-[10px] animate-pulse">!</div>
                            <p className="">Kullanıcı adınız ve numaranız ile anında topluluğa katılın.</p>
                        </div>
                    ) : (
                        <p className="text-slate-500 text-sm mb-6 font-medium">
                            <span className="font-bold text-slate-900">{phone}</span> numarasına gönderilen 6 haneli doğrulama kodunu girin.
                        </p>
                    )}

                    <form onSubmit={step === 1 ? handleRegister : handleConfirmOtp} className="space-y-5">
                        {step === 1 ? (
                            <>
                                {/* Avatar Upload Area */}
                                <div className="flex flex-col items-center mb-6">
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-24 h-24 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-white transition-all overflow-hidden relative group"
                                    >
                                        {photoPreview ? (
                                            <img src={photoPreview} className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <svg className="w-8 h-8 text-slate-300 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-tighter">Fotoğraf Ekle</span>
                                            </>
                                        )}
                                        {photoPreview && (
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <span className="text-white text-[10px] font-black uppercase tracking-widest">DEĞİŞTİR</span>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handlePhotoChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Kullanıcı Adı <span className="text-orange-500">*</span></label>
                                    <input value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="Görünen isminiz"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-300" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Telefon Numarası <span className="text-orange-500">*</span></label>
                                    <input value={phone} onChange={handlePhoneChange} type="tel" placeholder="05XX XXX XX XX" maxLength={15}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-300" />
                                </div>
                                {!USE_OTP && (
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Şifre <span className="text-orange-500">*</span></label>
                                        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-300" />
                                    </div>
                                )}
                            </>
                        ) : (
                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Doğrulama Kodu <span className="text-orange-500">*</span></label>
                                <input value={otp} onChange={(e) => setOtp(e.target.value)} type="text" placeholder="123456" maxLength={6}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-2xl font-black text-center tracking-[0.5em] focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-200" />
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 text-red-600 rounded-2xl px-4 py-3 text-[11px] border border-red-100 font-bold flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {error}
                            </div>
                        )}

                        <button type="submit" disabled={loading}
                            className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-slate-900/20 hover:bg-indigo-600 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
                            {loading ? (
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                step === 1 ? (USE_OTP ? 'Kod Gönder' : 'Kayıt Ol') : 'Hesabı Doğrula'
                            )}
                        </button>
                    </form>

                    {step === 2 && (
                        <button onClick={() => setStep(1)} className="w-full mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">
                            Numarayı Düzenle
                        </button>
                    )}

                    <div className="text-center mt-10 text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                        Zaten bir hesabın var mı?
                        <Link href="/giris" className="text-indigo-600 font-black hover:underline ml-1">Giriş Yap</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
