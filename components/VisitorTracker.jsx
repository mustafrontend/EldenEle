'use client';

import { useEffect } from 'react';
import { logVisitor } from '../lib/listingService';

export default function VisitorTracker() {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Sadece session (oturum) başına bir kez logla
        const tracked = sessionStorage.getItem('visitorTracked');
        if (!tracked) {
            async function track() {
                try {
                    let ip = 'Bilinmiyor';
                    // IP adresini al (üçüncü parti ücretsiz servis)
                    try {
                        const res = await fetch('https://api.ipify.org?format=json');
                        if (res.ok) {
                            const data = await res.json();
                            ip = data.ip;
                        }
                    } catch (e) { console.warn("IP fetch error"); }

                    await logVisitor({
                        userAgent: navigator.userAgent,
                        language: navigator.language,
                        platform: navigator.platform,
                        path: window.location.pathname,
                        ip: ip,
                    });

                    sessionStorage.setItem('visitorTracked', 'true');
                } catch (e) {
                    console.error("Ziyaretçi takip hatası", e);
                }
            }
            // 2 saniye gecikmeli çalıştır ki ana render'ı asla bloklamasın
            setTimeout(track, 2000);
        }
    }, []);

    return null;
}
