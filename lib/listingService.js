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

export async function getCachedListings(forceRefresh = false) {
    const now = Date.now();
    let data;

    // L1: Client bellek cache'ini kontrol et (SPA navigasyonu için anlık)
    if (
        !forceRefresh &&
        _clientCache &&
        now - _clientCache.timestamp < CLIENT_CACHE_TTL
    ) {
        data = _clientCache.data;
    } else {
        // L2: Sunucu API — sunucunun kendi cache'i + HTTP Cache-Control header
        const url = forceRefresh ? '/api/listings?refresh=1' : `/api/listings?t=${now}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Listings API hatası: ' + res.status);
        data = await res.json();

        _clientCache = { data, timestamp: now };
    }

    // Her durumda userListingsCount'u istemci tarafında da hesaplayıp garanti altına alalım
    const counts = {};
    data.forEach(l => {
        if (l.userId) counts[l.userId] = (counts[l.userId] || 0) + 1;
    });

    return data.map(l => ({
        ...l,
        userListingsCount: l.userId ? (counts[l.userId] || 0) : 0
    }));
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

        const counts = {};
        data.forEach(l => {
            if (l.userId) counts[l.userId] = (counts[l.userId] || 0) + 1;
        });

        const enhancedData = data.map(l => ({
            ...l,
            userListingsCount: l.userId ? (counts[l.userId] || 0) : 0
        }));

        callback(enhancedData);
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

export async function deductUserToken(userId) {
    if (!userId) return;
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        tokens: increment(-1)
    });
}

export async function renewListing(listingId, userId) {
    if (!listingId || !userId) return;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const listingRef = doc(db, 'listings', listingId);
    await updateDoc(listingRef, {
        expiresAt: Timestamp.fromDate(expiresAt),
        updatedAt: serverTimestamp()
    });

    await deductUserToken(userId);
    invalidateListingsCache();
}

export async function boostListing(listingId, userId) {
    if (!listingId || !userId) return;

    // Deduct 3 tokens
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        tokens: increment(-3)
    });

    const listingRef = doc(db, 'listings', listingId);
    await updateDoc(listingRef, {
        userIsFeatured: true, // This enables the premium styling in ListingCard
        boostedAt: serverTimestamp()
    });

    invalidateListingsCache();
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

    if (data.userIsFeatured) {
        await deductUserToken(user.uid);
    }

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

export async function incrementWhatsAppClick(id) {
    if (!id) return;
    try {
        await updateDoc(doc(db, 'listings', id), {
            whatsappClicks: increment(1)
        });
    } catch (e) {
        console.error("WhatsApp click increment error:", e);
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
    const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    return data.map(l => ({ ...l, userListingsCount: data.length }));
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
export async function sendMessage({ listingId = 'direct', receiverId, text, imageFile = null, receiverName = null, receiverPhoto = null }) {
    const user = auth.currentUser;
    if (!user) return;

    let imageUrl = null;
    if (imageFile) {
        const urls = await uploadPhotos([imageFile]);
        imageUrl = urls[0];
    }

    await addDoc(collection(db, 'messages'), {
        listingId, // 'direct' for friend chat
        senderId: user.uid,
        senderName: user.displayName || 'Kullanıcı',
        senderPhoto: user.photoURL || null,
        receiverId,
        receiverName,  // Denormalized for list views
        receiverPhoto, // Denormalized for list views
        text,
        imageUrl,
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

        // Update all comments
        const cQuery = query(collection(db, 'comments'), where('userId', '==', userId));
        const cSnap = await getDocs(cQuery);
        const cPromises = cSnap.docs.map(d => updateDoc(d.ref, syncUpdates));

        // Update all stories
        const sQuery = query(collection(db, 'stories'), where('userId', '==', userId));
        const sSnap = await getDocs(sQuery);
        const sPromises = sSnap.docs.map(d => updateDoc(d.ref, syncUpdates));

        await Promise.all([...lPromises, ...pPromises, ...cPromises, ...sPromises]);
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
        const q = query(collection(db, 'visitors'), orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
        console.error("Ziyaretçi listesi getirilemedi:", e);
        return [];
    }
}

// News / Announcements
export async function getAllNews() {
    try {
        const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ ...d.data(), id: d.id })); // Make sure firestore doc ID is the 'id'
    } catch (e) {
        console.error("Error fetching news:", e);
        return [];
    }
}

export async function createNews(data) {
    const { id, ...rest } = data;
    if (id) {
        // Use provided ID as document ID to avoid clashing
        await setDoc(doc(db, 'news', id), {
            ...rest,
            createdAt: serverTimestamp()
        });
    } else {
        await addDoc(collection(db, 'news'), {
            ...rest,
            createdAt: serverTimestamp()
        });
    }
}

export async function updateNews(id, data) {
    if (!id) throw new Error("Duyuru ID bulunamadı.");
    const docRef = doc(db, 'news', id);
    await setDoc(docRef, data, { merge: true });
}

export async function deleteNews(id) {
    await deleteDoc(doc(db, 'news', id));
}

// ─────────────────────────────────────────────────────────────────────────────
// ─── Social & Location (Patimetre) ───────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

export async function updateUserLocation(userId, coords) {
    if (!userId || !coords) return;
    try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
            location: {
                lat: coords.lat,
                lng: coords.lng,
                updatedAt: serverTimestamp()
            }
        }, { merge: true });
    } catch (e) {
        console.error("Location update failed:", e);
    }
}

export async function getNearbyPeople(userId, currentLat, currentLng) {
    try {
        const q = query(
            collection(db, 'users'),
            limit(100)
        );
        const snap = await getDocs(q);
        const users = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(u => u.id !== userId && u.location);

        // Filter by distance (~50km radius: 0.5 degrees roughly)
        const radius = 0.5;
        return users.filter(u => {
            const dLat = Math.abs(u.location.lat - currentLat);
            const dLng = Math.abs(u.location.lng - currentLng);
            return dLat < radius && dLng < radius;
        });
    } catch (e) {
        console.error("Fetch nearby people failed:", e);
        return [];
    }
}

export async function sendFriendRequest(senderId, receiverId) {
    if (!senderId || !receiverId) return;
    try {
        // 1. Check if already friends
        const senderDoc = await getDoc(doc(db, 'users', senderId));
        const friends = senderDoc.data()?.friends || [];
        if (friends.includes(receiverId)) return { error: 'Bu kişiyle zaten arkadaştınız.' };

        // 2. Check if there's already a pending request (sent or received)
        const qSent = query(
            collection(db, 'friendRequests'),
            where('senderId', '==', senderId),
            where('receiverId', '==', receiverId),
            where('status', '==', 'pending')
        );
        const qReceived = query(
            collection(db, 'friendRequests'),
            where('senderId', '==', receiverId),
            where('receiverId', '==', senderId),
            where('status', '==', 'pending')
        );

        const [sentSnap, receivedSnap] = await Promise.all([getDocs(qSent), getDocs(qReceived)]);

        if (!sentSnap.empty) return { error: 'İstek zaten gönderildi, bekliyor.' };
        if (!receivedSnap.empty) return { error: 'Bu kişiden zaten bir arkadaşlık isteği almışsınız.' };

        await addDoc(collection(db, 'friendRequests'), {
            senderId,
            receiverId,
            status: 'pending',
            createdAt: serverTimestamp()
        });
        return { success: true };
    } catch (e) {
        return { error: e.message };
    }
}

export async function getFriendRequests(userId) {
    const q = query(
        collection(db, 'friendRequests'),
        where('receiverId', '==', userId),
        where('status', '==', 'pending')
    );
    const snap = await getDocs(q);
    const requests = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const enriched = await Promise.all(requests.map(async req => {
        const uDoc = await getDoc(doc(db, 'users', req.senderId));
        return { ...req, sender: uDoc.exists() ? { id: uDoc.id, ...uDoc.data() } : null };
    }));
    return enriched;
}

export function subscribeFriendRequests(userId, callback) {
    const q = query(
        collection(db, 'friendRequests'),
        where('receiverId', '==', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, async (snap) => {
        const requests = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const enriched = await Promise.all(requests.map(async req => {
            const uDoc = await getDoc(doc(db, 'users', req.senderId));
            return { ...req, sender: uDoc.exists() ? { id: uDoc.id, ...uDoc.data() } : null };
        }));
        callback(enriched);
    });
}

export async function getFriends(userId) {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const friendIds = userDoc.data()?.friends || [];
    if (friendIds.length === 0) return [];

    const friendDocs = await Promise.all(friendIds.map(fid => getDoc(doc(db, 'users', fid))));
    return friendDocs.filter(d => d.exists()).map(d => ({ id: d.id, ...d.data() }));
}

export async function rejectFriendRequest(requestId) {
    try {
        await updateDoc(doc(db, 'friendRequests', requestId), { status: 'rejected' });
        return { success: true };
    } catch (e) {
        return { error: e.message };
    }
}

export async function acceptFriendRequest(requestId, senderId, receiverId) {
    try {
        await updateDoc(doc(db, 'friendRequests', requestId), { status: 'accepted' });

        const senderRef = doc(db, 'users', senderId);
        const receiverRef = doc(db, 'users', receiverId);

        const sDoc = await getDoc(senderRef);
        const rDoc = await getDoc(receiverRef);

        const sf = sDoc.data()?.friends || [];
        const rf = rDoc.data()?.friends || [];

        if (!sf.includes(receiverId)) await updateDoc(senderRef, { friends: [...sf, receiverId] });
        if (!rf.includes(senderId)) await updateDoc(receiverRef, { friends: [...rf, senderId] });

        return { success: true };
    } catch (e) {
        return { error: e.message };
    }
}

export async function getSentFriendRequests(userId) {
    const q = query(
        collection(db, 'friendRequests'),
        where('senderId', '==', userId),
        where('status', '==', 'pending')
    );
    const snap = await getDocs(q);
    const requests = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const userDoc = await getDoc(doc(db, 'users', userId));
    const friends = userDoc.data()?.friends || [];

    // Filter out if they are already friends (safety check) and enrich
    const enriched = [];
    for (const req of requests) {
        if (friends.includes(req.receiverId)) {
            // Cleanup: if they are already friends, update request status to accepted
            updateDoc(doc(db, 'friendRequests', req.id), { status: 'accepted' });
            continue;
        }
        const uDoc = await getDoc(doc(db, 'users', req.receiverId));
        enriched.push({ ...req, receiver: uDoc.exists() ? { id: uDoc.id, ...uDoc.data() } : null });
    }
    return enriched;
}

export async function getDiscoverUsers(limitCount = 1000) {
    try {
        const user = auth.currentUser;
        let friends = [];

        if (user) {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                friends = userDoc.data()?.friends || [];
            }
        }

        // Fetch a large pool to allow full search
        const q = query(
            collection(db, 'users'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );
        const snap = await getDocs(q);

        const allFetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Filter: Not me AND Not already a friend
        const filtered = allFetched.filter(u => {
            const isMe = user && u.id === user.uid;
            const isFriend = friends.includes(u.id);
            return !isMe && !isFriend;
        });

        return filtered;
    } catch (e) {
        console.error("Fetch discover users failed:", e);
        // Fallback: If orderBy fails (missing index or field), try without it
        try {
            const qBasic = query(collection(db, 'users'), limit(limitCount));
            const snapBasic = await getDocs(qBasic);
            const user = auth.currentUser;
            return snapBasic.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(u => !user || u.id !== user.uid);
        } catch (innerE) {
            return [];
        }
    }
}
