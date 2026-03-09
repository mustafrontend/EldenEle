import { db, auth } from './firebase';
import {
    collection, addDoc, getDocs, doc, getDoc, query, where, orderBy,
    onSnapshot, serverTimestamp, updateDoc, deleteDoc, or, increment, limit, setDoc, Timestamp
} from 'firebase/firestore';

// ─── Listings Cache (2 katman) ────────────────────────────────────────────────
// L1: Client-side bellek — SPA navigasyonlarında anlık (~0ms)
// L2: /api/listings — sunucu bellek + tarayıcı HTTP cache (~30ms, hard refresh dahil)
const CLIENT_CACHE_TTL = 10 * 60 * 1000; // 10 dakika

let _clientCache = null; // { data: Array, timestamp: number } | null

export function invalidateListingsCache() {
    _clientCache = null;
}

/**
 * 2-katmanlı cache ile ilanları getirir.
 * L1 (bellek): Anlık. SPA nav'da hiçbir ağ isteği atılmaz.
 * L2 (API):    /api/listings → sunucu cache (10dk) + tarayıcı HTTP cache.
 * @param {boolean} [forceRefresh=false]
 */
export async function getCachedListings(forceRefresh = false) {
    const now = Date.now();

    // L1: Client bellek cache'ini kontrol et (SPA navigasyonu için anlık)
    if (
        !forceRefresh &&
        _clientCache &&
        now - _clientCache.timestamp < CLIENT_CACHE_TTL
    ) {
        return _clientCache.data;
    }

    // L2: Sunucu API — sunucunun kendi cache'i + HTTP Cache-Control header
    const url = forceRefresh ? '/api/listings?refresh=1' : '/api/listings';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Listings API hatası: ' + res.status);
    const data = await res.json();

    _clientCache = { data, timestamp: now };
    return data;
}
// ─────────────────────────────────────────────────────────────────────────────

// Compress & convert image file to base64 data URL (max ~150KB each)
function compressImage(file, maxWidth = 800, quality = 0.75) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;
                if (width > maxWidth) {
                    height = Math.round(height * maxWidth / width);
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

export function subscribeListings(callback) {
    // We remove the where clause to avoid mandatory composite indexes
    const q = query(
        collection(db, 'listings'),
        orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
        const data = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(l => l.status === 'active' || !l.status);
        callback(data);
    });
}

export function subscribeNewUsers(callback, limitCount = 5) {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(limitCount));
    return onSnapshot(q, (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(data);
    });
}

export async function uploadPhotos(files) {
    const base64List = [];
    for (const file of files) {
        const compressed = await compressImage(file);
        base64List.push(compressed);
    }
    return base64List;
}

export async function createListing(data, photoFiles) {
    // MAX 5 PHOTOS
    const limitedPhotos = photoFiles.slice(0, 5);
    const photoUrls = await uploadPhotos(limitedPhotos);
    const user = auth.currentUser;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const docRef = await addDoc(collection(db, 'listings'), {
        ...data,
        photos: photoUrls,
        userId: user.uid,
        userName: user.displayName,
        favoriteCount: 0,
        views: 0,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
        status: 'active',
        userIsFeatured: data.userIsFeatured || false,
        userBadges: data.userBadges || [],
    });
    return docRef.id;
}

export async function incrementListingView(id) {
    if (!id) return;
    try {
        await updateDoc(doc(db, 'listings', id), {
            views: increment(1)
        });
    } catch (e) {
        // Silently fail for views if document doesn't exist anymore
    }
}

export async function getListing(id) {
    const snap = await getDoc(doc(db, 'listings', id));
    if (snap.exists()) return { id: snap.id, ...snap.data() };
    return null;
}

export async function getUserListings(userId) {
    const q = query(collection(db, 'listings'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function getFavoriteListings(ids) {
    if (!ids || !ids.length) return [];
    const results = [];
    for (const id of ids) {
        const snap = await getDoc(doc(db, 'listings', id));
        if (snap.exists()) results.push({ id: snap.id, ...snap.data() });
    }
    return results;
}

export async function deleteListing(id) {
    await deleteDoc(doc(db, 'listings', id));
}

export async function updateListing(id, data, newPhotoFiles = []) {
    let updates = { ...data };
    if (newPhotoFiles.length > 0) {
        const photoUrls = await uploadPhotos(newPhotoFiles);
        // Ideally append or replace, this replaces the whole photos array if new files are given
        updates.photos = photoUrls;
    }
    await updateDoc(doc(db, 'listings', id), updates);
}

export async function adminUpdateListing(id, data) {
    await updateDoc(doc(db, 'listings', id), data);
}

// Messages
export async function sendMessage({ listingId, receiverId, text }) {
    const user = auth.currentUser;
    await addDoc(collection(db, 'messages'), {
        listingId,
        senderId: user.uid,
        senderName: user.displayName,
        receiverId,
        text,
        createdAt: serverTimestamp(),
        read: false,
    });
}

export function subscribeMessages(userId, callback) {
    const q = query(
        collection(db, 'messages'),
        or(
            where('receiverId', '==', userId),
            where('senderId', '==', userId)
        )
    );
    return onSnapshot(q, (snap) => {
        const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        callback(msgs);
    }, (error) => {
        console.error("subscribeMessages error:", error);
    });
}

export async function getConversation(listingId, userId) {
    const user = auth.currentUser;
    const q = query(
        collection(db, 'messages'),
        where('listingId', '==', listingId),
    );
    const snap = await getDocs(q);
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(m => (m.senderId === user?.uid || m.receiverId === user?.uid))
        .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
}

export async function markMessageAsRead(messageId) {
    const docRef = doc(db, 'messages', messageId);
    await updateDoc(docRef, { read: true });
}

// Admin Panel Helpers
export async function getAllListings() {
    const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAllUsers() {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deleteUser(userId) {
    await deleteDoc(doc(db, 'users', userId));
}

export async function adminUpdateUser(userId, data) {
    // 1. Update User Document
    await updateDoc(doc(db, 'users', userId), data);

    // 2. Prepare sub-collection updates
    const syncUpdates = {};
    if (data.phone) syncUpdates.userPhone = data.phone;
    if (data.displayName) syncUpdates.userName = data.displayName;
    if (data.badges !== undefined) syncUpdates.userBadges = data.badges;

    if (Object.keys(syncUpdates).length > 0) {
        // Update all listings
        const lQuery = query(collection(db, 'listings'), where('userId', '==', userId));
        const lSnap = await getDocs(lQuery);
        const lPromises = lSnap.docs.map(d => updateDoc(d.ref, syncUpdates));

        // Update all posts
        const pQuery = query(collection(db, 'posts'), where('userId', '==', userId));
        const pSnap = await getDocs(pQuery);
        const pPromises = pSnap.docs.map(d => updateDoc(d.ref, syncUpdates));

        await Promise.all([...lPromises, ...pPromises]);
    }
}

export async function getAllMessages() {
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function toggleUserFeatured(userId, currentStatus) {
    const newStatus = !currentStatus;

    // 1. Update User Document
    await updateDoc(doc(db, 'users', userId), { isFeatured: newStatus });

    // 2. Update all listings logic
    const lQuery = query(collection(db, 'listings'), where('userId', '==', userId));
    const lSnap = await getDocs(lQuery);
    const lUpdates = lSnap.docs.map(d => updateDoc(d.ref, { userIsFeatured: newStatus }));

    // 3. Update all posts
    const pQuery = query(collection(db, 'posts'), where('userId', '==', userId));
    const pSnap = await getDocs(pQuery);
    const pUpdates = pSnap.docs.map(d => updateDoc(d.ref, { userIsFeatured: newStatus }));

    await Promise.all([...lUpdates, ...pUpdates]);

    return newStatus;
}

export async function getBotStatus() {
    const docRef = doc(db, 'settings', 'bot_config');
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
        return { postsEnabled: true, listingsEnabled: true };
    }
    return snap.data();
}

export async function updateBotStatus(key, value) {
    const docRef = doc(db, 'settings', 'bot_config');
    await setDoc(docRef, { [key]: value }, { merge: true });
}

export async function createAdminQuickUser({ displayName, phone, password }) {
    const userId = 'admin_quick_' + Date.now();
    await setDoc(doc(db, 'users', userId), {
        displayName,
        phone,
        password, // Stored in Firestore for admin visibility
        email: phone + '@eldenele.fake',
        isBot: true,
        createdAt: serverTimestamp(),
        isFeatured: false
    });
    return userId;
}

/**
 * Manual Admin Listing Creation (Admin Panel)
 */
export async function createAdminFakeListing({ title, category, concept, city, description, userName, userPhone, userId, userIsFeatured = false }, photoFiles = []) {
    // MAX 5 PHOTOS
    const limitedPhotos = photoFiles.slice(0, 5);
    let photoUrls = [];
    if (limitedPhotos && limitedPhotos.length > 0) {
        photoUrls = await uploadPhotos(limitedPhotos);
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const docRef = await addDoc(collection(db, 'listings'), {
        title,
        category,
        concept,
        city,
        description,
        userName,
        userPhone,
        userId: userId || ('admin_manual_bot_' + Date.now()),
        photos: photoUrls,
        views: Math.floor(Math.random() * 50),
        favoriteCount: 0,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
        status: 'active',
        isBot: true,
        userIsFeatured: userIsFeatured
    });
    return docRef.id;
}

/**
 * Visitor Tracking
 */
export async function logVisitor(data) {
    try {
        await addDoc(collection(db, 'visitors'), {
            ...data,
            timestamp: serverTimestamp()
        });
    } catch (e) {
        console.error("Ziyaretçi kaydı eklenemedi:", e);
    }
}

export async function getAllVisitors(limitCount = 200) {
    try {
        const q = query(collection(db, 'visitors'), orderBy('timestamp', 'desc'), limit(limitCount));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
        console.error("Ziyaretçi listesi getirilemedi:", e);
        return [];
    }
}
