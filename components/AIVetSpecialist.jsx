'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { generateListingSlug } from '../lib/seo';

export default function AIVetSpecialist({ listings }) {
    const [selectedListing, setSelectedListing] = useState(null);
    const [compliment, setCompliment] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!listings || listings.length === 0) return;

        async function getVetCompliment() {
            try {
                // Sadece sahiplendirme olanlardan rastgele birini seç
                const sahiplendirmeListings = listings.filter(l => l.concept === 'sahiplendirme' && l.photos?.length > 0);
                const candidates = sahiplendirmeListings.length > 0 ? sahiplendirmeListings : listings;

                const random = candidates[Math.floor(Math.random() * candidates.length)];
                setSelectedListing(random);

                const res = await fetch('/api/ai/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        task: 'vet-compliment',
                        data: { listing: { title: random.title, breed: random.breed, category: random.category } }
                    })
                });
                const data = await res.json();
                setCompliment(data.choices?.[0]?.message?.content || "Bu dostumuz tam bir sevgi yumağı!");
            } catch (err) {
                console.error(err);
                setCompliment("Sağlıklı ve neşeli bir dostumuz yuva bekliyor!");
            } finally {
                setIsLoading(false);
            }
        }

        getVetCompliment();
    }, [listings]);

    if (!selectedListing || isLoading) return null;

    const slug = generateListingSlug(selectedListing);

    return (
        <div className="bg-white rounded-[2rem] border-[0.5px] border-slate-200 shadow-[0_12px_44px_-12px_rgba(0,0,0,0.05)] overflow-hidden group">
            <div className="flex flex-col md:flex-row items-stretch">
                {/* Pet Photo */}
                <div className="w-full md:w-32 h-40 md:h-auto shrink-0 relative overflow-hidden">
                    <img
                        src={selectedListing.photos?.[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        alt=""
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Veterinerin Favorisi</span>
                    </div>

                    <h4 className="font-black text-slate-900 text-sm mb-1.5 leading-tight group-hover:text-indigo-600 transition-colors">
                        {selectedListing.title}
                    </h4>

                    <p className="text-[11px] font-bold text-slate-600 italic leading-relaxed mb-3">
                        "{compliment}"
                    </p>

                    <div className="flex items-center justify-between mt-auto">
                        <Link
                            href={`/ilan/${slug}`}
                            className="text-[10px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100/50 hover:bg-rose-100 transition-all active:scale-95"
                        >
                            Dostumuzla Tanış
                        </Link>
                        <div className="flex items-center gap-1.5 opacity-40">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">AI Specialist</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
