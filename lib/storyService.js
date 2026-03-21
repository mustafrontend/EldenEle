import { db, auth } from './firebase';
import {
    collection, addDoc, getDocs, doc, query, orderBy,
    onSnapshot, serverTimestamp, where, deleteDoc, limit
} from 'firebase/firestore';
import { uploadPhotos } from './listingService';

/**
 * Subscribe to active stories (last 24 hours)
 */
export function subscribeStories(callback) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // We fetch stories from the last 24 hours
    // Note: serverTimestamp() is null initially on client, so we use a client-side date for filtering
    const q = query(
        collection(db, 'stories'),
        where('createdAt', '>=', twentyFourHoursAgo),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snap) => {
        const stories = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(stories);
    });
}

/**
 * Create a new story
 */
export async function createStory(photoFile, overrideData = null) {
    const user = auth.currentUser;
    if (!user) throw new Error("Giriş yapmanız gerekiyor.");

    if (!photoFile) throw new Error("Bir fotoğraf seçmelisiniz.");

    const urls = await uploadPhotos([photoFile]);
    if (urls.length === 0) throw new Error("Fotoğraf yüklenemedi.");

    const docRef = await addDoc(collection(db, 'stories'), {
        imageUrl: urls[0],
        userId: user.uid,
        userName: overrideData?.userName || user.displayName || 'Kullanıcı',
        userPhoto: overrideData?.userPhoto || user.photoURL || null,
        userBadges: overrideData?.userBadges || [],
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // For optional backend cleanup
    });

    return docRef.id;
}

/**
 * Simple cleanup for expired stories (Can be called by admin or periodically)
 */
export async function cleanupExpiredStories() {
    const now = new Date();
    const q = query(
        collection(db, 'stories'),
        where('expiresAt', '<', now)
    );
    const snap = await getDocs(q);
    const deletePromises = snap.docs.map(d => deleteDoc(doc(db, 'stories', d.id)));
    await Promise.all(deletePromises);
}
