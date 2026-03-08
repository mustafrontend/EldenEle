import { db, auth } from './firebase';
import {
    collection, addDoc, getDocs, doc, getDoc, query, orderBy,
    onSnapshot, serverTimestamp, updateDoc, increment, deleteDoc, where, limit, getCountFromServer
} from 'firebase/firestore';
import { createNotification } from './notificationService';
import { uploadPhotos } from './listingService';

// --- POSTS ---

/**
 * Maintan a real-time feed of all community posts
 */
export function subscribePosts(callback) {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(data);
    });
}

export function subscribeNewPosts(callback, limitCount = 5) {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(limitCount));
    return onSnapshot(q, (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(data);
    });
}

/**
 * Get total counts for Users and Posts
 */
export async function getCommunityStats() {
    try {
        const usersSnap = await getCountFromServer(collection(db, 'users'));
        const postsSnap = await getCountFromServer(collection(db, 'posts'));
        return {
            totalUsers: usersSnap.data().count,
            totalPosts: postsSnap.data().count
        };
    } catch (e) {
        console.error("Stats Error:", e);
        return { totalUsers: 0, totalPosts: 0 };
    }
}

/**
 * Fetch a single post by ID
 */
export async function getPost(id) {
    const snap = await getDoc(doc(db, 'posts', id));
    if (snap.exists()) return { id: snap.id, ...snap.data() };
    return null;
}

/**
 * Create a new community post (Soru, Talep vb.)
 */
export async function createPost({ content, type, photoFiles = [], userIsFeatured = false }) {
    const user = auth.currentUser;
    if (!user) throw new Error("Giriş yapmanız gerekiyor.");

    let imageUrl = null;
    if (photoFiles.length > 0) {
        const urls = await uploadPhotos(photoFiles);
        if (urls.length > 0) imageUrl = urls[0];
    }

    const docRef = await addDoc(collection(db, 'posts'), {
        content,
        type, // 'soru' | 'talep' | 'diger'
        imageUrl,
        userId: user.uid,
        userName: user.displayName || 'Kullanıcı',
        userPhoto: user.photoURL || null,
        commentCount: 0,
        likeCount: 0,
        views: 0,
        createdAt: serverTimestamp(),
        userIsFeatured: userIsFeatured,
    });
    return docRef.id;
}

/**
 * Manual Bot Post (Admin Panel)
 */
export async function createAdminFakePost({ content, type, userName }) {
    const docRef = await addDoc(collection(db, 'posts'), {
        content,
        type,
        imageUrl: null,
        userId: `admin_bot_${Math.floor(Math.random() * 100000)}`,
        userName: userName,
        userPhoto: null,
        commentCount: 0,
        likeCount: 0,
        views: 0,
        createdAt: serverTimestamp(),
        isBot: true
    });
    return docRef.id;
}

export async function incrementPostView(id) {
    if (!id) return;
    try {
        await updateDoc(doc(db, 'posts', id), {
            views: increment(1)
        });
    } catch (e) {
        // Silently fail
    }
}

export async function deletePost(postId) {
    await deleteDoc(doc(db, 'posts', postId));
}

export async function adminUpdatePost(postId, data) {
    await updateDoc(doc(db, 'posts', postId), data);
}

export async function getUserPosts(userId) {
    const q = query(
        collection(db, 'posts'),
        where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

/**
 * Like/unlike a post (For simplicity, just incrementing for now,
 * a real system would need a subcollection to track who liked what)
 */
// ... (in togglePostLike)
export async function togglePostLike(postId) {
    const user = auth.currentUser;
    if (!user) return;

    const ref = doc(db, 'posts', postId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const data = snap.data();
    const likedBy = data.likedBy || [];

    if (likedBy.includes(user.uid)) {
        await updateDoc(ref, {
            likedBy: likedBy.filter(uid => uid !== user.uid),
            likeCount: Math.max(0, (data.likeCount || 0) - 1)
        });
    } else {
        await updateDoc(ref, {
            likedBy: [...likedBy, user.uid],
            likeCount: (data.likeCount || 0) + 1
        });

        // Notify author if it's someone else
        if (data.userId !== user.uid) {
            await createNotification({
                userId: data.userId, // recipient
                type: 'like',
                fromName: user.displayName || 'Bir kullanıcı',
                text: 'gönderinizi beğendi.',
                link: `/topluluk/${postId}`
            });
        }
    }
}

// --- COMMENTS ---

/**
 * Subscribe to comments for a specific post
 */
export function subscribeComments(postId, callback) {
    const q = query(
        collection(db, 'comments'),
        where('postId', '==', postId),
        orderBy('createdAt', 'asc')
    );
    return onSnapshot(q, (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(data);
    });
}

/**
 * Create a comment on a post
 */
export async function createComment({ postId, content }) {
    const user = auth.currentUser;
    if (!user) throw new Error("Giriş yapmanız gerekiyor.");

    // 1. Add comment doc
    const docRef = await addDoc(collection(db, 'comments'), {
        postId,
        content,
        userId: user.uid,
        userName: user.displayName || 'Kullanıcı',
        userPhoto: user.photoURL || null,
        createdAt: serverTimestamp(),
    });

    // 2. Increment post commentCount and get post data for notification
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
        const postData = postSnap.data();
        await updateDoc(postRef, {
            commentCount: increment(1)
        });

        // Notify author if it's someone else commenting
        if (postData.userId !== user.uid) {
            await createNotification({
                userId: postData.userId,
                type: 'comment',
                fromName: user.displayName || 'Bir kullanıcı',
                text: 'gönderinize yorum yaptı.',
                link: `/topluluk/${postId}`
            });
        }
    }

    return docRef.id;
}

// Admin Panel Helpers
export async function getAllPosts() {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
