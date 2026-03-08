'use client';

import { useState, useEffect, useMemo } from 'react';
import { iller, getIlceler } from '../data/turkiye';

import { petCategories } from '../data/petCategories';

const adopCategories = ['Tümü', ...petCategories.map(c => c.name)];
const takasCategories = ['Tümü', 'Mama', 'Aksesuar', 'Kafes / Yuva', 'Oyuncak', 'İlaç / Bakım', 'Diğer'];
const bedelsizCategories = ['Tümü', 'Ücretsiz Mama', 'Eşya Hibesi', 'Acil Destek', 'Diğer'];

function getCategoriesForConcept(concept) {
    switch (concept) {
        case 'sahiplendirme': return adopCategories;
        case 'bedelsiz': return bedelsizCategories;
        default: return takasCategories;
    }
}

function getConceptClasses(concept, activeConcept) {
    if (concept === activeConcept) {
        if (concept === 'sahiplendirme') return 'bg-white shadow-sm text-orange-600 font-black border-orange-500/30 border';
        if (concept === 'bedelsiz') return 'bg-white shadow-sm text-emerald-600 font-black border-emerald-500/30 border';
        return 'bg-white shadow-sm text-slate-900 font-black border border-slate-300';
    }
    return 'text-slate-500 hover:text-slate-700 transparent border border-transparent';
}

function getCategoryClasses(isActive, concept) {
    if (!isActive) {
        if (concept === 'sahiplendirme') return 'bg-slate-50 border-slate-200 text-slate-500 hover:border-orange-500/50 hover:text-orange-500';
        if (concept === 'bedelsiz') return 'bg-slate-50 border-slate-200 text-slate-500 hover:border-emerald-500/50 hover:text-emerald-500';
        return 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700';
    }
    if (concept === 'sahiplendirme') return 'bg-orange-50 border-orange-200 text-orange-600';
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
                    {/* Logo (Mobile) */}
                    <div className="flex items-center gap-2 shrink-0 border-r border-slate-200 pr-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center shadow-md">
                            <span className="text-white font-black text-lg italic pr-0.5">E</span>
                        </div>
                        <span className="font-extrabold text-lg text-slate-900 tracking-tight leading-none hidden min-[360px]:block">
                            .pet
                        </span>
                    </div>

                    {/* Filter Actions */}
                    <div className="flex items-center gap-2">
                        {(concept || city || category) ? (
                            <button onClick={() => { setConcept(''); setCity(''); setDistrict(''); setCategory(''); setIsMobileOpen(false); }} className="text-xs text-indigo-600 hover:text-indigo-500 font-bold px-1 transition-colors">
                                Temizle
                            </button>
                        ) : null}
                        <button
                            onClick={() => setIsMobileOpen(!isMobileOpen)}
                            className="relative flex items-center gap-2 text-slate-700 font-bold text-sm py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg shadow-sm active:scale-95 transition-all"
                        >
                            {isMobileOpen ? 'Kapat' : 'Filtrele'}
                            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            {(!isMobileOpen && (concept || city || category)) && (
                                <span className="absolute -top-1 -left-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500 border-2 border-white"></span>
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Filters Content */}
                <div className={`${isMobileOpen ? 'flex mt-4' : 'hidden'} sm:flex flex-wrap gap-3 items-center transition-all duration-300 origin-top`}>
                    {/* Concept Selector - Obsidian style */}
                    <div className="flex flex-wrap bg-slate-100/50 p-1.5 gap-1.5 rounded-2xl border border-slate-200 shadow-[inset_0_1.5px_3px_0_rgb(0,0,0,0.04)] w-full sm:w-auto">
                        {[
                            { key: 'sahiplendirme', label: '🐾 Yuva Bul' },
                            { key: '', label: 'Hepsi' },
                            { key: 'takas', label: 'Pati Takas' },
                            { key: 'bedelsiz', label: 'Destek / Hediye' },
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => handleConceptChange(key)}
                                className={`${getConceptClasses(key, concept)} px-4 py-2 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap flex-grow sm:flex-grow-0`}
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
