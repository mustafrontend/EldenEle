importScripts("https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js");

// Firebase projenize ait konfigürasyon bilgilerini girin
const firebaseConfig = {
    apiKey: "AIzaSyDsoDGJP83KRzDFYGyNMzyNKgwQKPORxDw",
    authDomain: "bardbird-8d5e4.firebaseapp.com",
    databaseURL: "https://bardbird-8d5e4-default-rtdb.firebaseio.com",
    projectId: "bardbird-8d5e4",
    storageBucket: "bardbird-8d5e4.firebasestorage.app",
    messagingSenderId: "713731391785",
    appId: "1:713731391785:web:da2bff9c7b6c6fa8f17738",
    measurementId: "G-K0CZ2Y8J4S"
};

try {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
        console.log("[firebase-messaging-sw.js] Arka planda mesaj alındı:", payload);

        const notificationTitle = payload.notification?.title || "EldenEle.pet'ten Yeni Bildirim";
        const notificationOptions = {
            body: payload.notification?.body,
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            data: payload.data
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
    });
} catch (error) {
    console.log("Firebase SW init failed: ", error);
}

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: "window" }).then((windowClients) => {
            const link = event.notification.data?.link || "/";
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes("EldenEle.pet") && "focus" in client) {
                    client.focus();
                    return client.navigate(link);
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(link);
            }
        })
    );
});
