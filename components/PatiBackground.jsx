'use client';

import { useMemo, useState, useEffect } from 'react';

const PAW_ICONS = ['🐾', '🐾', '🐾', '🐾'];

export default function PatiBackground() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const paws = useMemo(() => {
        if (!mounted) return [];
        return Array.from({ length: 30 }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            delay: `${Math.random() * -30}s`, // Start mid-animation
            duration: `${20 + Math.random() * 25}s`,
            size: `${18 + Math.random() * 20}px`,
            opacity: 0.12 + Math.random() * 0.15,
            rotate: `${Math.random() * 360}deg`
        }));
    }, [mounted]);

    if (!mounted) return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-1] select-none">
            <div className="absolute inset-0 bg-slate-50/30" />
        </div>
    );

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-1] select-none">
            {/* Base Background Overlay - slightly more contrast */}
            <div className="absolute inset-0 bg-slate-50/30" />

            {/* Animated Paws */}
            {paws.map((paw) => (
                <div
                    key={paw.id}
                    className="paw-floating absolute text-slate-400"
                    style={{
                        left: paw.left,
                        animationDelay: paw.delay,
                        animationDuration: paw.duration,
                        fontSize: paw.size,
                        opacity: paw.opacity,
                        transform: `rotate(${paw.rotate})`
                    }}
                >
                    🐾
                </div>
            ))}
        </div>
    );
}
