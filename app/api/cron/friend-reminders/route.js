import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const ULTRAMSG_INSTANCE = 'instance165307';
const ULTRAMSG_TOKEN = 'nr8o0qxv6dsqijmy';
const ULTRAMSG_URL = `https://api.ultramsg.com/${ULTRAMSG_INSTANCE}/messages/chat`;

async function sendWhatsApp(to, body) {
    try {
        let cleanPhone = to.replace(/\D/g, '');
        if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.slice(1);
        if (!cleanPhone.startsWith('90')) cleanPhone = '90' + cleanPhone;
        const finalPhone = '+' + cleanPhone;

        const urlencoded = new URLSearchParams();
        urlencoded.append("token", ULTRAMSG_TOKEN);
        urlencoded.append("to", finalPhone);
        urlencoded.append("body", body);
        urlencoded.append("priority", "10");

        const response = await fetch(ULTRAMSG_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: urlencoded
        });
        return await response.json();
    } catch (e) {
        console.error("Cron WhatsApp Error:", e);
        return null;
    }
}

export async function GET(request) {
    try {
        const results = { messages: 0, friendRequests: 0 };
        const nowSeconds = Math.floor(Date.now() / 1000);

        // --- 1. HANDLE UNREAD MESSAGES (15 MINUTE CHECK) ---
        // We look for messages sent at least 15 minutes ago that are still unread
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
        const msgQuery = query(
            collection(db, 'messages'),
            where('read', '==', false),
            where('notifiedAt', '==', null), // NEW: Only get those not yet notified
            where('createdAt', '<=', fifteenMinsAgo)
        );
        const msgSnap = await getDocs(msgQuery);

        if (!msgSnap.empty) {
            const msgGroups = {};
            msgSnap.docs.forEach(d => {
                const data = d.data();
                if (!msgGroups[data.receiverId]) msgGroups[data.receiverId] = {
                    ids: [],
                    msgs: []
                };
                msgGroups[data.receiverId].ids.push(d.id);
                msgGroups[data.receiverId].msgs.push(data);
            });

            for (const [userId, msgs] of Object.entries(msgGroups)) {
                const userDoc = await getDoc(doc(db, 'users', userId));
                if (!userDoc.exists()) continue;
                const userData = userDoc.data();

                // Only notify if we haven't sent a message reminder in the last 15 mins
                const lastMsgNotified = userData.lastMsgNotifiedAt?.seconds || 0;
                if (nowSeconds - lastMsgNotified < 900) continue; // 15 mins = 900s

                if (userData.phone) {
                    const senderNames = [...new Set(msgs.msgs.map(m => m.senderName || 'Bir kullanıcı'))].join(', ');
                    const message = `💬 *Elden Ele Mesaj Bildirimi* 💬\n\nMerhaba *${userData.displayName}*,\n\n*${senderNames}* tarafından gönderilen bazı yeni mesajların var ve henüz okumadın. Dostlarını bekletmek istemezsin değil mi?\n\n👉 Mesajlara bak: https://eldenelepati.com/profil?tab=mesajlarim\n\nPati dolu günler! 🐾`;

                    await sendWhatsApp(userData.phone, message);

                    // NEW: Update user AND individual messages
                    await updateDoc(doc(db, 'users', userId), { lastMsgNotifiedAt: serverTimestamp() });

                    for (const msgId of msgs.ids) {
                        try {
                            await updateDoc(doc(db, 'messages', msgId), { notifiedAt: serverTimestamp() });
                        } catch (e) {
                            console.error("Msg mark error:", e);
                        }
                    }
                    results.messages++;
                }
            }
        }

        // --- 2. HANDLE FRIEND REQUESTS (1 HOUR CHECK) ---
        // We run friend request check every hour
        const qFriend = query(
            collection(db, 'friendRequests'),
            where('status', '==', 'pending'),
            where('notifiedAt', '==', null) // NEW: Only un-notified requests
        );
        const friendSnap = await getDocs(qFriend);

        if (!friendSnap.empty) {
            const friendGroups = {};
            friendSnap.docs.forEach(d => {
                const data = d.data();
                if (!friendGroups[data.receiverId]) friendGroups[data.receiverId] = {
                    ids: [],
                    count: 0
                };
                friendGroups[data.receiverId].ids.push(d.id);
                friendGroups[data.receiverId].count++;
            });

            for (const [userId, count] of Object.entries(friendGroups)) {
                const userDoc = await getDoc(doc(db, 'users', userId));
                if (!userDoc.exists()) continue;
                const userData = userDoc.data();

                // Only notify for friend requests every 1 hour (3600s)
                const lastFriendNotified = userData.lastFriendNotifiedAt?.seconds || 0;
                if (nowSeconds - lastFriendNotified < 3600) continue;

                if (userData.phone) {
                    const message = `🐾 *Elden Ele Pati Bildirimi* 🐾\n\nMerhaba *${userData.displayName}*,\n\nSeni bekleyen *${count.count} adet* yeni arkadaşlık isteği var! Yeni pati dostlarıyla tanışmak için profiline göz atabilirsin.\n\n👉 Kabul et: https://eldenelepati.com/profil?tab=arkadaslarim\n\nMutlu günler! 🦴`;

                    await sendWhatsApp(userData.phone, message);

                    // NEW: Update user AND individual requests
                    await updateDoc(doc(db, 'users', userId), { lastFriendNotifiedAt: serverTimestamp() });

                    for (const reqId of count.ids) {
                        try {
                            await updateDoc(doc(db, 'friendRequests', reqId), { notifiedAt: serverTimestamp() });
                        } catch (e) {
                            console.error("Req mark error:", e);
                        }
                    }
                    results.friendRequests++;
                }
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error) {
        console.error("Unified Cron Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
