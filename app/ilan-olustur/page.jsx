'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createListing, getListing, updateListing } from '../../lib/listingService';
import { useAuth } from '../../lib/AuthContext';
import { iller, getIlceler } from '../../data/turkiye';
import AppHeader from '../../components/AppHeader';

import { petCategories } from '../../data/petCategories';

const takasCategories = ['Mama', 'Aksesuar', 'Kafes / Yuva', 'Oyuncak', 'İlaç / Bakım', 'Akvaryum Malzemeleri', 'Diğer'];
const bedelsizCategories = ['Ücretsiz Mama', 'Eşya Hibesi', 'Acil Destek / İlaç', 'Hediye Paketleri', 'Diğer'];

function getCats(concept) {
    if (concept === 'sahiplendirme') return petCategories.map(c => c.name);
    if (concept === 'bedelsiz') return bedelsizCategories;
    return takasCategories;
}

export default function CreateListingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');
    const { user, userData, loading: authLoading } = useAuth();
    const fileInputRef = useRef(null);

    const [isEditing, setIsEditing] = useState(false);
    const [concept, setConcept] = useState('sahiplendirme');
    const [title, setTitle] = useState('');
    const [estimatedValue, setEstimatedValue] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [breed, setBreed] = useState('');
    const [city, setCity] = useState('');
    const [district, setDistrict] = useState('');
    const [photoFiles, setPhotoFiles] = useState([]);
    const [photoPreviews, setPhotoPreviews] = useState([]);
    const [hidePhone, setHidePhone] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState('');

    // Auth guard & Edit Mode Initializer
    useEffect(() => {
        if (!authLoading && !user) router.push('/giris');

        if (user && editId && !isEditing) {
            getListing(editId).then(data => {
                if (data && data.userId === user.uid) {
                    setIsEditing(true);
                    setConcept(data.concept);
                    setTitle(data.title);
                    setEstimatedValue(data.estimatedValue?.toString() || '');
                    setDescription(data.description || '');
                    setCategory(data.category);
                    setBreed(data.breed || '');
                    setCity(data.city);
                    // need to wait for city to fetch districts technically, but we use useMemo below.
                    setTimeout(() => setDistrict(data.district), 100);
                    setHidePhone(data.hidePhone || false);

                    if (data.photos) {
                        setPhotoPreviews(data.photos);
                    }
                } else {
                    router.push('/');
                }
            });
        }
    }, [authLoading, user, router, editId, isEditing]);

    const currentCategories = useMemo(() => getCats(concept), [concept]);
    const availableIlceler = useMemo(() => city ? getIlceler(city) : [], [city]);

    function handleConceptChange(c) {
        setConcept(c);
        setCategory('');
    }

    function handleCityChange(c) {
        setCity(c);
        setDistrict('');
    }

    function handleFiles(files) {
        const newFiles = Array.from(files);
        const remaining = 5 - photoFiles.length;
        const toAdd = newFiles.slice(0, remaining);
        setPhotoFiles(prev => [...prev, ...toAdd]);
        toAdd.forEach(f => {
            const reader = new FileReader();
            reader.onload = e => setPhotoPreviews(prev => [...prev, e.target.result]);
            reader.readAsDataURL(f);
        });
    }

    function onFileChange(e) { handleFiles(e.target.files); }
    function onDrop(e) {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
    }
    function removePhoto(i) {
        setPhotoFiles(prev => prev.filter((_, idx) => idx !== i));
        setPhotoPreviews(prev => prev.filter((_, idx) => idx !== i));
    }

    async function submit() {
        setError('');
        if (!title.trim()) { setError('Başlık zorunludur.'); return; }
        if (!category) { setError('Kategori seçiniz.'); return; }
        if (!city) { setError('İl seçiniz.'); return; }
        if (!user) { router.push('/giris'); return; }

        setSubmitting(true);
        try {
            const data = {
                concept,
                title: title.trim(),
                estimatedValue: ['sahiplendirme', 'bedelsiz'].includes(concept) ? 0 : Number(estimatedValue),
                description: description.trim(),
                category,
                breed,
                city,
                district,
                userPhone: userData?.phone || '',
                userEmail: user.email,
                hidePhone,
                userIsFeatured: userData?.isFeatured || false,
                updatedAt: new Date()
            };

            if (isEditing) {
                await updateListing(editId, data, photoFiles);
            } else {
                await createListing(data, photoFiles);
            }
            router.push('/profil');
        } catch (err) {
            setError('İlan kaydedilirken hata oluştu. Tekrar deneyin.');
        } finally {
            setSubmitting(false);
        }
    }

    const concepts = [
        { key: 'sahiplendirme', label: 'Yuva Sahiplendir', desc: 'Can dostları yuvalandır', color: 'orange', icon: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z' },
        { key: 'takas', label: 'Pati Takas', desc: 'Mama ve aksesuar takasla', color: 'blue', icon: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L13.5 12M21 7.5H7.5' },
        { key: 'bedelsiz', label: 'Destek / Hediye', desc: 'Ücretsiz yardım sağla', color: 'emerald', icon: 'M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z' },
    ];

    const currentBreeds = useMemo(() => {
        const catData = petCategories.find(c => c.name === category);
        if (!catData) return [];
        return [...(catData.popularBreeds || []), ...(catData.types || []), ...(catData.subCategories || [])];
    }, [category]);

    function getConceptBorderClass(key) {
        const colorMap = { takas: 'slate', yetenek: 'teal', bedelsiz: 'emerald', geridonusum: 'amber', odunc: 'blue', sahiplendirme: 'orange' };
        const c = colorMap[key] || 'slate';
        return concept === key ? `border-${c}-800 bg-${c}-50 text-${c}-900 shadow-sm` : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50';
    }

    function getCatActiveClass(cat) {
        if (category !== cat) return 'bg-white border-gray-300 text-gray-600';
        const colorMap = { sahiplendirme: 'orange', bedelsiz: 'emerald', takas: 'blue' };
        const c = colorMap[concept];
        if (c) return `bg-${c}-600 border-${c}-600 text-white`;
        return 'bg-slate-800 border-slate-800 text-white';
    }

    if (authLoading) return null;

    return (
        <div className="min-h-screen bg-gray-50 overflow-x-hidden flex flex-col relative w-full max-w-[100vw]">
            <AppHeader />
            <div className="max-w-2xl mx-auto px-4 py-10 pb-28 sm:pb-10 w-full">
                {/* Header */}
                <div className="mb-8 border-b border-gray-200 pb-5">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">{isEditing ? 'İlanı Düzenle' : 'İlan Oluştur'}</h1>
                    <p className="text-gray-500 text-sm">Ücretsiz ilan ver, hızla takas yap veya sahiplendir.</p>
                </div>

                {/* Concept Toggle */}
                <div className="bg-white rounded-xl p-6 shadow-sm mb-6 border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-800 mb-3">İlan Türü Seçin <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {concepts.map(({ key, label, desc, icon }) => (
                            <button key={key} onClick={() => handleConceptChange(key)}
                                className={`${getConceptBorderClass(key)} p-4 rounded-lg border flex flex-col items-center gap-2 transition-all`}>
                                <svg className="w-7 h-7 mb-1 stroke-current opacity-80" fill="none" viewBox="0 0 24 24" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                                </svg>
                                <span className="font-bold text-sm">{label}</span>
                                <span className="text-[11px] text-center opacity-70">{desc}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Photos */}
                <div className="bg-white rounded-xl p-6 shadow-sm mb-6 border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-800 mb-1">
                        Fotoğraflar <span className="font-normal text-gray-400 text-xs ml-1">(en fazla 5 resim isteğe bağlı)</span>
                    </label>
                    <p className="text-[10px] text-amber-600 font-bold mb-3 italic">Not: İlanınız 30 gün boyunca yayında kalacaktır.</p>
                    <div className="grid grid-cols-3 gap-4 mb-3">
                        {photoPreviews.map((preview, i) => (
                            <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                <img src={preview} className="w-full h-full object-cover" alt="" />
                                <button onClick={() => removePhoto(i)} className="absolute top-1.5 right-1.5 w-6 h-6 bg-slate-900/80 backdrop-blur-sm text-white rounded-md flex items-center justify-center text-xs hover:bg-slate-900 transition-colors">✕</button>
                            </div>
                        ))}
                        {photoPreviews.length < 5 && (
                            <div
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={onDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`${dragOver ? 'border-slate-800 bg-slate-50' : 'border-gray-300'} aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-slate-400 hover:bg-gray-50 transition-all`}
                            >
                                <svg className="w-8 h-8 text-gray-300 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" />
                                </svg>
                                <span className="text-xs text-gray-400">Ekle</span>
                            </div>
                        )}
                    </div>
                    <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={onFileChange} />
                    <p className="text-xs text-gray-400">Sürükle & bırak veya tıklayarak yükle</p>
                </div>

                {/* Form Fields */}
                <div className="bg-white rounded-xl p-6 shadow-sm mb-6 border border-gray-200 space-y-5">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Başlık <span className="text-red-500">*</span></label>
                        <input value={title} onChange={(e) => setTitle(e.target.value)} type="text" placeholder="Ör: Kapalı Kutu Laptop, Siyam Kedisi…"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-shadow" />
                    </div>

                    {!['sahiplendirme', 'bedelsiz', 'odunc'].includes(concept) && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-2">Tahmini Değer (₺)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₺</span>
                                <input value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} type="number" placeholder="Örn: 500" min="0"
                                    className="w-full border border-gray-300 rounded-lg px-4 pl-9 py-2.5 text-sm focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-shadow" />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Sadece takas veya satış referansı içindir, kesin değer olmak zorunda değil.</p>
                        </div>
                    )}

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Kategori <span className="text-red-500">*</span></label>
                        <div className="flex flex-wrap gap-2">
                            {currentCategories.map(cat => (
                                <button key={cat} onClick={() => { setCategory(cat); setBreed(''); }}
                                    className={`${getCatActiveClass(cat)} px-3 py-1.5 rounded-md border text-xs font-medium hover:opacity-90 transition-all`}>{cat}</button>
                            ))}
                        </div>
                    </div>

                    {/* Breed / Type selection for Sahiplendirme */}
                    {concept === 'sahiplendirme' && category && currentBreeds.length > 0 && (
                        <div className="animate-modal">
                            <label className="block text-sm font-semibold text-gray-800 mb-2">Tür / Irk <span className="text-red-500">*</span></label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-50/50 rounded-lg">
                                {currentBreeds.map(b => (
                                    <button
                                        key={b}
                                        onClick={() => setBreed(b)}
                                        className={`px-3 py-2 rounded-md border text-[11px] font-bold text-left transition-all ${breed === b ? 'bg-orange-600 border-orange-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-700 hover:border-orange-300'}`}
                                    >
                                        {b}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Açıklama</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="4" placeholder="Ürününüzü detaylı bir şekilde tanımlayın…"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 resize-none transition-shadow" />
                    </div>

                    {/* City / District */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-2">İl <span className="text-red-500">*</span></label>
                            <select value={city} onChange={(e) => handleCityChange(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-shadow bg-white text-gray-700">
                                <option value="">Seçiniz</option>
                                {iller.map(il => <option key={il} value={il}>{il}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-2">İlçe</label>
                            <select value={district} onChange={(e) => setDistrict(e.target.value)} disabled={!city}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-shadow bg-white text-gray-700 disabled:opacity-50 disabled:bg-gray-50">
                                <option value="">Seçiniz</option>
                                {availableIlceler.map(ilce => <option key={ilce} value={ilce}>{ilce}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Phone Display Preference */}
                    <div className="pt-4 border-t border-gray-100">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    checked={hidePhone}
                                    onChange={(e) => setHidePhone(e.target.checked)}
                                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 transition-all checked:bg-slate-800 checked:border-slate-800"
                                />
                                <svg className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-800 group-hover:text-slate-900 transition-colors">Numaramı Gizle, Sadece WhatsApp'tan Ulaş</span>
                                <p className="text-[11px] text-slate-500">Telefon numaranız doğrudan görünmez, alıcılar size hazır WhatsApp mesajı ile ulaşır.</p>
                            </div>
                        </label>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm mb-6 border border-red-200 font-medium">
                        Lütfen hataları düzeltin: {error}
                    </div>
                )}

                <button onClick={submit} disabled={submitting}
                    className="w-full py-3.5 rounded-lg bg-slate-900 text-white font-bold text-base shadow-sm hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex justify-center items-center gap-2">
                    {submitting && (
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    )}
                    {submitting ? 'İşleniyor...' : isEditing ? 'Değişiklikleri Kaydet' : 'İlanı Yayınla'}
                </button>
            </div>
        </div >
    );
}
