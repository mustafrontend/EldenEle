'use client';

import { useState, useEffect, useMemo } from 'react';
import { iller, getIlceler } from '../data/turkiye';

import { petCategories } from '../data/petCategories';

const adopCategories = ['Tümü', ...petCategories.map(c => c.name)];
const takasCategories = ['Tümü', 'Mama', 'Aksesuar', 'Kafes / Yuva', 'Oyuncak', 'İlaç / Bakım', 'Diğer'];
const bedelsizCategories = ['Tümü', 'Ücretsiz Mama', 'Eşya Hibesi', 'Acil Destek', 'Diğer'];

function getCategoriesForConcept(concept) {
    switch (concept) {
        case 'sahiplendirme':
        case 'sahiplenmek-istiyorum':
        case 'ciftlestirme':
        case 'kayip': return adopCategories;
        case 'otel': return ['Tümü', 'Otel', 'Bakıcı', 'Geçici Yuva', 'Pansiyon', 'Eğitim / Okul'];
        case 'gezdirme': return ['Tümü', 'Köpek Gezdirme', 'Düzenli Gezdirme', 'Haftalık Yürüyüş'];
        case 'transfer': return ['Tümü', 'Şehir İçi Transfer', 'Şehirler Arası Nakil', 'Havayolu Pet Taşıma', 'VİP Pet Taksi'];
        case 'kan-bagisi': return ['Tümü', 'Acil Kan Arayışı', 'Kan Donörü Olabilir', 'İlaç/Serum Desteği'];
        case 'bedelsiz': return bedelsizCategories;
        default: return takasCategories;
    }
}

function getConceptClasses(concept, activeConcept) {
    if (concept === activeConcept) {
        if (concept === 'sahiplendirme') return 'bg-white shadow-sm text-orange-600 font-black border-orange-500/30 border';
        if (concept === 'sahiplenmek-istiyorum') return 'bg-white shadow-sm text-rose-600 font-black border-rose-500/30 border';
        if (concept === 'ciftlestirme') return 'bg-white shadow-sm text-purple-600 font-black border-purple-500/30 border';
        if (concept === 'otel') return 'bg-white shadow-sm text-indigo-600 font-black border-indigo-500/30 border';
        if (concept === 'gezdirme') return 'bg-white shadow-sm text-amber-600 font-black border-amber-500/30 border';
        if (concept === 'kayip') return 'bg-white shadow-sm text-red-600 font-black border-red-500/30 border';
        if (concept === 'transfer') return 'bg-white shadow-sm text-cyan-600 font-black border-cyan-500/30 border';
        if (concept === 'kan-bagisi') return 'bg-white shadow-sm text-red-700 font-black border-red-700/30 border';
        if (concept === 'bedelsiz') return 'bg-white shadow-sm text-emerald-600 font-black border-emerald-500/30 border';
        return 'bg-white shadow-sm text-slate-900 font-black border border-slate-300';
    }
    return 'text-slate-500 hover:text-slate-700 transparent border border-transparent';
}

function getCategoryClasses(isActive, concept) {
    if (!isActive) {
        if (concept === 'sahiplendirme') return 'bg-slate-50 border-slate-200 text-slate-500 hover:border-orange-500/50 hover:text-orange-500';
        if (concept === 'sahiplenmek-istiyorum') return 'bg-slate-50 border-slate-200 text-slate-500 hover:border-rose-500/50 hover:text-rose-500';
        if (concept === 'ciftlestirme') return 'bg-slate-50 border-slate-200 text-slate-500 hover:border-purple-500/50 hover:text-purple-500';
        if (concept === 'otel') return 'bg-slate-50 border-slate-200 text-slate-500 hover:border-indigo-500/50 hover:text-indigo-500';
        if (concept === 'gezdirme') return 'bg-slate-50 border-slate-200 text-slate-500 hover:border-amber-500/50 hover:text-amber-500';
        if (concept === 'kayip') return 'bg-slate-50 border-slate-200 text-slate-500 hover:border-red-500/50 hover:text-red-500';
        if (concept === 'transfer') return 'bg-slate-50 border-slate-200 text-slate-500 hover:border-cyan-500/50 hover:text-cyan-500';
        if (concept === 'kan-bagisi') return 'bg-slate-50 border-slate-200 text-slate-500 hover:border-red-700/50 hover:text-red-700';
        if (concept === 'bedelsiz') return 'bg-slate-50 border-slate-200 text-slate-500 hover:border-emerald-500/50 hover:text-emerald-500';
        return 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700';
    }
    if (concept === 'sahiplendirme') return 'bg-orange-50 border-orange-200 text-orange-600';
    if (concept === 'sahiplenmek-istiyorum') return 'bg-rose-50 border-rose-200 text-rose-600';
    if (concept === 'ciftlestirme') return 'bg-purple-50 border-purple-200 text-purple-600';
    if (concept === 'otel') return 'bg-indigo-50 border-indigo-200 text-indigo-600';
    if (concept === 'gezdirme') return 'bg-amber-50 border-amber-200 text-amber-600';
    if (concept === 'kayip') return 'bg-red-50 border-red-200 text-red-600';
    if (concept === 'transfer') return 'bg-cyan-50 border-cyan-200 text-cyan-600';
    if (concept === 'kan-bagisi') return 'bg-red-50 border-red-200 text-red-700';
    if (concept === 'bedelsiz') return 'bg-emerald-50 border-emerald-200 text-emerald-600';
    return 'bg-slate-100 text-indigo-700 border-slate-300 shadow-sm';
}

export default function FilterBar({ filters, onFilterChange }) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [concept, setConcept] = useState(filters?.concept || '');
    const [city, setCity] = useState(filters?.city || '');
    const [district, setDistrict] = useState(filters?.district || '');
    const [category, setCategory] = useState(filters?.category || '');

    const availableIlceler = useMemo(() => city ? ['Tümü', ...getIlceler(city)] : [], [city]);
    const currentCategories = useMemo(() => getCategoriesForConcept(concept), [concept]);

    // Emit filter changes
    useEffect(() => {
        onFilterChange({ concept, city, district, category });
    }, [concept, city, district, category]);

    function handleConceptChange(c) {
        setConcept(c);
        setCategory('');
    }

    function handleCityChange(c) {
        setCity(c);
        setDistrict('');
    }

    return (
        <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 sm:top-[61px] z-40">
            <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">

                {/* Mobile Top Bar (Logo + Toggle Button) */}
                <div className="flex sm:hidden justify-between items-center w-full">
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Filtrele</span>
                        {(concept || city || category) ? (
                            <button
                                onClick={() => { setConcept(''); setCity(''); setDistrict(''); setCategory(''); setIsMobileOpen(false); }}
                                className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded whitespace-nowrap active:scale-95 transition-all"
                            >
                                SIFIRLA
                            </button>
                        ) : null}
                    </div>

                    <button
                        onClick={() => setIsMobileOpen(!isMobileOpen)}
                        className={`flex items-center gap-2 font-black text-[11px] uppercase tracking-wider py-1.5 px-4 rounded-full transition-all active:scale-95 shadow-sm border ${isMobileOpen ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200'}`}
                    >
                        {isMobileOpen ? 'KAPAT' : 'GELİŞMİŞ FİLTRE'}
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                    </button>
                </div>

                {/* Filters Content */}
                <div className={`${isMobileOpen ? 'flex mt-4' : 'hidden'} sm:flex flex-wrap gap-3 items-center transition-all duration-300 origin-top`}>
                    {/* Concept Selector - Obsidian style */}
                    <div className="flex flex-wrap bg-slate-100/50 p-1.5 gap-1.5 rounded-2xl border border-slate-200 shadow-[inset_0_1.5px_3px_0_rgb(0,0,0,0.04)] w-full sm:w-auto">
                        {[
                            { key: 'sahiplendirme', label: '🐾 Yuva Bul' },
                            { key: 'sahiplenmek-istiyorum', label: '🏠 Yuva Ol' },
                            { key: 'ciftlestirme', label: '💑 Eş Yap' },
                            { key: 'otel', label: '🏨 Pati Oteli' },
                            { key: 'gezdirme', label: '🦮 Gezdirme' },
                            { key: 'kayip', label: '🚨 Kayıp/Bul' },
                            { key: 'transfer', label: '🚕 Nakil' },
                            { key: 'kan-bagisi', label: '🩸 Kan Bağışı' },
                            { key: '', label: 'Hepsi' },
                            { key: 'takas', label: 'Pati Takas' },
                            { key: 'bedelsiz', label: 'Destek/Hediye' },
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => handleConceptChange(key)}
                                className={`${getConceptClasses(key, concept)} px-3 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex-grow sm:flex-grow-0`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* City & District */}
                    <div className="flex gap-2 w-full sm:w-auto">
                        {/* City */}
                        <select
                            value={city}
                            onChange={(e) => handleCityChange(e.target.value)}
                            className="flex-1 sm:flex-none px-3 py-2 border border-slate-200 rounded-lg text-[13px] sm:text-sm bg-white text-slate-800 font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all min-w-[130px] shadow-sm appearance-none"
                        >
                            <option value="">Tüm İller</option>
                            {iller.map(il => (
                                <option key={il} value={il}>{il}</option>
                            ))}
                        </select>

                        {/* District */}
                        <select
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                            disabled={!city}
                            className="flex-1 sm:flex-none px-3 py-2 border border-slate-200 rounded-lg text-[13px] sm:text-sm bg-white text-slate-800 font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all min-w-[130px] disabled:opacity-50 disabled:bg-slate-50 shadow-sm appearance-none"
                        >
                            <option value="">Tüm İlçeler</option>
                            {availableIlceler.map(ilce => (
                                <option key={ilce} value={ilce === 'Tümü' ? '' : ilce}>{ilce}</option>
                            ))}
                        </select>
                    </div>

                    {/* Category */}
                    <div className="flex gap-1.5 flex-wrap w-full sm:w-auto">
                        {currentCategories.map(cat => {
                            const isActive = cat === 'Tümü' ? category === '' : category === cat;
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setCategory(cat === 'Tümü' ? '' : cat)}
                                    className={`${getCategoryClasses(isActive, concept)} px-4 py-2 border rounded-lg text-xs font-bold transition-all whitespace-nowrap flex-grow sm:flex-grow-0`}
                                >
                                    {cat}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
