import { db, auth, messaging } from './firebase';
import {
    collection, addDoc, doc, query, orderBy,
    onSnapshot, serverTimestamp, updateDoc, where, getDoc
} from 'firebase/firestore';
import { getToken } from 'firebase/messaging';

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

export async function requestPushPermission(userId) {
    if (!messaging) {
        console.warn("FCM messaging modülü desteklenmiyor veya başlatılamadı.");
        return null;
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const currentToken = await getToken(messaging, {
                // Opsiyonel: vapidKey ekleyebilirsiniz
                // vapidKey: 'YOUR_PUBLIC_VAPID_KEY_HERE' 
            });

            if (currentToken) {
                // Token'ı Firestore'daki user dokümanına kaydet
                const userRef = doc(db, 'users', userId);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    const fcmTokens = userData.fcmTokens || [];
                    if (!fcmTokens.includes(currentToken)) {
                        await updateDoc(userRef, {
                            fcmTokens: [...fcmTokens, currentToken]
                        });
                        console.log("FCM Token kaydedildi:", currentToken);
                    } else {
                        console.log("FCM Token zaten kayıtlı.");
                    }
                }
                return currentToken;
            } else {
                console.log("Push token alınamadı, FCM konfigürasyonunu kontrol edin.");
            }
        } else {
            console.log("Bildirim izni reddedildi.");
        }
    } catch (error) {
        console.error("Push token alma işlemi başarısız:", error);
    }
    return null;
}
