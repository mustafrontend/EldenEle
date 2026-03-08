'use client';

import { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { createPost } from '../lib/communityService';

export default function CreatePost() {
    const { user, userData } = useAuth();
    const [content, setContent] = useState('');
    const [type, setType] = useState('soru'); // 'soru' veya 'talep'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);

    if (!user) {
        return (
            <div className="bg-white border text-center border-slate-200 rounded-2xl p-6 shadow-sm text-slate-500 mb-6">
                Topluluğa soru sormak veya hizmet talebi oluşturmak için <a href="/giris" className="text-indigo-600 font-bold underline transition-colors hover:text-indigo-500">Giriş Yapın</a>.
            </div>
        );
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!content.trim()) return;

        setLoading(true);
        setError('');

        try {
            await createPost({
                content: content.trim(),
                type,
                photoFiles: photoFile ? [photoFile] : [],
                userIsFeatured: userData?.isFeatured || false
            });
            setContent('');
            setPhotoFile(null);
            setPhotoPreview(null);
        } catch (err) {
            console.error(err);
            setError('Gönderilirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    }

    function handleFile(e) {
        const file = e.target.files[0];
        if (!file) return;
        setPhotoFile(file);
        const reader = new FileReader();
        reader.onload = ev => setPhotoPreview(ev.target.result);
        reader.readAsDataURL(file);
    }

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 mb-6 transition-all focus-within:ring-1 focus-within:border-indigo-300 focus-within:shadow-md">
            <form onSubmit={handleSubmit}>
                <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm">
                        {user.photoURL ? (
                            <img src={user.photoURL} alt="Profil" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-indigo-600 font-bold text-lg">
                                {(user.displayName || user.email || 'U')[0].toUpperCase()}
                            </span>
                        )}
                    </div>
                    <div className="flex-1">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Aklınızda ne var? Soru sorun veya hizmet isteyin..."
                            className="w-full bg-transparent border-0 border-b border-transparent placeholder:text-slate-400 focus:border-indigo-500 focus:ring-0 resize-none outline-none py-2 text-slate-800 font-medium min-h-[60px] text-[15px] sm:text-base transition-colors"
                            maxLength={500}
                        />
                    </div>
                </div>

                {photoPreview && (
                    <div className="ml-13 mt-3 relative inline-block">
                        <div className="relative rounded-xl overflow-hidden shadow-sm border border-slate-200">
                            <img src={photoPreview} alt="Preview" className="max-h-48 object-contain" />
                        </div>
                        <button
                            type="button"
                            onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                            className="absolute -top-2 -right-2 w-7 h-7 bg-slate-900 border-2 border-white rounded-full text-white flex items-center justify-center shadow-md hover:bg-red-500 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}

                {error && <p className="text-red-500 text-sm mt-2 ml-13">{error}</p>}

                <div className="flex items-center justify-between mt-3 ml-13 pt-3 border-t border-slate-100">
                    <div className="flex gap-2 flex-wrap sm:flex-nowrap items-center">
                        <label className="cursor-pointer">
                            <input
                                type="radio"
                                name="postType"
                                value="soru"
                                checked={type === 'soru'}
                                onChange={(e) => setType(e.target.value)}
                                className="peer sr-only"
                            />
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] sm:text-sm font-bold transition-all peer-checked:bg-blue-500/10 peer-checked:text-blue-600 peer-checked:border-blue-200 text-slate-500 hover:bg-slate-50 border border-transparent hover:border-slate-200 bg-white">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Soru Sor
                            </span>
                        </label>
                        <label className="cursor-pointer">
                            <input
                                type="radio"
                                name="postType"
                                value="talep"
                                checked={type === 'talep'}
                                onChange={(e) => setType(e.target.value)}
                                className="peer sr-only"
                            />
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] sm:text-sm font-bold transition-all peer-checked:bg-emerald-500/10 peer-checked:text-emerald-600 peer-checked:border-emerald-200 text-slate-500 hover:bg-slate-50 border border-transparent hover:border-slate-200 bg-white">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                Hizmet İste
                            </span>
                        </label>

                        {/* Image Upload Button */}
                        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] sm:text-sm font-bold transition-all text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 bg-white group">
                            <input type="file" accept="image/*" onChange={handleFile} className="sr-only" />
                            <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            Fotoğraf Ekle
                        </label>

                    </div>

                    <button
                        type="submit"
                        disabled={!content.trim() || loading}
                        className="bg-indigo-600 text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                        {loading && (
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {loading ? 'Gönderiliyor...' : 'Paylaş'}
                    </button>
                </div>
            </form>
        </div>
    );
}
