import { NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, updateDoc, doc, addDoc, serverTimestamp, Timestamp, getDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: 'AIzaSyDsoDGJP83KRzDFYGyNMzyNKgwQKPORxDw',
    authDomain: 'bardbird-8d5e4.firebaseapp.com',
    projectId: 'bardbird-8d5e4',
    storageBucket: 'bardbird-8d5e4.firebasestorage.app',
    messagingSenderId: '713731391785',
    appId: '1:713731391785:web:da2bff9c7b6c6fa8f17738',
};

const serverApp = getApps().find((a) => a.name === 'server') || initializeApp(firebaseConfig, 'server');
const db = getFirestore(serverApp);

// UltraMsg Config
const ULTRAMSG_INSTANCE = 'instance165307';
const ULTRAMSG_TOKEN = 'nr8o0qxv6dsqijmy';
const ULTRAMSG_URL = `https://api.ultramsg.com/${ULTRAMSG_INSTANCE}/messages/chat`;

async function sendWhatsApp(to, body) {
    if (!to) return null;
    // Format to +90...
    let cleanPhone = to.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.slice(1);
    if (!cleanPhone.startsWith('90')) cleanPhone = '90' + cleanPhone;
    const finalPhone = '+' + cleanPhone;

    try {
        const urlencoded = new URLSearchParams();
        urlencoded.append("token", ULTRAMSG_TOKEN);
        urlencoded.append("to", finalPhone);
        urlencoded.append("body", body);
        urlencoded.append("priority", "10");

        const response = await fetch(ULTRAMSG_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: urlencoded,
            redirect: 'follow'
        });
        return await response.text();
    } catch (e) {
        console.error("UltraMsg Error:", e);
        return null;
    }
}

export async function GET() {
    try {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const oneHourAgoTs = Timestamp.fromDate(oneHourAgo);

        // 1. Get unread messages (we'll filter reminderSent in memory to avoid index errors)
        const q = query(
            collection(db, 'messages'),
            where('read', '==', false)
        );

        const snap = await getDocs(q);
        const triggered = [];

        for (const messageDoc of snap.docs) {
            try {
                const data = messageDoc.data();

                // Skip if reminder was already sent
                if (data.reminderSent === true) continue;

                // Safety: Check if mandatory fields exist
                if (!data.receiverId || !data.createdAt || typeof data.createdAt.seconds === 'undefined') {
                    console.log(`Message ${messageDoc.id} has missing fields, skipping.`);
                    continue;
                }

                // Secondary check for time
                if (data.createdAt.seconds <= oneHourAgoTs.seconds) {

                    // A. Get Receiver Data for Phone Number
                    const userRef = doc(db, 'users', data.receiverId);
                    const userSnap = await getDoc(userRef);
                    const userData = userSnap.exists() ? userSnap.data() : null;

                    // Alıcı (User) yoksa veya silindiyse işlemi atla
                    if (!userData) {
                        console.log(`User ${data.receiverId} not found, skipping reminder.`);
                        // Optional: Mark as reminderSent anyway to stop checking this dead message
                        await updateDoc(doc(db, 'messages', messageDoc.id), { reminderSent: true });
                        continue;
                    }

                    const receiverPhone = userData.phone || userData.phoneDigits;

                    // B. Get Listing Title if available
                    let listingTitle = "ilanınız";
                    if (data.listingId) {
                        try {
                            const lSnap = await getDoc(doc(db, 'listings', data.listingId));
                            if (lSnap.exists()) {
                                listingTitle = `'${lSnap.data().title}' ilanınız`;
                            }
                        } catch (e) {
                            console.error("Listing fetch error:", e);
                        }
                    }

                    // C. Send WhatsApp via UltraMsg
                    let waBody = '';
                    if (receiverPhone) {
                        waBody = `🐾 Merhaba ${userData.displayName || 'Pati Dostu'},\n\n${listingTitle} için '${data.senderName}' isimli kullanıcıdan yeni bir mesajınız var ve en az 1 saattir yanıtlanmayı bekliyor.\n\nMüsait olduğunuzda EldenEle uygulamasına girerek yanıt verebilirsiniz.\n\nKeyifli günler dileriz! ✨`;
                        await sendWhatsApp(receiverPhone, waBody);
                    }

                    // D. Internal Notification
                    try {
                        await addDoc(collection(db, 'notifications'), {
                            userId: data.receiverId,
                            type: 'reminder',
                            fromName: 'Pati Asistan',
                            text: waBody ? waBody.split('\n\n')[1] : `'${data.senderName}' isimli kullanıcıdan bir mesajınız var ve henüz okumadınız. Yanıt vermek için tıklayın.`,
                            link: `/profil?tab=messages`,
                            createdAt: serverTimestamp(),
                            read: false
                        });
                    } catch (e) {
                        console.error("Notification create error:", e);
                    }

                    // E. Mark as sent
                    await updateDoc(doc(db, 'messages', messageDoc.id), {
                        reminderSent: true
                    });

                    triggered.push({
                        id: messageDoc.id,
                        receiverId: data.receiverId,
                        phone: receiverPhone
                    });
                }
            } catch (innerError) {
                console.error(`Error processing message ${messageDoc.id}:`, innerError);
                // Continue to next message even if one fails
            }
        }

        return NextResponse.json({
            success: true,
            triggeredCount: triggered.length,
            triggered
        });

    } catch (error) {
        console.error("Agent reminder error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
