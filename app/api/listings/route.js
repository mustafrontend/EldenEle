import { NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';

// ─── Sunucu taraflı Firebase (client SDK, Node.js ortamı) ────────────────────
const firebaseConfig = {
    apiKey: 'AIzaSyDsoDGJP83KRzDFYGyNMzyNKgwQKPORxDw',
    authDomain: 'bardbird-8d5e4.firebaseapp.com',
    projectId: 'bardbird-8d5e4',
    storageBucket: 'bardbird-8d5e4.firebasestorage.app',
    messagingSenderId: '713731391785',
    appId: '1:713731391785:web:da2bff9c7b6c6fa8f17738',
};

// Next.js sunucu süreci boyunca yaşayan tekil Firebase instance
const serverApp =
    getApps().find((a) => a.name === 'server') ||
    initializeApp(firebaseConfig, 'server');
const serverDb = getFirestore(serverApp);

// ─── Sunucu belleğinde TTL cache (10 dk) ─────────────────────────────────────
const SERVER_CACHE_TTL = 10 * 60 * 1000; // 10 dakika (ms)
let _cache = null; // { data: Array, timestamp: number } | null

// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === '1';
    const now = Date.now();

    // Cache geçerliyse anında dön — Firestore'a istek ATILMAZ
    if (!forceRefresh && _cache && now - _cache.timestamp < SERVER_CACHE_TTL) {
        return NextResponse.json(_cache.data, {
            headers: {
                'Cache-Control': 'public, max-age=600, stale-while-revalidate=60',
                'X-Cache': 'HIT',
            },
        });
    }

    // Cache yoksa / süresi dolmuşsa Firestore'dan çek
    const q = query(collection(serverDb, 'listings'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);

    const activeListings = snap.docs
        .map((d) => {
            const raw = d.data();
            return {
                id: d.id,
                ...raw,
                // Firestore Timestamp → plain object (JSON serializable)
                createdAt: raw.createdAt
                    ? { seconds: raw.createdAt.seconds, nanoseconds: raw.createdAt.nanoseconds }
                    : null,
                expiresAt: raw.expiresAt
                    ? { seconds: raw.expiresAt.seconds, nanoseconds: raw.expiresAt.nanoseconds }
                    : null,
            };
        })
        .filter((l) => l.status === 'active' || !l.status);

    // İlgili kullanıcının toplam aktif ilan sayısını hesapla
    const userCounts = {};
    activeListings.forEach(l => {
        if (l.userId) {
            userCounts[l.userId] = (userCounts[l.userId] || 0) + 1;
        }
    });

    const data = activeListings.map(l => ({
        ...l,
        userListingsCount: l.userId ? (userCounts[l.userId] || 0) : 0
    }));

    _cache = { data, timestamp: now };

    return NextResponse.json(data, {
        headers: {
            'Cache-Control': 'public, max-age=600, stale-while-revalidate=60',
            'X-Cache': 'MISS',
        },
    });
}
