'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createListing, getListing, updateListing, invalidateListingsCache } from '../../lib/listingService';
import { useAuth } from '../../lib/AuthContext';
import { iller, getIlceler } from '../../data/turkiye';
import AppHeader from '../../components/AppHeader';

import { petCategories } from '../../data/petCategories';
import { toast } from 'react-hot-toast';

const takasCategories = ['Mama', 'Aksesuar', 'Kafes / Yuva', 'Oyuncak', 'İlaç / Bakım', 'Akvaryum Malzemeleri', 'Diğer'];
const bedelsizCategories = ['Ücretsiz Mama', 'Eşya Hibesi', 'Acil Destek / İlaç', 'Hediye Paketleri', 'Diğer'];
const otelCategories = ['Pet Oteli / Pansiyon', 'Evde Bakıcı', 'Geçici Yuva / Host', 'Gündüz Bakımevi', 'Eğitim / Okul', 'Diğer'];
const gezdirmeCategories = ['Köpek Gezdirme', 'Düzenli Gezdirme', 'Haftalık Yürüyüş', 'Diğer'];
const transferCategories = ['Şehir İçi Transfer', 'Şehirler Arası Nakil', 'Havayolu Nakliyesi', 'VİP Pet Taksi', 'Diğer'];
const aksesuarMamaCategories = ['Mama', 'Aksesuar', 'Tasma / Gezdirme', 'Yatak / Yuva', 'Oyuncak', 'Bakım Ürünleri', 'Diğer'];

function getCats(concept) {
    if (['sahiplendirme', 'sahiplenmek-istiyorum', 'ciftlestirme', 'kayip'].includes(concept)) return petCategories.map(c => c.name);
    if (concept === 'otel') return otelCategories;
    if (concept === 'gezdirme') return gezdirmeCategories;
    if (concept === 'transfer') return transferCategories;
    if (concept === 'aksesuar-mama') return aksesuarMamaCategories;
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
    const [userIsFeatured, setUserIsFeatured] = useState(false);
    const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
    const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
    const [aiFeedback, setAiFeedback] = useState(null); // { quality: {}, health: "", score: 0 }

    async function handlePhotoAI(base64) {
        setIsAnalyzingPhoto(true);
        try {
            const res = await fetch('/api/ai/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ task: 'analyze-photo', data: { imageBase64: base64 } })
            });
            const data = await res.json();
            let content = data.choices?.[0]?.message?.content || '{}';
            // Clean markdown if AI included it
            content = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const aiData = JSON.parse(content);

            if (aiData.type) {
                const matchedCat = petCategories.find(c => c.name.toLowerCase().includes(aiData.type.toLowerCase()));
                if (matchedCat) setCategory(matchedCat.name);
            }
            if (aiData.breed) setBreed(aiData.breed);
            if (aiData.breed && !title) setTitle(`${aiData.breed} dostumuz yuva arıyor`);

            setAiFeedback({
                quality: aiData.qualityControl || {},
                health: aiData.healthStatus || "",
                desc: aiData.description || ""
            });

            if (aiData.qualityControl?.score < 5) {
                toast.error("PatiAI Notu: Fotoğraf kalitesi düşük olabilir. 📸");
            } else {
                toast.success("PatiAI fotoğrafı analiz etti ve alanları doldurdu! 🐾");
            }
        } catch (err) {
            console.error("AI Analysis failed", err);
        } finally {
            setIsAnalyzingPhoto(false);
        }
    }

    async function handleDescriptionAI() {
        if (!description.trim() || description.length < 5) {
            toast.error("Lütfen önce birkaç anahtar kelime yazın (ör: 2 aylık, uysal, aşıları tam)");
            return;
        }
        setIsGeneratingDesc(true);
        const tid = toast.loading("AI harika bir hikaye yazıyor...");
        try {
            const res = await fetch('/api/ai/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ task: 'generate-description', data: { input: description } })
            });
            const data = await res.json();
            const aiContent = data.choices?.[0]?.message?.content;
            if (aiContent) {
                setDescription(aiContent);
                toast.success("İlan metni AI ile iyileştirildi! ✨", { id: tid });
            }
        } catch (err) {
            toast.error("AI metin oluştururken bir hata oluştu.", { id: tid });
        } finally {
            setIsGeneratingDesc(false);
        }
    }

    function handleRequestBadge() {
        const event = new CustomEvent('openFeedback', { detail: { type: 'token' } });
        window.dispatchEvent(event);
    }

    // Quick Concept Selection
    useEffect(() => {
        const hizli = searchParams.get('hizli');
        if (hizli && !isEditing) {
            setConcept(hizli);
        }
    }, [searchParams, isEditing]);

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
        toAdd.forEach((f, idx) => {
            const reader = new FileReader();
            reader.onload = e => {
                const b64 = e.target.result;
                setPhotoPreviews(prev => [...prev, b64]);
                // AI Analysis for the first uploaded photo
                if (photoPreviews.length === 0 && idx === 0) {
                    handlePhotoAI(b64);
                }
            };
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
                userIsFeatured,
                updatedAt: new Date()
            };

            if (isEditing) {
                await updateListing(editId, data, photoFiles);
            } else {
                await createListing(data, photoFiles);
            }
            // Yeni/güncellenmiş ilan anında görünsün diye cache'i temizle
            invalidateListingsCache();
            router.push('/profil');
        } catch (err) {
            setError('İlan kaydedilirken hata oluştu. Tekrar deneyin.');
        } finally {
            setSubmitting(false);
        }
    }

    const concepts = [
        { key: 'sahiplendirme', label: 'Yuva Sahiplendir', desc: 'Can dostları yuvalandır', color: 'orange', icon: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z' },
        { key: 'sahiplenmek-istiyorum', label: 'Yuva Olmak İstiyorum', desc: 'Pati dostu arıyorum', color: 'rose', icon: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a5.946 5.946 0 00-.942 3.197M12 10.5a3 3 0 110-6 3 3 0 010 6zM4.5 9.375a3 3 0 110-6 3 3 0 010 6zm15 0a3 3 0 110-6 3 3 0 010 6z' },
        { key: 'ciftlestirme', label: 'Eş Yap / Çiftleştirme', desc: 'Dostunuza eş bulun', color: 'purple', icon: 'M11.649 6.79c.462-4.474 5.936-4.474 6.399 0 .34 3.295-3.199 4.316-3.199 4.316s-3.54-1.021-3.2-4.316zm-7.649 0c.462-4.474 5.936-4.474 6.399 0 .34 3.295-3.199 4.316-3.199 4.316s-3.54-1.021-3.2-4.316zm10 12.21c0 2.502-1.921 4.532-4.312 4.532-1.936 0-3.597-1.341-4.312-3.28m8.624 0c0-1.939-1.663-3.28-4.312-3.28-2.649 0-4.312 1.341-4.312 3.28' },
        { key: 'otel', label: 'Pati Oteli / Bakıcı', desc: 'Otel ve konaklama hizmeti', color: 'indigo', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { key: 'gezdirme', label: 'Pati Gezdirme', desc: 'Köpek gezdirme hizmeti', color: 'amber', icon: 'M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z' },
        { key: 'kayip', label: 'Kayıp / Bulunan', desc: 'Acil durum ilanı ver', color: 'red', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
        { key: 'transfer', label: 'Pati Nakil / Taksi', desc: 'Pet taşıma hizmeti', color: 'cyan', icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z' },
        { key: 'aksesuar-mama', label: 'Pati Market', desc: 'Aksesuar & Mama satışı', color: 'blue', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
        { key: 'bedelsiz', label: 'Destek / Hediye', desc: 'Ücretsiz yardım sağla', color: 'emerald', icon: 'M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z' },
    ];

    const currentBreeds = useMemo(() => {
        const catData = petCategories.find(c => c.name === category);
        if (!catData) return [];
        return [...(catData.popularBreeds || []), ...(catData.types || []), ...(catData.subCategories || [])];
    }, [category]);

    function getConceptBorderClass(key) {
        const colorMap = { takas: 'blue', bedelsiz: 'emerald', sahiplendirme: 'orange', 'sahiplenmek-istiyorum': 'rose', ciftlestirme: 'purple', otel: 'indigo', gezdirme: 'amber', kayip: 'red', transfer: 'cyan', 'aksesuar-mama': 'blue' };
        const c = colorMap[key] || 'slate';
        return concept === key ? `border-${c}-800 bg-${c}-50 text-${c}-900 shadow-sm ring-1 ring-${c}-500/20` : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50';
    }

    function getCatActiveClass(cat) {
        if (category !== cat) return 'bg-white border-gray-300 text-gray-600';
        const colorMap = { sahiplendirme: 'orange', 'sahiplenmek-istiyorum': 'rose', bedelsiz: 'emerald', takas: 'blue', ciftlestirme: 'purple', otel: 'indigo', gezdirme: 'amber', kayip: 'red', transfer: 'cyan', 'aksesuar-mama': 'blue' };
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
                    <div className="flex items-center gap-2 mt-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <p className="text-[10px] font-black text-emerald-700 uppercase tracking-tighter">Pati-Göz AI Aktif: Fotoğraf yüklediğinizde cins ve tür otomatik belirlenir.</p>
                    </div>

                    {isAnalyzingPhoto && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3 animate-pulse">
                            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Pati-Göz AI Fotoğrafı Analiz Ediyor...</span>
                        </div>
                    )}

                    {aiFeedback && (
                        <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                            <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl shadow-slate-200 relative overflow-hidden group">
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">🔬</span>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">PatiAI Analiz Raporu</span>
                                        </div>
                                        <div className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-black">SKOR: {aiFeedback.quality?.score || 0}/10</div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Quality */}
                                        <div className="space-y-2">
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fotoğraf Kalitesi</div>
                                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-400 transition-all duration-1000" style={{ width: `${(aiFeedback.quality?.score || 0) * 10}%` }}></div>
                                            </div>
                                            <p className="text-[11px] font-medium text-slate-200 leading-relaxed italic">
                                                "{aiFeedback.quality?.feedback || "Fotoğraf başarıyla analiz edildi."}"
                                            </p>
                                        </div>

                                        {/* Health */}
                                        <div className="space-y-2">
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sağlık Gözlemi</div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                                <span className="text-[11px] font-bold text-emerald-300">Ön Analiz Tamamlandı</span>
                                            </div>
                                            <p className="text-[11px] font-medium text-slate-200 leading-relaxed">
                                                {aiFeedback.health || "Hayvanın genel durumu iyi gözüküyor."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -right-8 -bottom-8 text-8xl opacity-[0.05] rotate-12 group-hover:rotate-0 transition-transform duration-700 pointer-events-none">🐾</div>
                            </div>
                        </div>
                    )}
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
                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                                {concept === 'otel' ? 'Fiyat Bilgisi (₺ / Günlük)' : 'Tahmini Değer (₺)'}
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₺</span>
                                <input value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} type="number" placeholder={concept === 'otel' ? 'Örn: 150' : 'Örn: 500'} min="0"
                                    className="w-full border border-gray-300 rounded-lg px-4 pl-9 py-2.5 text-sm focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-shadow" />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                {concept === 'otel' ? 'Talep ettiğiniz günlük ücret bilgisidir.' : 'Sadece takas veya satış referansı içindir, kesin değer olmak zorunda değil.'}
                            </p>
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

                    {/* Breed / Type selection for Sahiplendirme or Adoption Request or Mating or Lost or Pati Market */}
                    {(['sahiplendirme', 'sahiplenmek-istiyorum', 'ciftlestirme', 'kayip', 'aksesuar-mama'].includes(concept)) && category && currentBreeds.length > 0 && (
                        <div className="animate-modal">
                            <label className="block text-sm font-semibold text-gray-800 mb-2">Tür / Irk <span className="text-red-500">*</span></label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-50/50 rounded-lg">
                                {currentBreeds.map(b => (
                                    <button
                                        key={b}
                                        onClick={() => setBreed(b)}
                                        className={`px-3 py-2 rounded-md border text-[11px] font-bold text-left transition-all ${breed === b ? 'bg-slate-800 border-slate-800 text-white shadow-md' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'}`}
                                    >
                                        {b}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-semibold text-gray-800">Açıklama</label>
                            <button
                                type="button"
                                onClick={handleDescriptionAI}
                                disabled={isGeneratingDesc}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
                            >
                                {isGeneratingDesc ? (
                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <span className="text-xs">✨</span>
                                )}
                                AI İLE GELİŞTİR
                            </button>
                        </div>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="6" placeholder="Ör: 2 aylık, uysal, aşıları tam..."
                            className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 resize-none transition-shadow" />
                        <p className="text-[10px] text-slate-400 font-bold mt-2 italic">* Birkaç kelime yazıp AI butonuna basarak profesyonel bir ilan metni oluşturabilirsiniz.</p>
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

                </div>

                {/* Badge & Featured System */}
                <div className="pt-4 border-t border-gray-100 space-y-4">
                    <div className="flex items-center justify-between bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-indigo-100 text-lg">💎</div>
                            <div>
                                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Bakiyeniz</div>
                                <div className="text-lg font-black text-indigo-900 leading-none">{userData?.tokens || 0} Jeton</div>
                            </div>
                        </div>
                        {(userData?.tokens || 0) < 2 && (
                            <button
                                onClick={handleRequestBadge}
                                className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm hover:bg-indigo-700 transition-all active:scale-95"
                            >
                                Rozet İste
                            </button>
                        )}
                    </div>

                    <label className={`flex items-center gap-3 cursor-pointer group p-4 rounded-2xl border transition-all ${userIsFeatured ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100 hover:border-gray-200'}`}>
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                checked={userIsFeatured}
                                onChange={(e) => {
                                    if (!userIsFeatured && (userData?.tokens || 0) <= 0) {
                                        toast.error("Yeterli jetonunuz bulunmuyor.");
                                        return;
                                    }
                                    setUserIsFeatured(e.target.checked);
                                }}
                                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-amber-300 transition-all checked:bg-amber-500 checked:border-amber-500"
                            />
                            <svg className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-800">İlanımı Öne Çıkar</span>
                                <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">-1 JETON</span>
                            </div>
                            <p className="text-[11px] text-slate-500">İlanınız listenin en başında ve özel vurguyla gösterilir.</p>
                        </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group px-4">
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
        </div>
    );
}
