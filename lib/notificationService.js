import { db, auth } from './firebase';
import {
    collection, addDoc, doc, query, orderBy,
    onSnapshot, serverTimestamp, updateDoc, where
} from 'firebase/firestore';

export function subscribeNotifications(userId, callback) {
    if (!userId) return () => { };
    const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(data);
    });
}

export async function createNotification(data) {
    // data: { userId (recipient), type, fromName, text, link }
    await addDoc(collection(db, 'notifications'), {
        ...data,
        read: false,
        createdAt: serverTimestamp()
    });
}

export async function markNotificationAsRead(id) {
    const ref = doc(db, 'notifications', id);
    await updateDoc(ref, { read: true });
}

export async function markAllNotificationsAsRead(userId) {
    // Note: For simplicity, checking client-side or we can just fetch and update.
    // In a production app, a Cloud Function or batch update is better.
}
